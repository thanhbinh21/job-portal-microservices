import express from "express";
import authRouters from "./routers/auth.js";
const app = express();
app.use("/api/auth", authRouters);
export default app;
