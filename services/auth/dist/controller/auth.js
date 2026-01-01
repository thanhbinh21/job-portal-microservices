import axios from "axios";
import getBuffer from "../utils/buffer.js";
import { sql } from "../utils/db.js";
import ErrorHandle from "../utils/errorHandle.js";
import { TryCatch } from "../utils/TryCatch.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const registerUser = TryCatch(async (req, res, next) => {
    const { name, email, password, phoneNumber, role, bio } = req.body;
    if (!name || !email || !password || !phoneNumber || !role) {
        throw new ErrorHandle(400, "All fields are required");
    }
    const existingUser = await sql `
        SELECT * FROM users WHERE email = ${email}
    `;
    if (existingUser.length > 0) {
        throw new ErrorHandle(409, "User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let registerUser;
    if (role === "recruiter") {
        const result = await sql `
        INSERT INTO users (name, email, password, phone_number, role) 
        values (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}) 
        RETURNING user_id, name, email, phone_number, role, created_at;
    `;
        console.log("Insert result for recruiter:", result);
        registerUser = result[0];
    }
    else if (role === "jobseeker") {
        const file = req.file;
        if (!file) {
            throw new ErrorHandle(400, "Profile picture is required for jobseekers");
        }
        const fileBuffer = getBuffer(file);
        if (!fileBuffer || !fileBuffer.content) {
            throw new ErrorHandle(500, "Error processing profile picture");
        }
        const { data } = await axios.post(`${process.env.UPLOAD_SERVICE}/api/utils/upload`, {
            buffer: fileBuffer.content,
        });
        const result = await sql `
        INSERT INTO users (name, email, password, phone_number, role, bio, resume, resume_public_id) 
        values (${name}, ${email}, ${hashedPassword}, ${phoneNumber}, ${role}, ${bio || null}, ${data.url}, ${data.public_id}) 
        RETURNING user_id, name, email, phone_number, role, bio, resume, created_at;
    `;
        registerUser = result[0];
    }
    else {
        throw new ErrorHandle(400, `Invalid role: ${role}. Must be 'recruiter' or 'jobseeker'`);
    }
    const token = jwt.sign({ userId: registerUser?.user_id }, //payload
    process.env.JWT_SEC, //secret key
    { expiresIn: "7d" } // date expiration
    );
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        registerUser,
        token,
    });
});
export const loginUser = TryCatch(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ErrorHandle(400, "Email and password are required");
    }
    const users = await sql `
      SELECT u.user_id, u.name, u.email, u.password, u.phone_number, u.role, u.bio, u.resume, u.profile_picture, u.subscription, 
      ARRAY_AGG(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL) as skills 
      FROM users u 
      LEFT JOIN user_skills us ON u.user_id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.skill_id
      WHERE u.email = ${email} 
      GROUP BY u.user_id;`;
    if (users.length === 0) {
        throw new ErrorHandle(401, "Invalid email or password 1");
    }
    const userLogin = users[0];
    const isPasswordValid = await bcrypt.compare(password, userLogin.password);
    if (!isPasswordValid) {
        throw new ErrorHandle(401, "Invalid email or password 2");
    }
    userLogin.skills = userLogin.skills.filter((skill) => skill !== null);
    const token = jwt.sign({ userId: userLogin?.user_id }, //payload
    process.env.JWT_SEC, //secret key
    { expiresIn: "7d" } // date expiration
    );
    userLogin.password = undefined;
    res.status(200).json({
        message: "User login successfully",
        userLogin,
        token,
    });
});
