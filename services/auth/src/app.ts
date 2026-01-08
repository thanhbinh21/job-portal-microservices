import express from "express";
import authRouters from "./routers/auth.js";
import { connectKafka } from "./producer.js";

const app = express();
app.use(express.json());

connectKafka();
app.use("/api/auth", authRouters);

export default app;