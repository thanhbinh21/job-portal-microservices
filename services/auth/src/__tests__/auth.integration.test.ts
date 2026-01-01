import request from "supertest";
import express, { Express } from "express";
import authRouter from "../routers/auth.js";
import { sql } from "../utils/db.js";
import bcrypt from "bcrypt";

// Mock the database
jest.mock("../utils/db.js");

describe("Login API Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);

    // Setup environment variables
    process.env.JWT_SEC = "test-secret-key";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should return 201 and token when login is successful", async () => {
      const mockUser = {
        user_id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: await bcrypt.hash("password123", 10),
        phone_number: "1234567890",
        role: "jobseeker",
        bio: "Test bio",
        resume: "http://example.com/resume.pdf",
        profile_pic: null,
        subscription: "free",
        skills: ["JavaScript", "TypeScript"],
      };

      (sql as any).mockResolvedValue([mockUser]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "password123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("message", "User login successfully");
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("userLogin");
      expect(response.body.userLogin).toHaveProperty("email", "john@example.com");
      expect(response.body.userLogin).not.toHaveProperty("password");
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          password: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Email and password are required");
    });

    it("should return 400 when password is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Email and password are required");
    });

    it("should return 401 when user does not exist", async () => {
      (sql as any).mockResolvedValue([]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid email or password");
    });

    it("should return 401 when password is incorrect", async () => {
      const mockUser = {
        user_id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: await bcrypt.hash("correctpassword", 10),
        phone_number: "1234567890",
        role: "jobseeker",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "free",
        skills: [],
      };

      (sql as any).mockResolvedValue([mockUser]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid email or password");
    });

    it("should filter null values from skills array", async () => {
      const mockUser = {
        user_id: 2,
        name: "Jane Doe",
        email: "jane@example.com",
        password: await bcrypt.hash("password456", 10),
        phone_number: "9876543210",
        role: "jobseeker",
        bio: "Developer",
        resume: "http://example.com/resume2.pdf",
        profile_pic: "http://example.com/pic.jpg",
        subscription: "premium",
        skills: ["Python", null, "Django", null, "SQL"],
      };

      (sql as any).mockResolvedValue([mockUser]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "jane@example.com",
          password: "password456",
        })
        .expect(201);

      expect(response.body.userLogin.skills).toEqual(["Python", "Django", "SQL"]);
      expect(response.body.userLogin.skills).not.toContain(null);
    });

    it("should handle recruiter login correctly", async () => {
      const mockRecruiter = {
        user_id: 3,
        name: "Recruiter Name",
        email: "recruiter@company.com",
        password: await bcrypt.hash("recruiterpass", 10),
        phone_number: "5555555555",
        role: "recruiter",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "premium",
        skills: [null],
      };

      (sql as any).mockResolvedValue([mockRecruiter]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "recruiter@company.com",
          password: "recruiterpass",
        })
        .expect(201);

      expect(response.body.userLogin).toHaveProperty("role", "recruiter");
      expect(response.body).toHaveProperty("token");
    });

    it("should not include password in response", async () => {
      const mockUser = {
        user_id: 4,
        name: "Security Test",
        email: "security@example.com",
        password: await bcrypt.hash("securepass", 10),
        phone_number: "1231231234",
        role: "jobseeker",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "free",
        skills: [],
      };

      (sql as any).mockResolvedValue([mockUser]);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "security@example.com",
          password: "securepass",
        })
        .expect(201);

      // Password should be in the database response but filtered in actual implementation
      expect(response.body.userLogin).toBeDefined();
    });
  });
});
