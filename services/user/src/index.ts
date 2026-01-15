import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routers/user";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/users", userRoutes);

app.listen(process.env.PORT, () => {
    console.log(`🚀 User service running on port ${process.env.PORT}`);
});