import * as winston from 'winston'
const { combine, timestamp, json, errors, prettyPrint } = winston.format

// prettyPrint overwrites json() with util.inspect output, so in production Cloud
// Logging sees unparsed text and `level` never becomes a severity.
const formats = [errors({ stack: true }), timestamp(), json()]
if (process.env.NODE_ENV !== 'production') formats.push(prettyPrint())

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  format: combine(...formats),
  transports: [new winston.transports.Console()],
})

export default logger
