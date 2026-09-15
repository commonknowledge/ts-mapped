import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import * as React from "react";
import { describe, expect, test } from "vitest";
import z from "zod";
import Invite from "@/server/emails/Invite";

/**
 * react-email + nodemailer as used in src/server/services/mailer.tsx: render a
 * real template (Tailwind wrapper, Img, Button, Preview) to HTML and hand it
 * to a nodemailer transport. jsonTransport exercises the sendMail API without
 * talking to SMTP.
 */
describe("react-email and nodemailer", () => {
  test("a template renders to HTML with Tailwind classes resolved", async () => {
    const html = await render(<Invite token="deps-token" />);
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("invitation/deps-token");
    // Tailwind component inlines styles; class names must not leak through raw.
    expect(html).toMatch(/style="[^"]*max-width:\s*465px/);
  });

  test("nodemailer createTransport + sendMail", async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const info = await transport.sendMail({
      from: "noreply@mapped.tools",
      to: "someone@example.com",
      subject: "deps",
      html: "<p>hi</p>",
    });
    expect(info.envelope.to).toEqual(["someone@example.com"]);
    expect(info.message).toBeTypeOf("string");
    if (typeof info.message !== "string") return;
    const message = z
      .object({ subject: z.string(), html: z.string() })
      .parse(JSON.parse(info.message));
    expect(message.subject).toBe("deps");
    expect(message.html).toBe("<p>hi</p>");
  });
});
