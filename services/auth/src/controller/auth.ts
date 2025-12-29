import { sql } from "../utils/db.js";
import ErrorHandle from "../utils/errorHandle.js";
import { TryCatch } from "../utils/TryCatch.js";
import bcrypt from "bcrypt";

export const registerUser = TryCatch(async (req, res, next) => {
  const { name, email, password, phoneNumber, role, bio } = req.body;

  if (!name || !email || !password || !phoneNumber || !role) {
    throw new ErrorHandle(400, "All fields are required");
  }

  const existingUser = await sql`
        SELECT * FROM users WHERE email = ${email}
    `; // Replace with actual user lookup logic

  if (existingUser.length > 0) {
    throw new ErrorHandle(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let registerUser;

  if (role === "recruiter") {
    const [newUser] = await sql`
        INSERT INTO users (name, email, password, phone_number, role) 
        values (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}) 
        RETURNING user_id, name, email, phone_number, role, created_at;
    `;
    registerUser = newUser;
  }else if (role === "jobseeker") {
    const file = req.file;

  }


});
