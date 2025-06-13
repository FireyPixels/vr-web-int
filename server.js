const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Store one mobile and one VR connection
let mobileSocket = null;
let vrSocket = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Device registration
  socket.on('register-device', (deviceType) => {
    if (deviceType === 'mobile') {
      mobileSocket = socket;
      console.log(`Device registered: mobile (${socket.id})`);
    } else if (deviceType === 'vr') {
      vrSocket = socket;
      console.log(`Device registered: vr (${socket.id})`);
    }
  });

  // Handle offer from mobile and send to VR
  socket.on('offer', (data) => {
    console.log('Offer received from:', socket.id);
    if (socket === mobileSocket && vrSocket) {
      vrSocket.emit('offer', data);
    }
  });

  // Handle answer from VR and send to mobile
  socket.on('answer', (data) => {
    console.log('Answer received from:', socket.id);
    if (socket === vrSocket && mobileSocket) {
      mobileSocket.emit('answer', data);
    }
  });

  // ICE candidate exchange
  socket.on('ice-candidate', (data) => {
    console.log('ICE candidate from:', socket.id);
    if (socket === mobileSocket && vrSocket) {
      vrSocket.emit('ice-candidate', data);
    } else if (socket === vrSocket && mobileSocket) {
      mobileSocket.emit('ice-candidate', data);
    }
  });

  // Relay VR controller input to mobile
  socket.on('vr-controller', (data) => {
    console.log('VR controller event:', data);
    if (mobileSocket) {
      mobileSocket.emit('vr-controller', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket === mobileSocket) {
      console.log('Mobile disconnected');
      mobileSocket = null;
    }
    if (socket === vrSocket) {
      console.log('VR disconnected');
      vrSocket = null;
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
