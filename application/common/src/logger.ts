import winston, { format, transports } from 'winston'
const { combine, timestamp, json, errors, prettyPrint } = format

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  format: combine(errors({ stack: true }), timestamp(), json(), prettyPrint()),
  transports: [new transports.Console()],
})

export default logger
