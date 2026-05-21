import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const S = "https://static.showit.co";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@printingideaspr.com";
  const adminPass = process.env.ADMIN_PASSWORD ?? "admin123";
  const password = await bcrypt.hash(adminPass, 10);
  const empPass = await bcrypt.hash("empleado123", 10);
  const cliPass = await bcrypt.hash("cliente123", 10);

  // ---- Users
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password, role: "admin", name: "Admin Ideas" },
    create: { email: adminEmail, password, name: "Admin Ideas", role: "admin", phone: "939-356-3399" }
  });

  const employees = await Promise.all([
    prisma.user.upsert({
      where: { email: "carlos@printingideaspr.com" },
      update: {},
      create: {
        email: "carlos@printingideaspr.com", password: empPass, name: "Carlos Rivera", role: "employee",
        position: "Instalador Sr.", department: "Instalaciones", phone: "787-555-0142", hourlyRate: 28
      }
    }),
    prisma.user.upsert({
      where: { email: "luis@printingideaspr.com" },
      update: {},
      create: {
        email: "luis@printingideaspr.com", password: empPass, name: "Luis Mendoza", role: "employee",
        position: "Operador Impresión", department: "Producción", phone: "787-555-0188", hourlyRate: 24
      }
    }),
    prisma.user.upsert({
      where: { email: "maria@printingideaspr.com" },
      update: {},
      create: {
        email: "maria@printingideaspr.com", password: empPass, name: "María Vélez", role: "employee",
        position: "Diseñadora", department: "Diseño", phone: "787-555-0173", hourlyRate: 26
      }
    }),
    prisma.user.upsert({
      where: { email: "empleado@printingideaspr.com" },
      update: {},
      create: {
        email: "empleado@printingideaspr.com", password: empPass, name: "Empleado Demo", role: "employee",
        position: "Técnico de manufactura", department: "Producción", phone: "787-555-0100", hourlyRate: 22
      }
    })
  ]);

  const clients = await Promise.all([
    prisma.user.upsert({
      where: { email: "cliente@printingideaspr.com" },
      update: {},
      create: {
        email: "cliente@printingideaspr.com", password: cliPass, name: "Cliente Demo", role: "client",
        company: "Demo Corp", phone: "787-555-9000"
      }
    }),
    prisma.user.upsert({
      where: { email: "compras@triple-s.com" },
      update: {},
      create: {
        email: "compras@triple-s.com", password: cliPass, name: "Sandra Ortiz", role: "client",
        company: "Triple-S", phone: "787-749-4949"
      }
    }),
    prisma.user.upsert({
      where: { email: "marketing@acuden.pr.gov" },
      update: {},
      create: {
        email: "marketing@acuden.pr.gov", password: cliPass, name: "José Pagán", role: "client",
        company: "ACUDEN", phone: "787-722-7900"
      }
    })
  ]);

  // ---- Services / Projects (existing)
  const services = [
    { slug: "manufactura", titleEs: "Manufactura", titleEn: "Manufacturing",
      descEs: "Producción interna en más de 8,500 pies cuadrados con equipos de gran formato. Fabricación de rótulos de alta calidad, letras canal con LED, dimensionales, estructuras metálicas y acabados premium.",
      descEn: "In-house production in over 8,500 sq. ft. with large-format equipment.",
      icon: "hammer", image: `${S}/800/aWeV4WYAhYvrom9sfuaMwA/300046/flota-triples.png`, order: 1 },
    { slug: "rotulacion", titleEs: "Rotulación", titleEn: "Signage",
      descEs: "Rótulos iluminados, vinilos para vidrieras, dimensionales, wayfinding y rotulación de flotas comerciales.",
      descEn: "Illuminated signs, window vinyl, dimensional letters, wayfinding and commercial fleet signage.",
      icon: "megaphone", image: `${S}/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg`, order: 2 },
    { slug: "instalacion", titleEs: "Instalación", titleEn: "Installation",
      descEs: "Equipo certificado para instalación de rotulación interior y exterior.",
      descEn: "Certified team for interior and exterior signage installation.",
      icon: "wrench", image: `${S}/400/G2Voi_31n0-Zhh1Kavl8SQ/300046/trabajadorencanasta.jpg`, order: 3 },
    { slug: "ingenieria-permisologia", titleEs: "Ingeniería y Permisología", titleEn: "Engineering & Permitting",
      descEs: "Diseño estructural, planos y tramitación de permisos.",
      descEn: "Structural design, drawings and permit processing.",
      icon: "compass", image: `${S}/400/Z5EzIDPRL5zbqI0eKAaySQ/300046/cohetexacuden.jpg`, order: 4 },
    { slug: "perito-electricista", titleEs: "Perito Electricista", titleEn: "Master Electrician",
      descEs: "Servicios de perito electricista certificado e ingeniería eléctrica.",
      descEn: "Certified master electrician services.",
      icon: "zap", image: `${S}/400/E-7O-UjKCmCDBqGqIFN6hw/shared/dji_20250119_103326_396.jpg`, order: 5 },
    { slug: "impresion-digital", titleEs: "Impresión Digital", titleEn: "Digital Printing",
      descEs: "Impresión digital de gran formato al por mayor.",
      descEn: "Wholesale large-format digital printing.",
      icon: "printer", image: `${S}/400/x37bsylFmkUtjgdoBvkthg/300046/dji_20250119_074040_830.jpg`, order: 6 }
  ];
  for (const s of services) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }

  const projects = [
    { slug: "rotulacion-flota-triple-s", titleEs: "Rotulación de flota — Triple-S", titleEn: "Fleet signage — Triple-S",
      descEs: "Rotulación integral de flota corporativa.", descEn: "Full corporate fleet wrap.",
      category: "Flotas", cover: `${S}/800/aWeV4WYAhYvrom9sfuaMwA/300046/flota-triples.png`, featured: true },
    { slug: "rotulacion-acuden", titleEs: "Proyecto ACUDEN", titleEn: "ACUDEN project",
      descEs: "Rotulación y branding institucional.", descEn: "Institutional signage and branding.",
      category: "Gobierno", cover: `${S}/1200/Th9_q0CBdytVlsJ1iImY5A/300046/acuden-work.png`, featured: true },
    { slug: "letras-canal-iluminadas", titleEs: "Letras canal iluminadas", titleEn: "Illuminated channel letters",
      descEs: "Fabricación e instalación con LED.", descEn: "Manufacturing and installation with LED.",
      category: "Manufactura", cover: `${S}/400/YiFgwy4crmCaR0iSnZMrIQ/300046/letras.jpg`, featured: true },
    { slug: "instalacion-altura", titleEs: "Instalación en altura", titleEn: "High-altitude installation",
      descEs: "Equipo certificado en canasta elevadora.", descEn: "Certified team with aerial lift.",
      category: "Instalación", cover: `${S}/400/G2Voi_31n0-Zhh1Kavl8SQ/300046/trabajadorencanasta.jpg`, featured: true },
    { slug: "vista-aerea-proyecto", titleEs: "Vista aérea de proyecto", titleEn: "Project aerial view",
      descEs: "Documentación con dron.", descEn: "Drone documentation.",
      category: "Aéreo", cover: `${S}/400/x37bsylFmkUtjgdoBvkthg/300046/dji_20250119_074040_830.jpg`, featured: true },
    { slug: "cohete-acuden", titleEs: "Estructura iconográfica ACUDEN", titleEn: "Iconic ACUDEN structure",
      descEs: "Pieza icónica institucional.", descEn: "Iconic institutional piece.",
      category: "Manufactura", cover: `${S}/400/Z5EzIDPRL5zbqI0eKAaySQ/300046/cohetexacuden.jpg`, featured: true }
  ];
  for (const p of projects) {
    await prisma.project.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  // ---- Wipe operational data so seed is idempotent
  await prisma.timeEntry.deleteMany();
  await prisma.message.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();

  // ---- Setup
  const [cliDemo, cliTripleS, cliAcuden] = clients;
  const [emp1, emp2, emp3, empDemo] = employees;

  // ---- Tasks
  const tasksData = [
    { assignee: emp3, title: "Diseño preliminar de wrap", status: "done", hours: 6, due: daysAgo(10) },
    { assignee: emp2, title: "Impresión de vinilos (lote 1)", status: "done", hours: 12, due: daysAgo(5) },
    { assignee: emp2, title: "Impresión de vinilos (lote 2)", status: "in_progress", hours: 4, due: daysFromNow(2) },
    { assignee: emp1, title: "Instalación unidades 1-6", status: "in_progress", hours: 18, due: daysFromNow(4) },
    { assignee: emp1, title: "Instalación unidades 7-12", status: "todo", hours: 0, due: daysFromNow(9) },
    { assignee: emp3, title: "Plano de wayfinding interior", status: "done", hours: 14, due: daysAgo(20) },
    { assignee: empDemo, title: "Manufactura piezas exteriores", status: "done", hours: 22, due: daysAgo(7) },
    { assignee: emp1, title: "Inspección de instalación", status: "in_progress", hours: 3, due: daysFromNow(3) },
    { assignee: empDemo, title: "Acabado y pintura", status: "blocked", hours: 0, due: daysFromNow(4), priority: "high" },
    { assignee: emp3, title: "Render 3D del logo", status: "done", hours: 5, due: daysAgo(5) },
    { assignee: empDemo, title: "Cortar y ensamblar caras", status: "in_progress", hours: 8, due: daysFromNow(2), priority: "urgent" },
    { assignee: emp2, title: "Cableado LED", status: "todo", hours: 0, due: daysFromNow(4), priority: "high" },
    { assignee: emp1, title: "Instalación en fachada", status: "todo", hours: 0, due: daysFromNow(6), priority: "high" },
    { assignee: emp1, title: "Coordinación con sucursales", status: "todo", hours: 0, due: daysFromNow(7) },
    { assignee: emp2, title: "Inventario de piezas", status: "todo", hours: 0, due: daysFromNow(10) }
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        assigneeId: t.assignee.id,
        title: t.title,
        status: t.status,
        priority: (t as { priority?: string }).priority ?? "normal",
        hours: t.hours,
        dueDate: t.due
      }
    });
  }

  // ---- Time entries (for empDemo)
  const empTasks = await prisma.task.findMany({ where: { assigneeId: empDemo.id } });
  for (const tk of empTasks) {
    if (tk.hours > 0) {
      await prisma.timeEntry.create({
        data: { taskId: tk.id, userId: empDemo.id, hours: Math.min(8, tk.hours), date: daysAgo(3), note: "Trabajo en taller" }
      });
    }
  }
  await prisma.timeEntry.create({
    data: { userId: empDemo.id, hours: 6, date: daysAgo(1), note: "Apoyo en montaje" }
  });
  await prisma.timeEntry.create({
    data: { userId: empDemo.id, hours: 4, date: new Date(), note: "Preparación de materiales" }
  });

  // ---- Invoices
  await prisma.invoice.createMany({
    data: [
      { number: "INV-2026-0101", clientId: cliTripleS.id, amount: 9250, paid: 9250, status: "paid", dueDate: daysAgo(5), paidAt: daysAgo(8), issuedAt: daysAgo(15) },
      { number: "INV-2026-0102", clientId: cliTripleS.id, amount: 9250, paid: 0, status: "pending", dueDate: daysFromNow(15), issuedAt: daysAgo(2) },
      { number: "INV-2026-0103", clientId: cliAcuden.id, amount: 16200, paid: 16200, status: "paid", dueDate: daysAgo(15), paidAt: daysAgo(20), issuedAt: daysAgo(35) },
      { number: "INV-2026-0104", clientId: cliAcuden.id, amount: 16200, paid: 0, status: "pending", dueDate: daysFromNow(10), issuedAt: daysAgo(3) },
      { number: "INV-2026-0105", clientId: cliDemo.id, amount: 4000, paid: 4000, status: "paid", dueDate: daysAgo(2), paidAt: daysAgo(4), issuedAt: daysAgo(8) },
      { number: "INV-2026-0106", clientId: cliDemo.id, amount: 4750, paid: 0, status: "overdue", dueDate: daysAgo(2), issuedAt: daysAgo(12) },
      { number: "INV-2026-0107", clientId: cliDemo.id, amount: 1250, paid: 1250, status: "paid", dueDate: daysAgo(20), paidAt: daysAgo(22), issuedAt: daysAgo(30) }
    ]
  });

  // ---- Messages
  await prisma.message.createMany({
    data: [
      { fromId: cliTripleS.id, toRole: "admin", body: "¿Cuándo podemos coordinar la entrega de las primeras 6 unidades?", createdAt: daysAgo(3) },
      { fromId: admin.id, toRole: "client", body: "Buenas Sandra, tenemos disponibilidad este viernes 9am. ¿Les funciona?", createdAt: daysAgo(2) },
      { fromId: cliTripleS.id, toRole: "admin", body: "Confirmado, viernes 9am en flota central.", createdAt: daysAgo(1) },
      { fromId: cliAcuden.id, toRole: "admin", body: "Necesitamos validar la paleta de colores antes de continuar.", createdAt: daysAgo(5) },
      { fromId: cliDemo.id, toRole: "admin", body: "El logo cambió ligeramente, les comparto el nuevo vector.", createdAt: daysAgo(2) },
      { fromId: admin.id, toRole: "client", body: "Recibido. Ajustamos el render y volvemos a coordinar.", createdAt: daysAgo(1), read: true }
    ]
  });

  console.log("Seed listo.");
  console.log(`Admin:    ${adminEmail} / [contraseña configurada en ADMIN_PASSWORD]`);
  console.log(`Empleado: empleado@printingideaspr.com / [ver seed.ts]`);
  console.log(`Cliente:  cliente@printingideaspr.com / [ver seed.ts]`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
