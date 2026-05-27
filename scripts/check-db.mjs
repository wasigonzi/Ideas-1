import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const [cols, task] = await Promise.all([
  p.taskColumn.findMany({ orderBy: { position: 'asc' } }),
  p.task.findFirst({ where: { title: { contains: 'testw', mode: 'insensitive' } } })
]);
console.log('COLUMNS:', JSON.stringify(cols.map(c => ({ key: c.key, label: c.label }))));
console.log('TASK:', JSON.stringify(task ? { id: task.id, title: task.title, status: task.status } : null));
await p.$disconnect();
