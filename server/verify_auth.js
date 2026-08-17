async function verifyAuth() {
  console.log('🔍 Verifying Auth System Fixes...\n');

  // Test: Health check
  const response = await fetch('http://localhost:3000/api/v1/health');
  console.log('Health check status:', response.status);
  
  // Test: Registration
  const user = {
      email: 'test_already_exists@example.com',
      password: 'password123',
      name: 'Test User'
  };
  
  const regResponse = await fetch('http://localhost:3000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  console.log('Register status:', regResponse.status);
}

verifyAuth();