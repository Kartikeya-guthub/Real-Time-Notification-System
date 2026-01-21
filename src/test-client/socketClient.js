const { io } = require('socket.io-client');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OY2EyNDQ4YTQ1MDUxYzkyMzRjZmMiLCJpYXQiOjE3Njg5OTI5MTEsImV4cCI6MTc2ODk5NjUxMX0.w9Zvr2a4FT-2AT0vN3W2aaVwZ864xe_CRmS1NbP8EHE";

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


