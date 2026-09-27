const { Pool } = require('pg')
require('dotenv').config()

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'agrirent',
      password: process.env.PGPASSWORD || 'postgres',
      port: parseInt(process.env.PGPORT || '5432', 10)
    }

const pool = new Pool(config)

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}
