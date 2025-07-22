#!/usr/bin/env node

const Database = require('../config/database');
require('dotenv').config();

async function initDatabase() {
  console.log('🔧 Initializing database...');
  
  try {
    const database = new Database();
    
    // Wait a bit for database initialization to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Database initialized successfully!');
    console.log(`📍 Database location: ${process.env.DATABASE_PATH || './database.sqlite'}`);
    console.log('🎯 Tables created:');
    console.log('  - sessions');
    console.log('  - messages');
    console.log('  - settings');
    console.log('  - api_keys');
    console.log('⚙️  Default settings loaded');
    
    await database.close();
    console.log('🔒 Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase; 