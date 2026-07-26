// Simple test to verify auth system
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Testing bcrypt and jwt...');

// Test bcrypt
const password = 'test123';
const hashed = bcrypt.hashSync(password, 10);
const isMatch = bcrypt.compareSync(password, hashed);

console.log('Bcrypt test:', { password, hashed, isMatch });

// Test JWT
const secret = 'test-secret';
const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, secret, { expiresIn: '15m' });
const decoded = jwt.verify(token, secret);

console.log('JWT test:', { token, decoded });

console.log('Auth dependencies working correctly!');