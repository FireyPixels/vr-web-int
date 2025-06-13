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
      if (mobileSocket && mobileSocket.id !== socket.id) {
        console.log(`Replacing old mobile socket ${mobileSocket.id} with new ${socket.id}`);
      }
      mobileSocket = socket;
      console.log(`Device registered: mobile (${socket.id})`);
    } else if (deviceType === 'vr') {
      if (vrSocket && vrSocket.id !== socket.id) {
        console.log(`Replacing old VR socket ${vrSocket.id} with new ${socket.id}`);
      }
      vrSocket = socket;
      console.log(`Device registered: vr (${socket.id})`);
    }
  });

  // Handle offer from mobile and send to VR
  socket.on('offer', (data) => {
    console.log(`Offer received from mobile (${socket.id}). Relaying to VR.`);
    if (socket === mobileSocket && vrSocket) {
      vrSocket.emit('offer', data);
      console.log(`Offer relayed to VR (${vrSocket.id})`);
    } else {
      console.error('Offer not relayed. Conditions:');
      console.error(`  socket === mobileSocket: ${socket === mobileSocket} (Mobile Socket ID: ${mobileSocket ? mobileSocket.id : 'null'})`);
      console.error(`  vrSocket exists: ${!!vrSocket} (VR Socket ID: ${vrSocket ? vrSocket.id : 'null'})`);
    }
  });

  // Handle answer from VR and send to mobile
  socket.on('answer', (data) => {
    console.log(`Answer received from VR (${socket.id}). Relaying to mobile.`);
    if (socket === vrSocket && mobileSocket) {
      mobileSocket.emit('answer', data);
      console.log(`Answer relayed to mobile (${mobileSocket.id})`);
    } else {
      console.error('Answer not relayed. Conditions:');
      console.error(`  socket === vrSocket: ${socket === vrSocket} (VR Socket ID: ${vrSocket ? vrSocket.id : 'null'})`);
      console.error(`  mobileSocket exists: ${!!mobileSocket} (Mobile Socket ID: ${mobileSocket ? mobileSocket.id : 'null'})`);
    }
  });

  // ICE candidate exchange
  socket.on('ice-candidate', (data) => {
    console.log(`ICE candidate from (${socket.id}).`);
    if (socket === mobileSocket && vrSocket) {
      console.log(`Relaying ICE candidate from mobile to VR (${vrSocket.id})`);
      vrSocket.emit('ice-candidate', data);
    } else if (socket === vrSocket && mobileSocket) {
      console.log(`Relaying ICE candidate from VR to mobile (${mobileSocket.id})`);
      mobileSocket.emit('ice-candidate', data);
    } else {
      console.error('ICE candidate not relayed. From socket:', socket.id);
      console.error(`  Current mobileSocket: ${mobileSocket ? mobileSocket.id : 'null'}`);
      console.error(`  Current vrSocket: ${vrSocket ? vrSocket.id : 'null'}`);
    }
  });

  // Relay VR controller input to mobile
  socket.on('vr-controller', (data) => {
    // console.log('VR controller event:', data); // Keep this if needed, can be noisy
    if (mobileSocket) {
      mobileSocket.emit('vr-controller', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (mobileSocket && socket.id === mobileSocket.id) {
      console.log('Mobile disconnected');
      mobileSocket = null;
    }
    if (vrSocket && socket.id === vrSocket.id) {
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
