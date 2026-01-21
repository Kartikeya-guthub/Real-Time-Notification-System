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

app.use('/', authRouter);


io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id}, User: ${socket.userId}`
  );

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}, User: ${socket.userId}`
    );
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
