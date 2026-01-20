const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./src/config/db");
const app = require("./src/app");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // TEMP allow all
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Admin connected:", socket.id);
});

app.set("io", io);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
