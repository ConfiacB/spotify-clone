import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import { createServer } from "http";
import cron from "node-cron";
import fs from "fs";
import { initializeSocket } from "./lib/socket.js";

import { connectDB } from "./lib/db.js";

import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json()); // to parse JSON bodies
app.use(clerkMiddleware()); // this will add auth to the request object => req.auth.userId
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "tmp"),
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  })
); // to parse file uploads

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        console.log("error", err);
        return;
      }
      for (const file of files) {
        fs.unlink(path.join(tempDir, file), (err) => {});
      }
    });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

// error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

httpServer.listen(5000, () => {
  console.log("Server is running on port " + PORT);
  connectDB();
});
