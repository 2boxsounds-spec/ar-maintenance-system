-- Sample Data for AR Maintenance System
-- Bournemouth Buses Depot

-- Insert default users (passwords are bcrypt hashed)
-- Default passwords: j.smith=Tech123!, m.jones=Tech456!, supervisor=Super123!, admin=Admin123!
INSERT INTO Users (username, passwordHash, role, assignedBay) VALUES
('j.smith', '$2b$10$K9z8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'technician', 'Bay 3'),
('m.jones', '$2b$10$K9z8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'technician', 'Bay 7'),
('supervisor', '$2b$10$K9z8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'supervisor', NULL),
('admin', '$2b$10$K9z8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', 'admin', NULL);

-- Sample faults for Bournemouth Buses
INSERT INTO Faults (markerId, vehicleId, busSystem, title, description, bayLocation, status, reportedById) VALUES
('hiro', 'Bus 204', 'brakes', 'Brake Pad Wear - Front Left', 'Brake pad at 20% thickness, replacement needed', 'Bay 3', 'open', 1),
('kanji', 'Bus 156', 'doors', 'Door Sensor Fault - Rear', 'Rear door not closing properly, sensor malfunction', 'Bay 7', 'in_progress', 2),
('custom-1', 'Bus 089', 'hvac', 'Heating Not Working', 'No heat from vents, thermostat unresponsive', 'Bay 1', 'resolved', 1),
('custom-2', 'Bus 312', 'electrical', 'Battery Voltage Low', 'Battery reading 11.2V, needs charging or replacement', 'Bay 5', 'open', 2),
('hiro', 'Bus 178', 'engine', 'Check Engine Light On', 'OBD-II code P0300 - Random misfire detected', 'Bay 2', 'open', 1),
('kanji', 'Bus 245', 'brakes', 'Brake Fluid Leak', 'Fluid leak detected at rear brake caliper', 'Bay 4', 'open', 2);

-- Sample tool events
INSERT INTO ToolEvents (toolName, eventType, userId, faultId, dueBack) VALUES
('OBD-II Scanner', 'check_out', 1, 5, datetime('now', '+8 hours')),
('Torque Wrench 50Nm', 'check_out', 2, 2, datetime('now', '+8 hours')),
('Brake Caliper Tool', 'check_in', 1, 1, NULL),
('Multimeter', 'check_out', 2, 4, datetime('now', '+8 hours'));

-- Sample audit logs
INSERT INTO AuditLogs (eventType, userId, details, ipAddress) VALUES
('login', 1, 'User j.smith logged in', '192.168.1.10'),
('login', 2, 'User m.jones logged in', '192.168.1.11'),
('fault_reported', 1, 'Fault reported: Bus 204 - Brake Pad Wear', '192.168.1.10'),
('tool_checkout', 1, 'OBD-II Scanner checked out', '192.168.1.10');
