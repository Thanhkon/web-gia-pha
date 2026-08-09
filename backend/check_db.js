const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'web-gia-pha',
  password: 'postgres_password',
  port: 5432,
});
client.connect()
  .then(() => client.query("SELECT email, role FROM users WHERE email = 'admin@test.com'"))
  .then(res => { console.log(res.rows); client.end(); })
  .catch(err => { console.error('Error:', err.message); client.end(); });
