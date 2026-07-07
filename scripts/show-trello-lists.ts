import fs from "fs";
import path from "path";

const JSON_PATH = path.join(
  process.cwd(),
  "fVF9Cs8O - proyectos-2025-2026.json"
);

function main() {
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const board = JSON.parse(raw);
  const lists: any[] = board.lists ?? [];
  console.log("=== LISTAS EN EL JSON DE TRELLO ===");
  console.log(lists.map(l => ({ id: l.id, name: l.name, closed: l.closed })));
}

main();
