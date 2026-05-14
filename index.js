const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Note: This code borrows heavily from
// https://oneuptime.com/blog/post/2026-02-02-express-websockets/view

// Serve static files for the client demo
app.use(express.static(path.join(__dirname, '../public')));

// Parse JSON bodies for REST endpoints
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', connections: wss.clients.size });
});

// Create HTTP server from Express app
const server = createServer(app);

// Create WebSocket server attached to HTTP server
// The 'noServer' option lets us handle upgrades manually for more control
const wss = new WebSocketServer({ server });

// Store connected clients with metadata
const clients = new Map();

// Handle new WebSocket connections
wss.on('connection', (ws, request) => {
  // Generate unique ID for this connection
  const clientId = uuidv4();

  // Store client with metadata
  clients.set(clientId, {
    ws,
    connectedAt: new Date(),
    ip: request.socket.remoteAddress,
  });

  console.log(`Client connected: ${clientId}`);

  // Send welcome message with client ID
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Welcome to the WebSocket server',
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Message received from ${clientId}:`, message);
    } catch (error) {
      console.error('Failed to parse message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format',
      }));
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`Client disconnected: ${clientId}, code: ${code}`);
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
    clients.delete(clientId);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});