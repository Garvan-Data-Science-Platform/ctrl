import { Api } from './Api'
import Database from './Database'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const main = async (): Promise<void> => {
  // Setup Database
  Database.init()

  // Setup and run Api
  const api = new Api()
  api.run()
}

main()
  .then(() => {})
  .catch((err) => {
    console.error({ error: err })
  })
