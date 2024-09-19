import winston, { format, transports } from 'winston'
const { combine, timestamp, json, errors, prettyPrint } = format

const logger = winston.createLogger({
  level: 'info',
  format: combine(errors({ stack: true }), timestamp(), json(), prettyPrint()),
  transports: [new transports.Console()],
  silent: process.env.NODE_ENV === 'test',
})

export default logger
