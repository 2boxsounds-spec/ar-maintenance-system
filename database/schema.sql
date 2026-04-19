-- AR Maintenance Support System Database Schema
-- Bournemouth Buses Depot
-- COMP5067 University Project

-- Users table (depot staff)
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('technician', 'supervisor', 'admin')),
    assignedBay TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faults table (maintenance issues)
CREATE TABLE IF NOT EXISTS Faults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    markerId TEXT NOT NULL,
    vehicleId TEXT NOT NULL,
    busSystem TEXT NOT NULL CHECK (busSystem IN ('brakes', 'engine', 'doors', 'hvac', 'electrical')),
    title TEXT NOT NULL,
    description TEXT,
    bayLocation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    reportedById INTEGER NOT NULL,
    resolvedById INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reportedById) REFERENCES Users(id),
    FOREIGN KEY (resolvedById) REFERENCES Users(id)
);

-- Tool Events table (tool accountability)
CREATE TABLE IF NOT EXISTS ToolEvents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toolName TEXT NOT NULL,
    eventType TEXT NOT NULL CHECK (eventType IN ('check_in', 'check_out')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId INTEGER NOT NULL,
    faultId INTEGER,
    dueBack DATETIME,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (faultId) REFERENCES Faults(id)
);

-- Audit Logs table (security tracking)
CREATE TABLE IF NOT EXISTS AuditLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventType TEXT NOT NULL,
    userId INTEGER,
    details TEXT,
    ipAddress TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faults_status ON Faults(status);
CREATE INDEX IF NOT EXISTS idx_faults_bay ON Faults(bayLocation);
CREATE INDEX IF NOT EXISTS idx_faults_vehicle ON Faults(vehicleId);
CREATE INDEX IF NOT EXISTS idx_tool_events_user ON ToolEvents(userId);
CREATE INDEX IF NOT EXISTS idx_tool_events_timestamp ON ToolEvents(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON AuditLogs(timestamp);
