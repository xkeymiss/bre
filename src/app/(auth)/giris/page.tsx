"use client";

/**
 * Giriş Sayfası
 *
 * NextAuth signIn fonksiyonuyla e-posta/şifre ile giriş.
 * Giriş sonrası role göre farklı panele yönlendirir.
 * Zaten giriş yapılmışsa /yonlendir'e yönlendirir.
 *
 * Not: useSearchParams Suspense ile sarmalanmalı (Next.js zorunluluğu)
 */

import { Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GirisFormu from "./GirisFormu";
import "../auth.css";

// Suspense fallback — form yüklenirken gösterilir
function FormYukleniyor() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-8)" }}>
      <span className="yukleniyor-dondurme" />
    </div>
  );
}

export default function GirisSayfasi() {
  const { status } = useSession();
  const router = useRouter();

  // Zaten giriş yapılmışsa yönlendir
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/yonlendir");
    }
  }, [status, router]);

  // Oturum yükleniyorsa veya zaten girişliyse spinner göster
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="auth-sayfa">
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "var(--bosluk-16)" }}>
          <span className="yukleniyor-dondurme" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-sayfa">
      <div className="auth-kart">
        <Link href="/" className="auth-logo">Bre</Link>
        <h1 className="auth-baslik">Hoş Geldin</h1>
        <p className="auth-alt-baslik">Hesabına giriş yap</p>

        {/* useSearchParams kullanan form Suspense ile sarmalandı */}
        <Suspense fallback={<FormYukleniyor />}>
          <GirisFormu />
        </Suspense>

        <p className="auth-alt-link">
          Hesabın yok mu?{" "}
          <Link href="/kayit">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
