"use client";

/**
 * Giriş Formu Bileşeni
 *
 * useSearchParams kullandığı için ayrı bir bileşene alındı
 * ve Suspense ile sarmalandı (Next.js gerekliliği).
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function GirisFormu() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || null;

  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");

    if (!email.trim() || !sifre) {
      setHata("E-posta ve şifre zorunludur");
      return;
    }

    setYukleniyor(true);
    try {
      const sonuc = await signIn("credentials", {
        email: email.trim(),
        sifre,
        redirect: false,
      });

      if (sonuc?.error) {
        setHata("E-posta veya şifre hatalı");
        return;
      }

      // Sunucu taraflı yönlendirme sayfasına gönder
      // /yonlendir, session'ı sunucuda okuyup role göre yönlendirir
      const hedef = callbackUrl
        ? `/yonlendir?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/yonlendir";

      window.location.href = hedef;

    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      {hata && (
        <div className="auth-hata-kutusu" role="alert" style={{ marginBottom: "var(--bosluk-4)" }}>
          <span aria-hidden="true">⚠</span> {hata}
        </div>
      )}

      <form className="auth-form" onSubmit={formuGonder} noValidate>
        
        <div className="form-grup">
          <label className="form-etiket" htmlFor="giris-email">E-posta</label>
          <input
            id="giris-email"
            type="email"
            className="form-girdi"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setHata(""); }}
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <div className="form-grup">
          <label className="form-etiket" htmlFor="giris-sifre">Şifre</label>
          <div className="sifre-alani">
            <input
              id="giris-sifre"
              type={sifreGoster ? "text" : "password"}
              className="form-girdi"
              placeholder="Şifrenizi girin"
              value={sifre}
              onChange={(e) => { setSifre(e.target.value); setHata(""); }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="sifre-goster-btn"
              onClick={() => setSifreGoster((g) => !g)}
              aria-label={sifreGoster ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {sifreGoster ? (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="giris-gonder-btn"
          className="btn btn-birincil btn-tam btn-buyuk"
          disabled={yukleniyor}
          style={{ marginTop: "var(--bosluk-2)" }}
        >
          {yukleniyor ? (
            <>
              <span className="yukleniyor-dondurme" style={{ width: 16, height: 16, borderTopColor: "#fff" }} />
              Giriş yapılıyor...
            </>
          ) : (
            "Giriş Yap"
          )}
        </button>
      </form>
    </>
  );
}
