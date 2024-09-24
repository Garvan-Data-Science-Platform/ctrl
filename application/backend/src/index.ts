import { Api } from './Api'
import dotenv from 'dotenv'
import logger from '@common/src/logger'

dotenv.config()

const main = async (): Promise<void> => {
  // Setup and run Api
  const api = new Api()
  api.run()
}

main()
  .then(() => {})
  .catch((err) => {
    logger.error({ error: err })
  })
