const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { Server } = require("socket.io"); 
const { onlineUsers } = require('./socket/socket');
const { setIO } = require('./socket/io');
const { deliverNotification } = require("./services/notificationDelivery");
const Notification = require('./modals/notification');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
setIO(io);


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

  
      ;(async () => {
        try {
          const pendingNotifications = await Notification.find({
            recipientId: userId,
            status: 'created'
          }).sort({ createdAt: 1 });

          for (const notification of pendingNotifications) {
            await deliverNotification(io, onlineUsers, notification);
          }
        } catch (err) {
          console.error('Failed to deliver pending notifications:', err);
        }
      })();
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

module.exports = {
  io
}

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
