const { io } = require('socket.io-client');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYzczNDBjMTEzNDRkZjNiMTE0MTIiLCJpYXQiOjE3NjkwOTgzNTksImV4cCI6MTc2OTEwMTk1OX0.uBzEAksK-uKlM8uHEZsQXAfp0YwT8pgObnEZTWuRhmk";

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
socket.on("notification", (payload) => {
  console.log("New notification:", payload);
});



