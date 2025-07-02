const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'painel.gabrielpugas.com.br',
  database: 'booking',
  password: 'f762e5a29808783a5622',
  port: 5432
});

module.exports = pool;