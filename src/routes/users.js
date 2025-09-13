// Import required modules
const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Create router instance
const router = express.Router();

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Hash the password for security (using bcrypt with salt rounds of 10)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user in database, excluding password from response
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    // Return created user (without password hash)
    res.status(201).json(user);
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      // Handle other database errors
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/users/:id - Get user by ID with their polls
router.get('/:id', async (req, res) => {
  try {
    // Find user by ID and include their created polls
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        polls: {
          select: {
            id: true,
            question: true,
            isPublished: true,
            createdAt: true
          }
        }
      }
    });
    
    // Return 404 if user doesn't exist
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data with their polls
    res.json(user);
  } catch (error) {
    // Handle database errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the router for use in main server file
module.exports = router;