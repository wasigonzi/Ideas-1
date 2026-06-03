import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        // Anti fuerza bruta: máximo 10 intentos por IP cada 5 minutos.
        let ip: string | null = null;
        try {
          ip = await getClientIp();
        } catch {
          ip = null;
        }
        if (ip && checkRateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
          throw new Error("Demasiados intentos. Espera unos minutos.");
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!user.active) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "admin";
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = (token.role as string) ?? "admin";
        (session.user as { role?: string; id?: string }).id = (token.uid as string) ?? "";
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      const u = user as { id?: string; email?: string; role?: string };
      await logAudit({
        actor: { id: u.id, email: u.email ?? undefined, role: u.role },
        action: "login",
        entity: "User",
        entityId: u.id,
        summary: `Inició sesión ${u.email ?? ""}`.trim(),
      });
    },
  }
});
