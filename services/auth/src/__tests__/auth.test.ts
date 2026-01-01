import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginUser } from "../controller/auth.js";
import { sql } from "../utils/db.js";
import ErrorHandle from "../utils/errorHandle.js";

// Mock dependencies
jest.mock("../utils/db.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("loginUser", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request mock
    req = {
      body: {},
    };

    // Setup response mock
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };

    // Setup next function mock
    next = jest.fn();

    // Setup environment variable
    process.env.JWT_SEC = "test-secret-key";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Successful Login", () => {
    it("should login user successfully with valid credentials", async () => {
      const mockUser = {
        user_id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone_number: "1234567890",
        role: "jobseeker",
        bio: "Test bio",
        resume: "http://example.com/resume.pdf",
        profile_pic: "http://example.com/pic.jpg",
        subscription: "free",
        skills: ["JavaScript", "TypeScript", null],
      };

      const mockToken = "mock-jwt-token";

      req.body = {
        email: "john@example.com",
        password: "password123",
      };

      // Mock database response
      (sql as any).mockResolvedValue([mockUser]);

      // Mock bcrypt comparison
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await loginUser(req as Request, res as Response, next);

      // Assertions
      expect(sql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(String)])
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword123"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        "test-secret-key",
        { expiresIn: "7d" }
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "User login successfully",
        userLogin: expect.objectContaining({
          user_id: 1,
          email: "john@example.com",
          skills: ["JavaScript", "TypeScript"],
        }),
        token: mockToken,
      });
    });

    it("should filter out null skills from user data", async () => {
      const mockUser = {
        user_id: 2,
        name: "Jane Doe",
        email: "jane@example.com",
        password: "hashedPassword456",
        phone_number: "0987654321",
        role: "recruiter",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "premium",
        skills: ["Python", null, "SQL", null],
      };

      req.body = {
        email: "jane@example.com",
        password: "securepass",
      };

      (sql as any).mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("token-xyz");

      await loginUser(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userLogin: expect.objectContaining({
            skills: ["Python", "SQL"],
          }),
        })
      );
    });
  });

  describe("Validation Errors", () => {
    it("should throw error when email is missing", async () => {
      req.body = {
        password: "password123",
      };

      await loginUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Email and password are required",
        })
      );
    });

    it("should throw error when password is missing", async () => {
      req.body = {
        email: "john@example.com",
      };

      await loginUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Email and password are required",
        })
      );
    });

    it("should throw error when both email and password are missing", async () => {
      req.body = {};

      await loginUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Email and password are required",
        })
      );
    });
  });

  describe("Authentication Errors", () => {
    it("should throw error when user does not exist", async () => {
      req.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // Mock empty database response
      (sql as any).mockResolvedValue([]);

      await loginUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Invalid email or password",
        })
      );
    });

    it("should throw error when password is incorrect", async () => {
      const mockUser = {
        user_id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        phone_number: "1234567890",
        role: "jobseeker",
        bio: "Test bio",
        resume: "http://example.com/resume.pdf",
        profile_pic: "http://example.com/pic.jpg",
        subscription: "free",
        skills: ["JavaScript"],
      };

      req.body = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      (sql as any).mockResolvedValue([mockUser]);
      // Mock bcrypt to return false (password doesn't match)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await loginUser(req as Request, res as Response, next);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedPassword123"
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Invalid email or password",
        })
      );
    });
  });

  describe("Database Errors", () => {
    it("should handle database connection errors", async () => {
      req.body = {
        email: "john@example.com",
        password: "password123",
      };

      const dbError = new Error("Database connection failed");
      (sql as any).mockRejectedValue(dbError);

      await loginUser(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with no skills", async () => {
      const mockUser = {
        user_id: 3,
        name: "New User",
        email: "newuser@example.com",
        password: "hashedPassword789",
        phone_number: "1112223333",
        role: "jobseeker",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "free",
        skills: [null],
      };

      req.body = {
        email: "newuser@example.com",
        password: "newpass",
      };

      (sql as any).mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("token-abc");

      await loginUser(req as Request, res as Response, next);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userLogin: expect.objectContaining({
            skills: [],
          }),
        })
      );
    });

    it("should handle recruiter role login", async () => {
      const mockRecruiter = {
        user_id: 4,
        name: "Recruiter User",
        email: "recruiter@example.com",
        password: "hashedPasswordRec",
        phone_number: "4445556666",
        role: "recruiter",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "premium",
        skills: [null],
      };

      req.body = {
        email: "recruiter@example.com",
        password: "recruiterpass",
      };

      (sql as any).mockResolvedValue([mockRecruiter]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("token-recruiter");

      await loginUser(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User login successfully",
          userLogin: expect.objectContaining({
            role: "recruiter",
          }),
          token: "token-recruiter",
        })
      );
    });

    it("should handle case-sensitive email correctly", async () => {
      req.body = {
        email: "John@Example.com",
        password: "password123",
      };

      (sql as any).mockResolvedValue([]);

      await loginUser(req as Request, res as Response, next);

      expect(sql).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe("JWT Token Generation", () => {
    it("should generate token with correct payload and expiration", async () => {
      const mockUser = {
        user_id: 5,
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        phone_number: "1234567890",
        role: "jobseeker",
        bio: null,
        resume: null,
        profile_pic: null,
        subscription: "free",
        skills: [],
      };

      req.body = {
        email: "test@example.com",
        password: "testpass",
      };

      (sql as any).mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("generated-token");

      await loginUser(req as Request, res as Response, next);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 5 },
        process.env.JWT_SEC,
        { expiresIn: "7d" }
      );
    });
  });
});
