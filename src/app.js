const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { Server } = require("socket.io"); 

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const socketAuth = require('./middlewares/socketAuth');
io.use(socketAuth);

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 3000;

const authRouter = require('./router/auth');
const notificationRouter = require('./router/notification');
const actionRouter = require('./router/action');

app.use('/', authRouter);
app.use('/notifications', notificationRouter);
app.use('/', actionRouter);


const onlineUsers = new Map();
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

function getUserSockets(userId) {
  return onlineUsers.get(userId) || new Set();
}

io.on("connection", (socket) => {
   const userId = socket.userId;
    if(!userId){
        console.log('User ID not found on socket');
        socket.disconnect();
        return;
    }
    if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
    onlineUsers.get(userId).add(socket.id);

  
  console.log(
    `✅ User ${userId} ONLINE | Active sockets: ${onlineUsers.get(userId).size}`
  );

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    if(!sockets) return;
    sockets.delete(socket.id);
     if (sockets.size === 0) {
      onlineUsers.delete(userId);
      console.log(`🔴 User ${userId} OFFLINE`);
    } else {
      console.log(
        `🟡 User ${userId} still online | Remaining sockets: ${sockets.size}`
      );
    }
  });
});



app.use((err, req, res, next) => {
    res.status(err.statusCode || 400).json({
        error: err.message || 'Something went wrong'
    });
});

connectDB()
    .then(() => {
        console.log('Database connected successfully');
        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Database connection failed', err);
        process.exit(1);
    });
