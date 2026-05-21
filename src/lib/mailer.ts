import nodemailer from "nodemailer";

export function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export async function sendQuoteEmail(quote: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  deadline?: string | null;
  message: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[mailer] SMTP not configured; skipping email.");
    return;
  }
  const html = `
    <h2>Nueva cotización - Ideas PR</h2>
    <p><b>Nombre:</b> ${quote.name}</p>
    <p><b>Correo:</b> ${quote.email}</p>
    <p><b>Teléfono:</b> ${quote.phone ?? "-"}</p>
    <p><b>Empresa:</b> ${quote.company ?? "-"}</p>
    <p><b>Servicio:</b> ${quote.service ?? "-"}</p>
    <p><b>Presupuesto:</b> ${quote.budget ?? "-"}</p>
    <p><b>Fecha límite:</b> ${quote.deadline ?? "-"}</p>
    <p><b>Mensaje:</b><br/>${quote.message.replace(/\n/g, "<br/>")}</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO,
    replyTo: quote.email,
    subject: `Nueva cotización de ${quote.name}`,
    html
  });
}
