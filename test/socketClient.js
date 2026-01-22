const { io } = require('socket.io-client');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTZmY2EyNDQ4YTQ1MDUxYzkyMzRjZmMiLCJpYXQiOjE3NjkwMTI5MzEsImV4cCI6MTc2OTAxNjUzMX0.YQG5J2xqlTxIvgfJ5DRJDMFgxjFpJse_uId9OpB4LUY";

const socket = io("http://localhost:3000", {
  auth: {
    token: TOKEN,
  },
});


socket.on("connect", () => {
  console.log("✅ Connected");
  console.log("Socket ID:", socket.id);
});
socket.on("connect_error", (err) => {
  console.log("❌ Connection failed:", err.message);
});

socket.on("hello", (msg) => {
  console.log("Server says:", msg);
});


