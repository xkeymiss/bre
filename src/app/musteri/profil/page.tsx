"use client";

/**
 * Müşteri Profil Sayfası
 *
 * Ad, soyad, telefon ve şifre güncelleme.
 */

import { useState, useEffect, FormEvent, useRef } from "react";

interface ProfilVeri {
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  profilFoto?: string;
  rol: string;
  olusturmaTarihi: string;
}

export default function ProfilSayfasi() {
  const [profil, setProfil]         = useState<ProfilVeri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Form alanları
  const [ad, setAd]         = useState("");
  const [soyad, setSoyad]   = useState("");
  const [telefon, setTelefon] = useState("");

  // Şifre alanları
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre]     = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");

  // Durum
  const [gonderiyor, setGonderiyor]       = useState(false);
  const [basari, setBasari]               = useState("");
  const [hata, setHata]                   = useState("");
  const [aktifSekme, setAktifSekme]       = useState<"bilgiler" | "sifre">("bilgiler");

  // Profil fotosu
  const [profilFoto, setProfilFoto]       = useState<string | undefined>(undefined);
  const [fotoYukleniyor, setFotoYukleniyor] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/kullanici/profil")
      .then((r) => r.json())
      .then((json) => {
        if (json.basarili) {
          const k = json.veri.kullanici;
          setProfil(k);
          setAd(k.ad);
          setSoyad(k.soyad);
          setTelefon(k.telefon || "");
          setProfilFoto(k.profilFoto || undefined);
        }
      })
      .finally(() => setYukleniyor(false));
  }, []);

  // Profil fotosu yükle
  const fotoSec = () => dosyaInputRef.current?.click();

  const fotoDegisti = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setFotoYukleniyor(true);
    setHata("");
    try {
      // 1. Cloudinary'ye yükle
      const fd = new FormData();
      fd.append("dosya", dosya);
      const yukleR = await fetch("/api/yukle", { method: "POST", body: fd });
      const yukleJson = await yukleR.json();
      if (!yukleJson.basarili) throw new Error(yukleJson.hata || "Yükleme hatası");
      const yeniUrl: string = yukleJson.veri.url;

      // 2. Kullanıcı profiline kaydet
      const kaydetR = await fetch("/api/kullanici/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilFoto: yeniUrl }),
      });
      const kaydetJson = await kaydetR.json();
      if (!kaydetJson.basarili) throw new Error(kaydetJson.hata || "Kayıt hatası");

      setProfilFoto(yeniUrl);
      setBasari("Profil fotoğrafı güncellendi ✓");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Fotoğraf yüklenemedi");
    } finally {
      setFotoYukleniyor(false);
      // input'u sıfırla — aynı dosyayı tekrar seçebilsin
      if (dosyaInputRef.current) dosyaInputRef.current.value = "";
    }
  };

  const bilgiGonder = async (e: FormEvent) => {
    e.preventDefault();
    setGonderiyor(true);
    setHata("");
    setBasari("");
    try {
      const r = await fetch("/api/kullanici/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, soyad, telefon }),
      });
      const json = await r.json();
      if (json.basarili) {
        setBasari("Bilgiler güncellendi ✓");
        setProfil((prev) => prev ? { ...prev, ad, soyad, telefon } : prev);
      } else {
        setHata(json.hata || "Bir hata oluştu");
      }
    } finally {
      setGonderiyor(false);
    }
  };

  const sifreGonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata("");
    setBasari("");
    if (yeniSifre !== sifreTekrar) {
      setHata("Yeni şifreler eşleşmiyor");
      return;
    }
    if (yeniSifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalıdır");
      return;
    }
    setGonderiyor(true);
    try {
      const r = await fetch("/api/kullanici/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mevcutSifre, yeniSifre }),
      });
      const json = await r.json();
      if (json.basarili) {
        setBasari("Şifre değiştirildi ✓");
        setMevcutSifre("");
        setYeniSifre("");
        setSifreTekrar("");
      } else {
        setHata(json.hata || "Bir hata oluştu");
      }
    } finally {
      setGonderiyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-16)" }}>
        <span className="yukleniyor-dondurme" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!profil) {
    return (
      <div style={{ textAlign: "center", padding: "var(--bosluk-16)", color: "var(--renk-metin-ince)" }}>
        Profil yüklenemedi.
      </div>
    );
  }

  const avatarHarfler = `${profil.ad[0] || ""}${profil.soyad[0] || ""}`.toUpperCase();
  const kayitTarihi = new Date(profil.olusturmaTarihi).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{ padding: "var(--bosluk-8) 0 var(--bosluk-16)" }}>
      <div className="konteyner" style={{ maxWidth: 640 }}>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--bosluk-5)",
          marginBottom: "var(--bosluk-8)",
          padding: "var(--bosluk-6)",
          background: "var(--renk-beyaz)",
          borderRadius: "var(--yuvarlak-2xl)",
          border: "1px solid var(--renk-krem-sinir)",
          boxShadow: "var(--golge-sm)",
        }}>
          
          <div
            onClick={fotoSec}
            title="Fotoğraf değiştir"
            style={{
              position: "relative",
              width: 80,
              height: 80,
              borderRadius: "50%",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {profilFoto ? (
                            <img
                src={profilFoto}
                alt="Profil fotoğrafı"
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--renk-kahve), var(--renk-kahve-koyu))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-baslik)", fontWeight: 700,
                fontSize: "var(--boyut-xl)", color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}>
                {avatarHarfler}
              </div>
            )}
            
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.2s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              {fotoYukleniyor
                ? <span className="yukleniyor-dondurme" style={{ width: 20, height: 20, borderTopColor: "#fff" }} />
                : <span style={{ fontSize: 20 }}>📷</span>}
            </div>
            
            <input
              ref={dosyaInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={fotoDegisti}
            />
          </div>
          <div>
            <h1 style={{ fontSize: "var(--boyut-xl)", marginBottom: 4 }}>
              {profil.ad} {profil.soyad}
            </h1>
            <p style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)", margin: 0 }}>
              {profil.email}
            </p>
            <p style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)", marginTop: 4 }}>
              {profil.rol === "musteri" ? "👤 Müşteri" : profil.rol === "berber" ? "✂️ Berber" : "🔧 Admin"}
              {" · "}{kayitTarihi} tarihinde katıldı
            </p>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "var(--bosluk-2)",
          marginBottom: "var(--bosluk-5)",
          background: "var(--renk-krem-koyu)",
          borderRadius: "var(--yuvarlak-xl)",
          padding: "var(--bosluk-1)",
        }}>
          {(["bilgiler", "sifre"] as const).map((sekme) => (
            <button
              key={sekme}
              onClick={() => { setAktifSekme(sekme); setHata(""); setBasari(""); }}
              style={{
                flex: 1,
                padding: "var(--bosluk-2) var(--bosluk-4)",
                borderRadius: "var(--yuvarlak-lg)",
                border: "none",
                cursor: "pointer",
                fontWeight: aktifSekme === sekme ? 700 : 400,
                background: aktifSekme === sekme ? "var(--renk-beyaz)" : "transparent",
                color: aktifSekme === sekme ? "var(--renk-kahve)" : "var(--renk-metin-ince)",
                boxShadow: aktifSekme === sekme ? "var(--golge-sm)" : "none",
                transition: "all 0.2s",
                fontSize: "var(--boyut-sm)",
              }}
            >
              {sekme === "bilgiler" ? "👤 Bilgilerimi Düzenle" : "🔒 Şifre Değiştir"}
            </button>
          ))}
        </div>

        {basari && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--yuvarlak-lg)",
            padding: "var(--bosluk-3) var(--bosluk-4)",
            marginBottom: "var(--bosluk-4)",
            color: "#15803d",
            fontWeight: 600,
            fontSize: "var(--boyut-sm)",
          }}>
            {basari}
          </div>
        )}
        {hata && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "var(--yuvarlak-lg)",
            padding: "var(--bosluk-3) var(--bosluk-4)",
            marginBottom: "var(--bosluk-4)",
            color: "#dc2626",
            fontWeight: 600,
            fontSize: "var(--boyut-sm)",
          }}>
            {hata}
          </div>
        )}

        {aktifSekme === "bilgiler" && (
          <form
            onSubmit={bilgiGonder}
            style={{
              background: "var(--renk-beyaz)",
              borderRadius: "var(--yuvarlak-2xl)",
              border: "1px solid var(--renk-krem-sinir)",
              boxShadow: "var(--golge-sm)",
              padding: "var(--bosluk-6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--bosluk-4)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--bosluk-3)" }}>
              <div className="form-grubu">
                <label className="form-etiket" htmlFor="profil-ad">Ad</label>
                <input
                  id="profil-ad"
                  type="text"
                  className="form-giris"
                  value={ad}
                  onChange={(e) => setAd(e.target.value)}
                  required
                />
              </div>
              <div className="form-grubu">
                <label className="form-etiket" htmlFor="profil-soyad">Soyad</label>
                <input
                  id="profil-soyad"
                  type="text"
                  className="form-giris"
                  value={soyad}
                  onChange={(e) => setSoyad(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grubu">
              <label className="form-etiket" htmlFor="profil-email">E-posta</label>
              <input
                id="profil-email"
                type="email"
                className="form-giris"
                value={profil.email}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <p style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)", marginTop: 4 }}>
                E-posta adresi değiştirilemez
              </p>
            </div>

            <div className="form-grubu">
              <label className="form-etiket" htmlFor="profil-telefon">Telefon Numarası</label>
              <input
                id="profil-telefon"
                type="tel"
                className="form-giris"
                placeholder="05xx xxx xx xx"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-birincil btn-buyuk"
              disabled={gonderiyor}
              id="profil-kaydet-btn"
            >
              {gonderiyor
                ? <><span className="yukleniyor-dondurme" style={{ width: 16, height: 16, borderTopColor: "#fff" }} /> Kaydediliyor...</>
                : "Bilgileri Kaydet"}
            </button>
          </form>
        )}

        {aktifSekme === "sifre" && (
          <form
            onSubmit={sifreGonder}
            style={{
              background: "var(--renk-beyaz)",
              borderRadius: "var(--yuvarlak-2xl)",
              border: "1px solid var(--renk-krem-sinir)",
              boxShadow: "var(--golge-sm)",
              padding: "var(--bosluk-6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--bosluk-4)",
            }}
          >
            <div className="form-grubu">
              <label className="form-etiket" htmlFor="mevcut-sifre">Mevcut Şifre</label>
              <input
                id="mevcut-sifre"
                type="password"
                className="form-giris"
                placeholder="••••••••"
                value={mevcutSifre}
                onChange={(e) => setMevcutSifre(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{ height: 1, background: "var(--renk-krem-sinir)" }} />

            <div className="form-grubu">
              <label className="form-etiket" htmlFor="yeni-sifre">Yeni Şifre</label>
              <input
                id="yeni-sifre"
                type="password"
                className="form-giris"
                placeholder="En az 6 karakter"
                value={yeniSifre}
                onChange={(e) => setYeniSifre(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-grubu">
              <label className="form-etiket" htmlFor="sifre-tekrar">Yeni Şifre (Tekrar)</label>
              <input
                id="sifre-tekrar"
                type="password"
                className="form-giris"
                placeholder="Tekrar girin"
                value={sifreTekrar}
                onChange={(e) => setSifreTekrar(e.target.value)}
                required
                autoComplete="new-password"
              />
              {yeniSifre && sifreTekrar && yeniSifre !== sifreTekrar && (
                <p style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-hata)", marginTop: 4 }}>
                  Şifreler eşleşmiyor
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-birincil btn-buyuk"
              disabled={gonderiyor || (yeniSifre !== sifreTekrar && !!sifreTekrar)}
              id="sifre-kaydet-btn"
            >
              {gonderiyor
                ? <><span className="yukleniyor-dondurme" style={{ width: 16, height: 16, borderTopColor: "#fff" }} /> Değiştiriliyor...</>
                : "🔒 Şifreyi Değiştir"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
