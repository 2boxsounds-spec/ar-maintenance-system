/**
 * Fault Management Routes
 * GET /api/v1/faults
 * POST /api/v1/faults
 * PATCH /api/v1/faults/:id
 */

const express = require('express');
const { Fault, User, AuditLog } = require('../database');

const router = express.Router();

// List all faults (with filtering)
router.get('/', async (req, res) => {
  try {
    const { bay, status, vehicleId, busSystem } = req.query;
    const where = {};

    // Apply filters
    if (bay) where.bayLocation = bay;
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (busSystem) where.busSystem = busSystem;

    // Technicians can only see their assigned bay
    if (req.user.role === 'technician' && req.user.assignedBay) {
      where.bayLocation = req.user.assignedBay;
    }

    const faults = await Fault.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'role'] },
        { model: User, as: 'resolver', attributes: ['id', 'username', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(faults);
  } catch (error) {
    console.error('Get faults error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single fault
router.get('/:id', async (req, res) => {
  try {
    const fault = await Fault.findByPk(req.params.id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'role'] },
        { model: User, as: 'resolver', attributes: ['id', 'username', 'role'] }
      ]
    });

    if (!fault) {
      return res.status(404).json({ error: 'Fault not found' });
    }

    // Check bay access
    if (req.user.role === 'technician' && req.user.assignedBay !== fault.bayLocation) {
      return res.status(403).json({ error: 'Access denied to this bay' });
    }

    res.json(fault);
  } catch (error) {
    console.error('Get fault error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report new fault
router.post('/', async (req, res) => {
  try {
    const { markerId, vehicleId, busSystem, title, description, bayLocation } = req.body;

    // Validate required fields
    if (!markerId || !vehicleId || !busSystem || !title || !bayLocation) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['markerId', 'vehicleId', 'busSystem', 'title', 'bayLocation']
      });
    }

    // Validate bus system
    const validSystems = ['brakes', 'engine', 'doors', 'hvac', 'electrical'];
    if (!validSystems.includes(busSystem)) {
      return res.status(400).json({
        error: 'Invalid bus system',
        valid: validSystems
      });
    }

    // Check bay access for technicians
    if (req.user.role === 'technician' && req.user.assignedBay !== bayLocation) {
      return res.status(403).json({ error: 'Can only report faults in assigned bay' });
    }

    const fault = await Fault.create({
      markerId,
      vehicleId,
      busSystem,
      title,
      description,
      bayLocation,
      reportedById: req.user.userId
    });

    // Log audit
    await AuditLog.create({
      eventType: 'fault_reported',
      userId: req.user.userId,
      details: `Fault reported: ${vehicleId} - ${title}`,
      ipAddress: req.ip
    });

    // Emit socket event
    req.app.get('io')?.emit('fault-update', {
      faultId: fault.id,
      action: 'created',
      bayLocation: fault.bayLocation
    });

    res.status(201).json(fault);
  } catch (error) {
    console.error('Create fault error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update fault status
router.patch('/:id', async (req, res) => {
  try {
    const { status, description } = req.body;
    const fault = await Fault.findByPk(req.params.id);

    if (!fault) {
      return res.status(404).json({ error: 'Fault not found' });
    }

    // Check bay access
    if (req.user.role === 'technician' && req.user.assignedBay !== fault.bayLocation) {
      return res.status(403).json({ error: 'Access denied to this bay' });
    }

    // Update fields
    if (status) fault.status = status;
    if (description) fault.description = description;

    // Set resolver if marking as resolved
    if (status === 'resolved') {
      fault.resolvedById = req.user.userId;
    }

    await fault.save();

    // Log audit
    await AuditLog.create({
      eventType: 'fault_updated',
      userId: req.user.userId,
      details: `Fault ${fault.id} updated: status=${status}`,
      ipAddress: req.ip
    });

    // Emit socket event
    req.app.get('io')?.emit('fault-update', {
      faultId: fault.id,
      action: 'updated',
      bayLocation: fault.bayLocation,
      status: fault.status
    });

    res.json(fault);
  } catch (error) {
    console.error('Update fault error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
