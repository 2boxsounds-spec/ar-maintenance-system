/**
 * Database Initialization Script
 * Creates tables and seeds sample data
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'maintenance.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

function initDatabase() {
  return new Promise((resolve, reject) => {
    // Remove existing database for fresh start
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('🗑️  Removed existing database');
      }
    } catch (err) {
      console.error('Error removing database:', err);
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');

      // Read and execute schema
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      db.exec(schema, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✅ Schema created');

        // Read and execute seed data
        const seed = fs.readFileSync(SEED_PATH, 'utf8');
        db.exec(seed, (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('✅ Sample data inserted');
          console.log('📊 Database initialized successfully!');
          
          db.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  });
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => console.log('Done!'))
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
