import * as winston from 'winston'
const { combine, timestamp, json, errors, prettyPrint } = winston.format

const logger = winston.createLogger({
  level: 'error',
  format: combine(errors({ stack: true }), timestamp(), json(), prettyPrint()),
  transports: [new winston.transports.Console()],
})

export default logger
