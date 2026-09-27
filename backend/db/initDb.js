const fs = require('fs')
const path = require('path')
const { Client, Pool } = require('pg')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

async function initializeDatabase() {
  console.log('--- STARTING POSTGRESQL DATABASE INITIALIZATION & TEST ---')

  const user = process.env.PGUSER || 'postgres'
  const password = process.env.PGPASSWORD || 'postgres'
  const host = process.env.PGHOST || 'localhost'
  const port = parseInt(process.env.PGPORT || '5432', 10)
  const dbName = process.env.PGDATABASE || 'agrirent'

  // Step 1: Connect to default 'postgres' DB to ensure target database exists
  const adminClient = new Client({
    user,
    password,
    host,
    port,
    database: 'postgres'
  })

  try {
    await adminClient.connect()
    console.log('✅ Connected to PostgreSQL server (default database).')

    // Check if database exists
    const dbCheckRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    )

    if (dbCheckRes.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`)
      await adminClient.query(`CREATE DATABASE "${dbName}"`)
      console.log(`✅ Database "${dbName}" created successfully.`)
    } else {
      console.log(`✅ Database "${dbName}" already exists.`)
    }
  } catch (err) {
    console.error('❌ Failed connecting to admin database:', err.message)
    throw err
  } finally {
    await adminClient.end()
  }

  // Step 2: Connect to target database and apply schema
  const targetPool = new Pool({
    user,
    password,
    host,
    port,
    database: dbName
  })

  try {
    console.log(`Connecting to database "${dbName}"...`)
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    console.log('Applying schema SQL...')
    await targetPool.query(schemaSql)
    console.log('✅ Schema applied successfully.')

    // Step 3: Verify table and query data
    const res = await targetPool.query('SELECT COUNT(*) FROM equipment')
    const count = res.rows[0].count
    console.log(`✅ Table "equipment" verified. Total rows: ${count}`)

    const sampleRes = await targetPool.query('SELECT id, name, category, price_per_day, city FROM equipment LIMIT 1')
    console.log('Sample equipment row:', sampleRes.rows[0])

    console.log('--- DATABASE CONNECTION & SCHEMA TEST PASSED ---')
  } catch (err) {
    console.error('❌ Error during schema execution or verification:', err.message)
    throw err
  } finally {
    await targetPool.end()
  }
}

initializeDatabase().catch((err) => {
  console.error('Database setup failed:', err)
  process.exit(1)
})
