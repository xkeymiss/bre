import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const KORUNAN_ROTALAR: Record<string, string[]> = {
  "/berber": ["berber", "admin"],
  "/admin":  ["admin"],
  "/musteri": ["musteri", "berber", "admin"],
};

export async function proxy(istek: NextRequest) {
  const { pathname } = istek.nextUrl;

  const korunanGrup = Object.keys(KORUNAN_ROTALAR).find((rota) =>
    pathname.startsWith(rota)
  );

  if (!korunanGrup) return NextResponse.next();

  // NextAuth v5 auth() — cookie adı, secret vb. otomatik çözülür
  const oturum = await auth();

  if (!oturum?.user) {
    const girisUrl = new URL("/giris", istek.url);
    girisUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(girisUrl);
  }

  const izinliRoller = KORUNAN_ROTALAR[korunanGrup];
  const kullaniciRol = (oturum.user as { rol?: string }).rol;

  if (!kullaniciRol || !izinliRoller.includes(kullaniciRol)) {
    return NextResponse.redirect(new URL("/", istek.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/berber/:path*",
    "/admin/:path*",
    "/musteri/:path*",
  ],
};
