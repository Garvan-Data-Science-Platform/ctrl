import winston, { format, transports } from 'winston'
const { combine, timestamp, json, errors } = format

const logger = winston.createLogger({
  level: 'debug',
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [new transports.Console()],
})

export default logger
