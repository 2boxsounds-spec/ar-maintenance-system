/**
 * Debug Script - Test Login
 * Run this to diagnose login issues
 */

const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'maintenance.db');

console.log('🔍 Debugging Login Issue...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Cannot open database:', err.message);
    console.log('\n💡 Solution: Run "npm run db:setup" to create the database');
    process.exit(1);
  }
  
  console.log('✅ Database opened:', DB_PATH);
  
  // Check if users exist
  db.all('SELECT id, username, role FROM Users', [], (err, rows) => {
    if (err) {
      console.error('❌ Query error:', err.message);
      console.log('\n💡 Solution: Run "npm run db:setup" to initialize database');
      db.close();
      process.exit(1);
    }
    
    if (rows.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 Solution: Run "npm run db:setup" to create users');
      db.close();
      process.exit(1);
    }
    
    console.log('\\n📊 Users in database:');
    rows.forEach(row => {
      console.log(`  - ${row.username} (${row.role})`);
    });
    
    // Test password for j.smith
    const testUser = 'j.smith';
    const testPassword = 'Tech123!';
    
    db.get('SELECT * FROM Users WHERE username = ?', [testUser], async (err, user) => {
      if (err) {
        console.error('❌ Error fetching user:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (!user) {
        console.log(`\\n❌ User '${testUser}' not found!`);
        console.log('\\n💡 Solution: Run "npm run db:setup"');
        db.close();
        process.exit(1);
      }
      
      console.log(`\\n🔐 Testing password for ${testUser}:`);
      console.log(`  Input password: ${testPassword}`);
      
      try {
        const match = await bcrypt.compare(testPassword, user.passwordHash);
        
        if (match) {
          console.log(`  ✅ Password matches!`);
          console.log('\\n🎉 Database is correctly set up!');
          console.log('\\n💡 If login still fails, check:');
          console.log('  1. Server is running (npm start)');
          console.log('  2. Check server logs for errors');
          console.log('  3. Check browser console for errors');
          console.log('  4. Try: curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\\\"username\\\":\\\"j.smith\\\",\\\"password\\\":\\\"Tech123!\\\"}"');
        } else {
          console.log(`  ❌ Password does NOT match!`);
          console.log('\\n💡 Solution: Run "npm run db:setup" to reset passwords');
        }
        
        db.close();
      } catch (error) {
        console.error('❌ Bcrypt error:', error.message);
        db.close();
        process.exit(1);
      }
    });
  });
});
