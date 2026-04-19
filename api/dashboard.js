/**
 * Dashboard Data Routes
 * GET /api/v1/dashboard/stats
 */

const express = require('express');
const { Fault, ToolEvent, sequelize } = require('../database');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Only supervisors and admins can access dashboard stats
    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Dashboard access denied' });
    }

    // Fault statistics by system
    const faultsBySystem = await Fault.findAll({
      attributes: [
        'busSystem',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['busSystem']
    });

    // Fault statistics by status
    const faultsByStatus = await Fault.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Fault statistics by bay
    const faultsByBay = await Fault.findAll({
      attributes: [
        'bayLocation',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['bayLocation'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    // Recent tool events
    const recentToolEvents = await ToolEvent.findAll({
      limit: 10,
      order: [['timestamp', 'DESC']]
    });

    // Currently checked out tools
    const checkedOutTools = await ToolEvent.findAll({
      where: { eventType: 'check_out' },
      limit: 20,
      order: [['timestamp', 'DESC']]
    });

    // Recent faults
    const recentFaults = await Fault.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      faultsBySystem: faultsBySystem.map(f => ({
        system: f.busSystem,
        count: parseInt(f.dataValues.count)
      })),
      faultsByStatus: faultsByStatus.map(f => ({
        status: f.status,
        count: parseInt(f.dataValues.count)
      })),
      faultsByBay: faultsByBay.map(f => ({
        bay: f.bayLocation,
        count: parseInt(f.dataValues.count)
      })),
      recentToolEvents,
      checkedOutTools,
      recentFaults,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
