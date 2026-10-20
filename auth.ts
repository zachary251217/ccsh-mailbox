import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

export const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true,
  pages: { signIn: "/admin", error: "/admin" },
  callbacks: {
    // 只允許學生會會帳登入後台
    signIn({ profile }) {
      return Boolean(profile?.email_verified && adminEmail && profile.email?.toLowerCase() === adminEmail);
    },
  },
});

/** 開發預覽時若尚未設定 Google 登入，直接放行，方便看畫面。 */
export const devBypass = !googleConfigured && process.env.NODE_ENV !== "production";

export async function isAdmin(): Promise<boolean> {
  if (devBypass) return true;
  const session = await auth();
  return Boolean(adminEmail && session?.user?.email?.toLowerCase() === adminEmail);
}
