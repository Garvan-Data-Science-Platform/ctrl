import * as winston from 'winston'
const { combine, timestamp, json, errors, prettyPrint } = winston.format

// prettyPrint runs after json and overwrites the JSON with util.inspect output, so in
// production every log line arrives at Cloud Logging as unparsed text and `level` never
// becomes a severity. Local dev keeps it for readable terminal output.
const formats = [errors({ stack: true }), timestamp(), json()]
if (process.env.NODE_ENV !== 'production') formats.push(prettyPrint())

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  format: combine(...formats),
  transports: [new winston.transports.Console()],
})

export default logger
