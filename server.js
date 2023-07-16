const app = require('./app');
const databaseConnect = require('./config/database');
const cloudinary = require('cloudinary').v2;
const { Server } = require("socket.io");
const http = require("http");
require('dotenv').config();
const port = process.env.PORT;

// database connect
databaseConnect();

// cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join-hostel-chat", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined chats of hostel ID: ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.hostel).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
    console.log(`Server started at port:${port}`);
})