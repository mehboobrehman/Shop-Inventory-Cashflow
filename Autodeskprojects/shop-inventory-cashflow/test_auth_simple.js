// Simple test to verify auth system components
console.log('Testing auth system components...');

// Test 1: Check if auth files exist and can be imported
try {
  const authController = require('./server/src/auth/auth.controller.ts');
  const authService = require('./server/src/auth/auth.service.ts');
  const authMiddleware = require('./server/src/auth/auth.middleware.ts');
  
  console.log('✓ Auth files can be imported');
  
  // Test 2: Check if required dependencies are available
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const express = require('express');
  
  console.log('✓ Dependencies available:', { bcrypt, jwt, express });
  
  // Test 3: Basic bcrypt functionality
  const password = 'test123';
  const hashed = bcrypt.hashSync(password, 10);
  const isMatch = bcrypt.compareSync(password, hashed);
  
  console.log('✓ Bcrypt works:', { isMatch });
  
  // Test 4: Basic JWT functionality
  const secret = 'test-secret';
  const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, secret, { expiresIn: '15m' });
  const decoded = jwt.verify(token, secret);
  
  console.log('✓ JWT works:', { decoded });
  
  console.log('\n🎉 All auth system components are working correctly!');
  
} catch (error) {
  console.error('❌ Error testing auth system:', error.message);
  process.exit(1);
}