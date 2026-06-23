import express from "express";
import cors from "cors";
import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

//config
import { connectDB } from "./config/db.js";

//Routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import propertyRouter from "./routes/property.routes.js";
import inquiryRouter from "./routes/inquiry.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import adminRouter from "./routes/admin.routes.js";
import chatRouter from "./routes/chat.routes.js";
import contactRouter from "./routes/contact.route.js";

const app = express();
const PORT = 5000;

//Database connection
connectDB();

//middlewares
// Build allowed origins from defaults and environment variables
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : [];
const frontendUrl = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.trim()
  : null;
// include deployed frontend by default to avoid CORS blocking for Vercel deploy
const allowedOrigins = [
  "http://localhost:5173",
  "https://estatex-three.vercel.app",
  ...envOrigins,
  frontendUrl,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

//Routes

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/property", propertyRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/admin", adminRouter);
app.use("/api/chat", chatRouter);
app.use("/api/contact", contactRouter);

app.get("/", (req, res) => {
  res.json({ message: "API is working" });
});

// Socket.IO setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.chatId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {});
});

server.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
});
