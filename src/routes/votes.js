// Import required modules
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Create router instance
const router = express.Router();

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

// POST /api/votes - Submit a vote for a poll option
router.post('/', async (req, res) => {
  try {
    const { userId, pollOptionId } = req.body;
    
    // First, verify the poll option exists and get the poll ID
    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      select: { pollId: true }
    });
    
    // Return 404 if poll option doesn't exist
    if (!pollOption) {
      return res.status(404).json({ error: 'Poll option not found' });
    }
    
    // Create the vote record
    const vote = await prisma.vote.create({
      data: {
        userId,
        pollOptionId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pollOption: {
          include: {
            poll: {
              select: {
                id: true,
                question: true
              }
            }
          }
        }
      }
    });
    
    // Broadcast updated poll results to all connected WebSocket clients
    if (global.broadcastPollResults) {
      global.broadcastPollResults(pollOption.pollId);
    }
    
    // Return the created vote with related data
    res.status(201).json(vote);
  } catch (error) {
    // Handle duplicate vote error (unique constraint violation)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'User has already voted for this option' });
    } else {
      // Handle other database errors
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/votes/poll/:pollId - Get all votes for a specific poll
router.get('/poll/:pollId', async (req, res) => {
  try {
    // Find all votes for the specified poll
    const votes = await prisma.vote.findMany({
      where: {
        pollOption: {
          pollId: req.params.pollId // Filter votes by poll ID through pollOption relation
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pollOption: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });
    
    // Return all votes for the poll
    res.json(votes);
  } catch (error) {
    // Handle database errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the router for use in main server file
module.exports = router;