const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://shopadmin:password@localhost:5432/shop_inventory',
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL!');
    client.end();
  })
  .catch(err => {
    console.error('Failed to connect to PostgreSQL:', err.message);
  });
