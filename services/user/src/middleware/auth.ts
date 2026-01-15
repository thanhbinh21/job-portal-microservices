import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { sql } from "../utils/db";

interface User {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  bio: string | null;
  resume: string | null;
  resume_public_id: string | null;
  profile_pic: string | null;
  profile_pic_public_id: string | null;
  skills: string[] | null;
  subsccription: string | null;
}

export interface AuthRequest extends Request {
  user?: User;
}
export const isAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized: Miss Header" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decodedPayload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decodedPayload || !decodedPayload.user) {
      res.status(401).json({ message: "Unauthorized: Invalid Token" });
      return;
    }

    const users = await sql`
        SELECT u.user_id, u.name, u.email, u.phone_number, u.role, u.bio, u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.subscription,
        ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
        FROM users u
        LEFT JOIN user_skills us ON u.user_id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.skill_id
        WHERE u.user_id = ${decodedPayload.id}
        GROUP BY u.user_id;
        `;

    if (users.length === 0) {
      res.status(401).json({ message: "Unauthorized: User Not Found" });
      return;
    }

    const user = users[0] as User;

    req.user = user;
    next();

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized: Please Login Again" });
  }
};
