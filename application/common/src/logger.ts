import * as winston from 'winston'
const { combine, timestamp, json, errors, prettyPrint } = winston.format

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info'),
  format: combine(errors({ stack: true }), timestamp(), json(), prettyPrint()),
  transports: [new winston.transports.Console()],
})

export default logger
