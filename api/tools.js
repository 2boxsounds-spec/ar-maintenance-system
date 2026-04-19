/**
 * Tool Tracking Routes
 * GET /api/v1/tool-events
 * POST /api/v1/tool-events
 */

const express = require('express');
const { ToolEvent, Fault, User, AuditLog } = require('../database');

const router = express.Router();

// List tool events
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const events = await ToolEvent.findAll({
      include: [
        { model: User, attributes: ['id', 'username', 'role'] },
        { model: Fault, attributes: ['id', 'vehicleId', 'title'] }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(events);
  } catch (error) {
    console.error('Get tool events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log tool check-in/out
router.post('/', async (req, res) => {
  try {
    const { toolName, eventType, faultId } = req.body;

    // Validate
    if (!toolName || !eventType) {
      return res.status(400).json({
        error: 'toolName and eventType required',
        validEventTypes: ['check_in', 'check_out']
      });
    }

    // Calculate due back time (8 hours from now for check_out)
    const dueBack = eventType === 'check_out'
      ? new Date(Date.now() + 8 * 60 * 60 * 1000)
      : null;

    const event = await ToolEvent.create({
      toolName,
      eventType,
      userId: req.user.userId,
      faultId: faultId || null,
      dueBack
    });

    // Log audit
    await AuditLog.create({
      eventType: `tool_${eventType}`,
      userId: req.user.userId,
      details: `${toolName} ${eventType.replace('_', '-')}`,
      ipAddress: req.ip
    });

    // Emit socket event
    req.app.get('io')?.emit('tool-event', {
      eventId: event.id,
      toolName,
      eventType,
      username: req.user.username,
      timestamp: event.timestamp
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create tool event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
