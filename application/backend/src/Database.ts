import { Pool, QueryResult } from 'pg'

class Database {
  private static instance: Database
  private pool: Pool

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    this.pool.on('error', (err: unknown) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })
  }

  public static init(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      throw new Error('Database not initialized. Call init first.')
    }
    return Database.instance
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async query(text: string, params?: any[]): Promise<QueryResult<any>> {
    const client = await this.pool.connect()
    try {
      const res = await client.query(text, params)
      return res
    } finally {
      client.release()
    }
  }
}

export default Database
