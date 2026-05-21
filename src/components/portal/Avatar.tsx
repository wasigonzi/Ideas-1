// Trello-style colored avatar from initials. Used in the task board + editor.
import Image from "next/image";

const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-lime-500",
  "bg-cyan-500",
  "bg-pink-500"
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function colorForId(id: string): string {
  return AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MemberAvatar({
  id,
  name,
  avatar,
  size = 28,
  ring = false,
  title
}: {
  id: string;
  name: string;
  avatar?: string | null;
  size?: number;
  ring?: boolean;
  title?: string;
}) {
  const ringCls = ring ? "ring-2 ring-[var(--color-ink-900,#0a1322)]" : "";
  const dim = { width: size, height: size };
  if (avatar) {
    return (
      <span
        className={`relative inline-flex rounded-full overflow-hidden ${ringCls}`}
        style={dim}
        title={title ?? name}
      >
        <Image src={avatar} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold ${colorForId(
        id
      )} ${ringCls}`}
      style={{ ...dim, fontSize: Math.max(10, Math.round(size * 0.42)) }}
      title={title ?? name}
    >
      {initialsOf(name)}
    </span>
  );
}
