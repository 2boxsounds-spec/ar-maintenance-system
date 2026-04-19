/**
 * Dashboard Data Routes
 * GET /api/v1/dashboard/stats
 * GET /api/v1/dashboard/faults
 */

const express = require('express');
const { Fault, ToolEvent, User, sequelize } = require('../database');

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

    // Currently checked out tools
    const checkedOutTools = await ToolEvent.findAll({
      where: { eventType: 'check_out' }
    });

    // Format results
    const bySystem = {};
    faultsBySystem.forEach(f => { bySystem[f.busSystem] = parseInt(f.dataValues.count); });

    const byStatus = {};
    faultsByStatus.forEach(f => { byStatus[f.status] = parseInt(f.dataValues.count); });

    const byBay = {};
    faultsByBay.forEach(f => { byBay[f.bayLocation] = parseInt(f.dataValues.count); });

    const totalFaults = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const openFaults = byStatus['open'] || 0;
    const resolvedFaults = byStatus['resolved'] || 0;
    const toolsOut = checkedOutTools.length;

    res.json({
      totalFaults,
      openFaults,
      resolvedFaults,
      toolsOut,
      bySystem,
      byStatus,
      byBay
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get all faults
router.get('/faults', async (req, res) => {
  try {
    // Only supervisors and admins can access all faults
    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Faults access denied' });
    }

    const faults = await Fault.findAll({
      include: [{
        model: User,
        as: 'reportedBy',
        attributes: ['username']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(faults);
  } catch (error) {
    console.error('Faults fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch faults' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Activity access denied' });
    }

    const recentFaults = await Fault.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'reportedBy',
        attributes: ['username']
      }]
    });

    const recentToolEvents = await ToolEvent.findAll({
      limit: 20,
      order: [['timestamp', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['username']
      }]
    });

    // Combine and format
    const activity = [
      ...recentFaults.map(f => ({
        time: f.createdAt,
        user: f.reportedBy?.username || 'Unknown',
        action: 'Fault ' + f.status,
        details: `${f.busSystem} - ${f.title}`
      })),
      ...recentToolEvents.map(t => ({
        time: t.timestamp,
        user: t.user?.username || 'Unknown',
        action: 'Tool ' + t.eventType.replace('_', ' '),
        details: t.toolName
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

    res.json(activity);
  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;
