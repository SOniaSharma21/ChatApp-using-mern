import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken"; // ✅ FIXED
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messagesRoutes.js";
import { Server } from "socket.io";
import callRoutes from "./routes/callRoutes.js"; // 🔥 ADD THIS
const app = express();

// ✅ Middleware
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Routes
app.get("/", (req, res) => res.send("Server running 🚀"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/calls", callRoutes); // 🔥 ADD THIS

// ✅ Server + Socket
const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: "*" },
});

export const userSocketMap = {};

// ✅ AUTH MIDDLEWARE
io.use((socket, next) => {
  try {
    const { token, userId } = socket.handshake.auth;

    if (!token || !userId) {
      return next(new Error("No token or userId"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    socket.userId = userId;

    next();
  } catch (err) {
    console.error("Socket JWT error:", err.message);
    next(new Error("Invalid token"));
  }
});

// ✅ CONNECTION
io.on("connection", (socket) => {
  const userId = socket.userId;

  console.log("User connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getonlineUser", Object.keys(userSocketMap));

  // 🔥 CALL USER
  socket.on("call-user", ({ offer, to, type }) => {
    const targetSocket = userSocketMap[to];

    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", {
        offer,
        from: userId,
        type,
      });
    }
  });

  // 🔥 ANSWER CALL
  socket.on("answer-call", ({ answer, to }) => {
    const targetSocket = userSocketMap[to];

    if (targetSocket) {
      io.to(targetSocket).emit("call-answered", {
        answer,
      });
    }
  });

  // 🔥 ICE CANDIDATE
  socket.on("ice-candidate", ({ candidate, to }) => {
    const targetSocket = userSocketMap[to];

    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", {
        candidate,
      });
    }
  });

  // 🔥 DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);

    delete userSocketMap[userId];

    io.emit("getonlineUser", Object.keys(userSocketMap));
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () =>
      console.log(`Server running on PORT: ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB error:", err);
    process.exit(1);
  });