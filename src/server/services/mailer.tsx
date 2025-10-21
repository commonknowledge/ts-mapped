import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import logger from "./logger";

const transporter = nodemailer.createTransport(
  process.env.NODE_ENV === "production"
    ? {
        host: "mail.smtp2go.com",
        port: 2525,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      }
    : {
        // mailpit config
        host: "localhost",
        port: 1025,
        secure: false,
        debug: true,
        ignoreTLS: true,
      },
);

export async function sendEmail(
  to: string,
  subject: string,
  template: React.ReactNode,
) {
  try {
    const html = await render(template);
    await transporter.sendMail({
      from: "noreply@v3.mapped.tools",
      to,
      subject,
      html,
    });
    logger.info(`Sent ${subject} email to ${to}`);
  } catch (error) {
    logger.error(error);
  }
}
