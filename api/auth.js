/**
 * Authentication Routes
 * POST /api/v1/auth/login
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../database');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password required',
        code: 400
      });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      // Log failed attempt
      await AuditLog.create({
        eventType: 'failed_login',
        details: `Failed login attempt for username: ${username}`,
        ipAddress: req.ip
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 401
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      await AuditLog.create({
        eventType: 'failed_login',
        userId: user.id,
        details: `Invalid password for user: ${username}`,
        ipAddress: req.ip
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 401
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        assignedBay: user.assignedBay
      },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRY || '2h' }
    );

    // Log successful login
    await AuditLog.create({
      eventType: 'login',
      userId: user.id,
      details: `User ${username} logged in successfully`,
      ipAddress: req.ip
    });

    // Return token and user info
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        assignedBay: user.assignedBay
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 500
    });
  }
});

module.exports = router;
