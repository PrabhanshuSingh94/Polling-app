// Import required modules
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Create router instance
const router = express.Router();

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

// POST /api/polls - Create a new poll with options
router.post('/', async (req, res) => {
  try {
    const { question, options, creatorId, isPublished = false } = req.body;
    
    // Create poll with nested poll options in a single transaction
    const poll = await prisma.poll.create({
      data: {
        question,
        isPublished,
        creatorId,
        options: {
          // Create multiple poll options from the options array
          create: options.map(optionText => ({ text: optionText }))
        }
      },
      include: {
        options: true, // Include all poll options
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Return the created poll with options and creator info
    res.status(201).json(poll);
  } catch (error) {
    // Handle database errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/polls - Get all published polls with vote counts
router.get('/', async (req, res) => {
  try {
    // Fetch only published polls with related data
    const polls = await prisma.poll.findMany({
      where: { isPublished: true }, // Only show published polls
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        options: {
          include: {
            _count: {
              select: { votes: true } // Include vote count for each option
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' } // Show newest polls first
    });
    
    // Return all published polls with vote counts
    res.json(polls);
  } catch (error) {
    // Handle database errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/polls/:id - Get a specific poll by ID with vote counts
router.get('/:id', async (req, res) => {
  try {
    // Find poll by ID with all related data
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        options: {
          include: {
            _count: {
              select: { votes: true } // Include vote count for each option
            }
          }
        }
      }
    });
    
    // Return 404 if poll doesn't exist
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Return poll data with vote counts
    res.json(poll);
  } catch (error) {
    // Handle database errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the router for use in main server file
module.exports = router;