import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { TryCatch } from "../utils/TryCatch";

export const getMyProfile = TryCatch(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    res.status(200).json({ user });
});