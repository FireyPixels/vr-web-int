// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static('public'));

// Store active connections
const connections = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle device type registration
  socket.on('register-device', (deviceType) => {
    connections.set(socket.id, { deviceType, socket });
    console.log(`Device registered: ${deviceType} (${socket.id})`);
  });

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    console.log('Offer received from:', socket.id);
    socket.broadcast.emit('offer', { ...data, from: socket.id });
  });

  socket.on('answer', (data) => {
    console.log('Answer received from:', socket.id);
    socket.broadcast.emit('answer', { ...data, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    console.log('ICE candidate from:', socket.id);
    socket.broadcast.emit('ice-candidate', { ...data, from: socket.id });
  });

  // Handle VR controller events
  socket.on('vr-controller', (data) => {
    console.log('VR controller event:', data);
    socket.broadcast.emit('vr-controller', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connections.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});