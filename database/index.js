/**
 * Database Configuration
 * Sequelize ORM setup for SQLite
 */

const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'maintenance.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// User model
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  passwordHash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('technician', 'supervisor', 'admin'),
    allowNull: false
  },
  assignedBay: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

// Fault model
const Fault = sequelize.define('Fault', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  markerId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  vehicleId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  busSystem: {
    type: Sequelize.ENUM('brakes', 'engine', 'doors', 'hvac', 'electrical'),
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  bayLocation: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('open', 'in_progress', 'resolved'),
    allowNull: false,
    defaultValue: 'open'
  },
  reportedById: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  resolvedById: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'Faults',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// ToolEvent model
const ToolEvent = sequelize.define('ToolEvent', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  toolName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  eventType: {
    type: Sequelize.ENUM('check_in', 'check_out'),
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  faultId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'Faults',
      key: 'id'
    }
  },
  dueBack: {
    type: Sequelize.DATE,
    allowNull: true
  }
}, {
  tableName: 'ToolEvents',
  timestamps: false
});

// AuditLog model
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  details: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: Sequelize.STRING,
    allowNull: true
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'AuditLogs',
  timestamps: false
});

// Define associations
User.hasMany(Fault, { as: 'reportedFaults', foreignKey: 'reportedById' });
User.hasMany(Fault, { as: 'resolvedFaults', foreignKey: 'resolvedById' });
Fault.belongsTo(User, { as: 'reporter', foreignKey: 'reportedById' });
Fault.belongsTo(User, { as: 'resolver', foreignKey: 'resolvedById' });

User.hasMany(ToolEvent, { foreignKey: 'userId' });
ToolEvent.belongsTo(User, { foreignKey: 'userId' });

Fault.hasMany(ToolEvent, { foreignKey: 'faultId' });
ToolEvent.belongsTo(Fault, { foreignKey: 'faultId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Sync database
async function sync() {
  await sequelize.sync();
  console.log('Database synced');
}

module.exports = {
  sequelize,
  User,
  Fault,
  ToolEvent,
  AuditLog,
  sync
};
