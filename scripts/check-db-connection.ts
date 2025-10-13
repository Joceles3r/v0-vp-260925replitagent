import { neon } from "@neondatabase/serverless"

async function checkDatabaseConnection() {
  console.log("🔍 Checking database connection...")

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)
    const result = await sql`SELECT NOW() as current_time`

    console.log("✅ Database connection successful")
    console.log(`   Server time: ${result[0].current_time}`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    process.exit(1)
  }
}

checkDatabaseConnection()
