import axios from "axios";
import getBuffer from "../utils/buffer.js";
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
    `; 

  if (existingUser.length > 0) {
    throw new ErrorHandle(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let registerUser;

  if (role === "recruiter") {
    const result = await sql`
        INSERT INTO users (name, email, password, phone_number, role) 
        values (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}) 
        RETURNING user_id, name, email, phone_number, role, created_at;
    `;
    console.log("Insert result for recruiter:", result);
    registerUser = result[0];
  }else if (role === "jobseeker") {

    const file = req.file;
    if(!file){
      throw new ErrorHandle(400, "Profile picture is required for jobseekers");
    }

    const fileBuffer =getBuffer(file);

    if(!fileBuffer || !fileBuffer.content ){
      throw new ErrorHandle(500, "Error processing profile picture");
    }

    const {data} = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, {
      buffer: fileBuffer.content
    })

    const result = await sql`
        INSERT INTO users (name, email, password, phone_number, role, bio, resume, resume_public_id) 
        values (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}, ${bio || null}, ${data.url}, ${data.public_id}) 
        RETURNING user_id, name, email, phone_number, role, bio, resume, created_at;
    `;

      
  } else {
    console.log("Invalid role provided:", role);
    throw new ErrorHandle(400, `Invalid role: ${role}. Must be 'recruiter' or 'jobseeker'`);
  }

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: registerUser
  });
  


});
