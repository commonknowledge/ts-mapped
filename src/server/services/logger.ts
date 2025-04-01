import winston from "winston";

const errorFormatter = winston.format((info) => {
  if (info.error) {
    info.message = `${info.message} (${getErrorMessage(info.error)})`;
    delete info.error
  }
  return info;
});

const getErrorMessage = (e: unknown) => {
  if (e && typeof e === "object" && "message" in e && e.message) {
    return e.message;
  }
  const message = String(e);
  if (message !== "[object Object]") {
    return message;
  }
  return "Unknown error";
};

export default winston.createLogger({
  level: (process.env.LOG_LEVEL || "info").toLowerCase(),
  format: winston.format.combine(errorFormatter(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});
