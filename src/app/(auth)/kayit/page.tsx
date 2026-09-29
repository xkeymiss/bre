"use client";

/**
 * Kayıt Sayfası
 *
 * Herkes müşteri olarak kayıt olur.
 * Admin panelden rol yükseltilebilir.
 * Zaten giriş yapılmışsa /yonlendir'e yönlendirir.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import "../auth.css";

// Form alanlarının tipi
interface KayitFormu {
  ad: string;
  soyad: string;
  email: string;
  sifre: string;
  sifreTekrar: string;
  telefon: string;
}

const BOSLUK: KayitFormu = {
  ad: "", soyad: "", email: "",
  sifre: "", sifreTekrar: "", telefon: "",
};

export default function KayitSayfasi() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState<KayitFormu>(BOSLUK);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);

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

  // Tek bir handler ile tüm alanları yönet
  const alanDegisti = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((onceki) => ({ ...onceki, [name]: value }));
    setHata(""); // Kullanıcı yazmaya başlayınca hatayı temizle
  };

  // İstemci tarafı doğrulama
  const formuDogrula = (): string | null => {
    if (!form.ad.trim()) return "Ad zorunludur";
    if (!form.soyad.trim()) return "Soyad zorunludur";
    if (!form.email.trim()) return "E-posta zorunludur";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Geçerli bir e-posta girin";
    if (form.sifre.length < 8) return "Şifre en az 8 karakter olmalıdır";
    if (form.sifre !== form.sifreTekrar) return "Şifreler eşleşmiyor";
    return null;
  };

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    setBasari("");

    // İstemci doğrulama
    const dogrulamaHatasi = formuDogrula();
    if (dogrulamaHatasi) {
      setHata(dogrulamaHatasi);
      return;
    }

    setYukleniyor(true);
    try {
      const yanit = await fetch("/api/auth/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: form.ad.trim(),
          soyad: form.soyad.trim(),
          email: form.email.trim(),
          sifre: form.sifre,
          telefon: form.telefon.trim() || undefined,
        }),
      });

      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.hata || "Kayıt sırasında bir hata oluştu");
        return;
      }

      setBasari("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => router.push("/giris"), 1500);
    } catch {
      setHata("Bağlantı hatası. İnternet bağlantınızı kontrol edin.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="auth-sayfa">
      <div className="auth-kart">
        
        <Link href="/" className="auth-logo">Bre</Link>

        <h1 className="auth-baslik">Hesap Oluştur</h1>
        <p className="auth-alt-baslik">Ücretsiz kaydol, hemen randevu al</p>

        {hata && (
          <div className="auth-hata-kutusu" role="alert">
            <span aria-hidden="true">⚠</span> {hata}
          </div>
        )}
        {basari && (
          <div className="auth-basari-kutusu" role="status">
            <span aria-hidden="true">✓</span> {basari}
          </div>
        )}

        <form className="auth-form" onSubmit={formuGonder} noValidate>
          
          <div className="auth-isim-satiri">
            <div className="form-grup">
              <label className="form-etiket" htmlFor="kayit-ad">Ad</label>
              <input
                id="kayit-ad"
                name="ad"
                type="text"
                className="form-girdi"
                placeholder="Adınız"
                value={form.ad}
                onChange={alanDegisti}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="form-grup">
              <label className="form-etiket" htmlFor="kayit-soyad">Soyad</label>
              <input
                id="kayit-soyad"
                name="soyad"
                type="text"
                className="form-girdi"
                placeholder="Soyadınız"
                value={form.soyad}
                onChange={alanDegisti}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="form-grup">
            <label className="form-etiket" htmlFor="kayit-email">E-posta</label>
            <input
              id="kayit-email"
              name="email"
              type="email"
              className="form-girdi"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={alanDegisti}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket" htmlFor="kayit-telefon">
              Telefon <span style={{ color: "var(--renk-metin-soluk)", fontWeight: 400 }}>(opsiyonel)</span>
            </label>
            <input
              id="kayit-telefon"
              name="telefon"
              type="tel"
              className="form-girdi"
              placeholder="0555 000 00 00"
              value={form.telefon}
              onChange={alanDegisti}
              autoComplete="tel"
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket" htmlFor="kayit-sifre">Şifre</label>
            <div className="sifre-alani">
              <input
                id="kayit-sifre"
                name="sifre"
                type={sifreGoster ? "text" : "password"}
                className="form-girdi"
                placeholder="En az 8 karakter"
                value={form.sifre}
                onChange={alanDegisti}
                autoComplete="new-password"
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

          <div className="form-grup">
            <label className="form-etiket" htmlFor="kayit-sifre-tekrar">Şifre Tekrar</label>
            <input
              id="kayit-sifre-tekrar"
              name="sifreTekrar"
              type={sifreGoster ? "text" : "password"}
              className={`form-girdi ${form.sifreTekrar && form.sifre !== form.sifreTekrar ? "hata" : ""}`}
              placeholder="Şifrenizi tekrar girin"
              value={form.sifreTekrar}
              onChange={alanDegisti}
              autoComplete="new-password"
              required
            />
            {form.sifreTekrar && form.sifre !== form.sifreTekrar && (
              <span className="form-hata-mesaj">Şifreler eşleşmiyor</span>
            )}
          </div>

          <button
            type="submit"
            id="kayit-gonder-btn"
            className="btn btn-birincil btn-tam btn-buyuk"
            disabled={yukleniyor}
            style={{ marginTop: "var(--bosluk-2)" }}
          >
            {yukleniyor ? (
              <>
                <span className="yukleniyor-dondurme" style={{ width: 16, height: 16, borderTopColor: "#fff" }} />
                Kayıt yapılıyor...
              </>
            ) : (
              "Kayıt Ol"
            )}
          </button>
        </form>

        <p className="auth-alt-link">
          Zaten hesabın var mı?{" "}
          <Link href="/giris">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
