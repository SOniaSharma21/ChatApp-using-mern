import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messagesRoutes.js";
import { Server } from "socket.io";

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods:["GET","POST","PUT","DELETE","PATCH"],// frontend port
    credentials: true, allowedHeaders:["Content-Type","Authorization"]
  })
);

// Routes
app.get("/", (req, res) => res.send("Welcome! 🚀 Server is running."));
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: "*" } });
export const userSocketMap = {};


io.use((socket, next) => {
  try {
    const { token } = socket.handshake.auth;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user info
    next();
  } catch (err) {
    console.error("Socket JWT error:", err.message);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userID = socket.handshake.auth.userId;
  console.log("User connected:", userID);

  if (userID) userSocketMap[userID] = socket.id;

  io.emit("getonlineUser", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userID);
    delete userSocketMap[userID];
    io.emit("getonlineUser", Object.keys(userSocketMap));
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1); // stop server if DB fails
  });
