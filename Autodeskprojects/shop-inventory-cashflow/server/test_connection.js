async function test() {
  const response = await fetch('http://localhost:3000/health');
  console.log('Status /health:', response.status);
  
  const response2 = await fetch('http://localhost:3000/api/v1/health');
  console.log('Status /api/v1/health:', response2.status);
}

test();