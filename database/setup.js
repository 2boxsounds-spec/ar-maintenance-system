/**
 * Database Setup Script
 * Creates database with proper bcrypt-hashed passwords
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'maintenance.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    // Remove existing database
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('🗑️  Removed existing database');
      }
    } catch (err) {
      console.error('Error removing database:', err);
    }

    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');

      try {
        // Read and execute schema
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        
        // Execute schema line by line
        const statements = schema.split(';').filter(s => s.trim());
        for (const stmt of statements) {
          if (stmt.trim()) {
            await new Promise((res, rej) => {
              db.exec(stmt, (err) => err ? rej(err) : res());
            });
          }
        }
        console.log('✅ Schema created');

        // Create users with REAL bcrypt passwords
        const users = [
          { username: 'j.smith', password: 'Tech123!', role: 'technician', assignedBay: 'Bay 3' },
          { username: 'm.jones', password: 'Tech456!', role: 'technician', assignedBay: 'Bay 7' },
          { username: 'supervisor', password: 'Super123!', role: 'supervisor', assignedBay: null },
          { username: 'admin', password: 'Admin123!', role: 'admin', assignedBay: null }
        ];

        for (const user of users) {
          const passwordHash = await bcrypt.hash(user.password, 10);
          await new Promise((res, rej) => {
            db.run(
              `INSERT INTO Users (username, passwordHash, role, assignedBay) VALUES (?, ?, ?, ?)`,
              [user.username, passwordHash, user.role, user.assignedBay],
              (err) => err ? rej(err) : res()
            );
          });
          console.log(`✅ Created user: ${user.username} (${user.role})`);
        }

        // Insert sample faults
        const faults = [
          ['hiro', 'Bus 204', 'brakes', 'Brake Pad Wear - Front Left', 'Brake pad at 20% thickness', 'Bay 3', 'open', 1],
          ['kanji', 'Bus 156', 'doors', 'Door Sensor Fault - Rear', 'Rear door not closing properly', 'Bay 7', 'in_progress', 2],
          ['custom-1', 'Bus 089', 'hvac', 'Heating Not Working', 'No heat from vents', 'Bay 1', 'resolved', 1],
          ['custom-2', 'Bus 312', 'electrical', 'Battery Voltage Low', 'Battery reading 11.2V', 'Bay 5', 'open', 2],
          ['hiro', 'Bus 178', 'engine', 'Check Engine Light On', 'OBD-II code P0300', 'Bay 2', 'open', 1],
          ['kanji', 'Bus 245', 'brakes', 'Brake Fluid Leak', 'Fluid leak at rear caliper', 'Bay 4', 'open', 2]
        ];

        for (const fault of faults) {
          await new Promise((res, rej) => {
            db.run(
              `INSERT INTO Faults (markerId, vehicleId, busSystem, title, description, bayLocation, status, reportedById) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              fault,
              (err) => err ? rej(err) : res()
            );
          });
        }
        console.log('✅ Sample faults inserted');

        // Insert sample tool events
        const toolEvents = [
          ['OBD-II Scanner', 'check_out', 1, 5],
          ['Torque Wrench 50Nm', 'check_out', 2, 2],
          ['Brake Caliper Tool', 'check_in', 1, 1],
          ['Multimeter', 'check_out', 2, 4]
        ];

        for (const event of toolEvents) {
          await new Promise((res, rej) => {
            db.run(
              `INSERT INTO ToolEvents (toolName, eventType, userId, faultId, dueBack) VALUES (?, ?, ?, ?, datetime('now', '+8 hours'))`,
              event,
              (err) => err ? rej(err) : res()
            );
          });
        }
        console.log('✅ Sample tool events inserted');

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║   Database initialized successfully!                      ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║   Default Users:                                          ║');
        console.log('║   j.smith    / Tech123!    (technician, Bay 3)            ║');
        console.log('║   m.jones    / Tech456!    (technician, Bay 7)            ║');
        console.log('║   supervisor / Super123!   (supervisor, all bays)         ║');
        console.log('║   admin      / Admin123!   (admin, all bays)              ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (error) {
        console.error('Setup error:', error);
        db.close();
        reject(error);
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => console.log('✅ Done!'))
    .catch((err) => {
      console.error('Failed to setup database:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
