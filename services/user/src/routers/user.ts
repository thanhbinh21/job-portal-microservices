import e from "express";
import express from "express";
import { isAuth } from "../middleware/auth";
import { getMyProfile } from "../controllers/user";

const router = express.Router();

router.get("/me", isAuth, getMyProfile);

export default router;