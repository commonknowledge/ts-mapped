import winston from "winston"

export default winston.createLogger({
  level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  ],
});
