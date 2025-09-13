// Load environment variables from .env file
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

// Configure middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Debug middleware - logs request details (remove in production)
app.use((req, res, next) => {
  console.log('Body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Import route handlers
const userRoutes = require('./routes/users');
const pollRoutes = require('./routes/polls');
const voteRoutes = require('./routes/votes');

// Mount API routes
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);

// WebSocket server setup for real-time communication
const wss = new WebSocket.Server({ server });
const clients = new Map(); // Store connected clients by poll ID

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Handle incoming messages from clients
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // When a client wants to join a specific poll
      if (data.type === 'join-poll') {
        ws.pollId = data.pollId; // Store poll ID on the connection
        
        // Create a new Set for this poll if it doesn't exist
        if (!clients.has(data.pollId)) {
          clients.set(data.pollId, new Set());
        }
        
        // Add this client to the poll's client list
        clients.get(data.pollId).add(ws);
        console.log(`Client joined poll: ${data.pollId}`);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    if (ws.pollId && clients.has(ws.pollId)) {
      // Remove client from the poll's client list
      clients.get(ws.pollId).delete(ws);
      
      // Clean up empty poll rooms
      if (clients.get(ws.pollId).size === 0) {
        clients.delete(ws.pollId);
      }
    }
    console.log('WebSocket connection closed');
  });
});

// Function to broadcast poll results to all connected clients
async function broadcastPollResults(pollId) {
  // Exit early if no clients are connected to this poll
  if (!clients.has(pollId)) return;
  
  try {
    // Fetch the poll with its options and vote counts
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    });
    
    // Format the results for broadcasting
    const results = {
      type: 'poll-update',
      pollId: pollId,
      results: poll.options.map(option => ({
        id: option.id,
        text: option.text,
        voteCount: option._count.votes
      }))
    };
    
    // Send results to all connected clients for this poll
    clients.get(pollId).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(results));
      }
    });
  } catch (error) {
    console.error('Error broadcasting poll results:', error);
  }
}

// Make the broadcast function globally available for use in routes
global.broadcastPollResults = broadcastPollResults;

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});