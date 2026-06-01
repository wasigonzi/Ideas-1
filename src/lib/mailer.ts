import nodemailer from "nodemailer";

function escapeHtml(text: string | null | undefined): string {
  if (text == null) return "-";
  return String(text).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return ch;
    }
  });
}

export function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export async function sendTaskAssignedEmail(opts: {
  toEmail: string;
  toName: string;
  taskTitle: string;
  taskId: string;
  assignedByName: string;
}) {
  const transporter = getTransporter();
  if (!transporter) return;
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${baseUrl}/empleado/tareas`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.toEmail,
    subject: `Se te asignó una tarea: ${opts.taskTitle.replace(/[\r\n]/g, " ")}`,
    html: `
      <p>Hola ${escapeHtml(opts.toName)},</p>
      <p><b>${escapeHtml(opts.assignedByName)}</b> te asignó la tarea:</p>
      <p><b>${escapeHtml(opts.taskTitle)}</b></p>
      <p><a href="${escapeHtml(link)}">Ver mis tareas →</a></p>
    `
  });
}

export async function sendMentionEmail(opts: {
  toEmail: string;
  toName: string;
  taskTitle: string;
  taskId: string;
  mentionedByName: string;
  commentBody: string;
}) {
  const transporter = getTransporter();
  if (!transporter) return;
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${baseUrl}/empleado/tareas`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: opts.toEmail,
    subject: `${opts.mentionedByName.replace(/[\r\n]/g, " ")} te mencionó en una tarea`,
    html: `
      <p>Hola ${escapeHtml(opts.toName)},</p>
      <p><b>${escapeHtml(opts.mentionedByName)}</b> te mencionó en la tarea <b>${escapeHtml(opts.taskTitle)}</b>:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">
        ${escapeHtml(opts.commentBody).replace(/\n/g, "<br/>")}
      </blockquote>
      <p><a href="${escapeHtml(link)}">Ver tarea →</a></p>
    `
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
    <p><b>Nombre:</b> ${escapeHtml(quote.name)}</p>
    <p><b>Correo:</b> ${escapeHtml(quote.email)}</p>
    <p><b>Teléfono:</b> ${escapeHtml(quote.phone)}</p>
    <p><b>Empresa:</b> ${escapeHtml(quote.company)}</p>
    <p><b>Servicio:</b> ${escapeHtml(quote.service)}</p>
    <p><b>Presupuesto:</b> ${escapeHtml(quote.budget)}</p>
    <p><b>Fecha límite:</b> ${escapeHtml(quote.deadline)}</p>
    <p><b>Mensaje:</b><br/>${escapeHtml(quote.message).replace(/\n/g, "<br/>")}</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_TO,
    replyTo: quote.email,
    subject: `Nueva cotización de ${quote.name.replace(/[\r\n]/g, " ")}`,
    html
  });
}
