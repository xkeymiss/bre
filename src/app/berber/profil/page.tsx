"use client";

/**
 * Berber Profil Oluşturma / Düzenleme Sayfası
 *
 * - Adres metin girişi (sade)
 * - maps.ie embed kodu yapıştırma alanı
 * - Hizmet listesi: ad + fiyat
 * - Çalışma saatleri gün bazlı
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/panel.css";

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const GUN_KISALTMA = ["pazartesi", "sali", "carsamba", "persembe", "cuma", "cumartesi", "pazar"];

const BOSLUK_CALISMA = GUNLER.reduce((acc, _, i) => ({
  ...acc,
  [GUN_KISALTMA[i]]: { acik: i < 6, acilis: "09:00", kapanis: "21:00" },
}), {} as Record<string, { acik: boolean; acilis: string; kapanis: string }>);

interface HizmetSatiri {
  ad: string;
  sure: number;
  fiyat: number;
}

interface PersonelSatiri {
  _id?: string;
  ad: string;
  soyad: string;
  telefon?: string;
  renk: string;
  calismaSaatleri: Record<string, { acik: boolean; acilis: string; kapanis: string }>;
}

const RENK_SECENEKLERI = [
  "#2D6A4F", "#1D4ED8", "#9333EA", "#DC2626", "#D97706", "#0891B2", "#BE185D", "#65A30D",
];

export default function BerberProfilSayfasi() {
  const router = useRouter();

  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [mevcutProfil, setMevcutProfil] = useState(false);
  const [personelListesi, setPersonelListesi] = useState<PersonelSatiri[]>([]);
  const [personelYukleniyor, setPersonelYukleniyor] = useState(false);
  const [personelDuzenleIdx, setPersonelDuzenleIdx] = useState<number | null>(null);
  const [yeniPersonelFormu, setYeniPersonelFormu] = useState(false);

  const [dukkanAdi, setDukkanAdi] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [adres, setAdres] = useState("");
  const [haritaEmbedKodu, setHaritaEmbedKodu] = useState("");
  const [googleMapsLinki, setGoogleMapsLinki] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [calismaSaatleri, setCalismaSaatleri] = useState(BOSLUK_CALISMA);
  const [hizmetler, setHizmetler] = useState<HizmetSatiri[]>([
    { ad: "Saç Kesimi", sure: 30, fiyat: 150 },
  ]);
  const [fotograflar, setFotograflar] = useState<string[]>([]);
  const [fotoYukleniyor, setFotoYukleniyor] = useState(false);

  useEffect(() => {
    fetch("/api/berber/profil")
      .then((r) => r.json())
      .then((json) => {
        if (json.basarili && json.veri.profil) {
          const p = json.veri.profil;
          setMevcutProfil(true);
          setDukkanAdi(p.dukkanAdi || "");
          setKullaniciAdi(p.kullaniciAdi || "");
          setIl(p.il || "");
          setIlce(p.ilce || "");
          setAdres(p.adres || "");
          setHaritaEmbedKodu(p.haritaEmbedKodu || "");
          setGoogleMapsLinki(p.googleMapsLinki || "");
          setAciklama(p.aciklama || "");
          if (p.calismaSaatleri) {
            // DB'den gelen baslangic/bitis/kapali formatını form'un acik/acilis/kapanis formatına çevir
            const donusturulmus = Object.fromEntries(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (Object.entries(p.calismaSaatleri) as [string, any][]).map(([gun, d]) => [
                gun,
                {
                  acik:    d.acik    !== undefined ? d.acik    : !(d.kapali ?? false),
                  acilis:  d.acilis  || d.baslangic || "09:00",
                  kapanis: d.kapanis || d.bitis     || "19:00",
                },
              ])
            );
            setCalismaSaatleri(donusturulmus as typeof BOSLUK_CALISMA);
          }
          if (p.hizmetler?.length) setHizmetler(p.hizmetler);
          if (p.fotograflar?.length) setFotograflar(p.fotograflar);
        }
      })
      .finally(() => setYukleniyor(false));

    // Personel listesini getir
    fetch("/api/berber/personel")
      .then((r) => r.json())
      .then((json) => {
        if (json.basarili && json.veri.personel) {
          setPersonelListesi(
            json.veri.personel.map((p: { _id: string; ad: string; soyad: string; renk: string; calismaSaatleri: Record<string, { kapali?: boolean; baslangic?: string; bitis?: string }> }) => ({
              _id: p._id,
              ad: p.ad,
              soyad: p.soyad,
              renk: p.renk,
              calismaSaatleri: Object.fromEntries(
                Object.entries(p.calismaSaatleri).map(([gun, d]) => [
                  gun,
                  { acik: !(d.kapali ?? false), acilis: d.baslangic || "09:00", kapanis: d.bitis || "19:00" },
                ])
              ),
            }))
          );
        }
      });
  }, []);

  const hizmetGuncelle = (index: number, alan: keyof HizmetSatiri, deger: string | number) => {
    setHizmetler((onceki) =>
      onceki.map((h, i) => (i === index ? { ...h, [alan]: deger } : h))
    );
  };

  const hizmetEkle = () => setHizmetler((h) => [...h, { ad: "", sure: 30, fiyat: 0 }]);
  const hizmetKaldir = (i: number) => setHizmetler((h) => h.filter((_, idx) => idx !== i));

  const saatGuncelle = (gun: string, alan: "acik" | "acilis" | "kapanis", deger: boolean | string) => {
    setCalismaSaatleri((onceki) => ({
      ...onceki,
      [gun]: { ...onceki[gun], [alan]: deger },
    }));
  };

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dukkanAdi.trim() || !il.trim() || !ilce.trim()) {
      setHata("Dükkan adı, il ve ilçe zorunludur");
      return;
    }
    if (kullaniciAdi && !/^[a-z0-9_]+$/.test(kullaniciAdi)) {
      setHata("Kullanıcı adı sadece küçük harf (a-z), rakam (0-9) ve alt çizgi (_) içerebilir");
      return;
    }
    if (kullaniciAdi && kullaniciAdi.length < 3) {
      setHata("Kullanıcı adı en az 3 karakter olmalıdır");
      return;
    }
    setGonderiyor(true);
    setHata("");
    try {
      const yanit = await fetch("/api/berber/profil", {
        method: mevcutProfil ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dukkanAdi, kullaniciAdi: kullaniciAdi || undefined, il, ilce, adres, haritaEmbedKodu, googleMapsLinki, aciklama, calismaSaatleri, hizmetler, fotograflar }),
      });
      const json = await yanit.json();
      if (!yanit.ok) { setHata(json.hata); return; }
      setBasari(mevcutProfil ? "Profil güncellendi!" : "Profil oluşturuldu!");
      setMevcutProfil(true);
      setTimeout(() => router.push("/berber/panel"), 1500);
    } catch {
      setHata("Bağlantı hatası");
    } finally {
      setGonderiyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="panel-sayfa">
        <div className="konteyner" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--bosluk-16)" }}>
          <span className="yukleniyor-dondurme" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-sayfa">
      <div className="konteyner" style={{ maxWidth: 720 }}>
        <div className="panel-ust-baslik">
          <h1>{mevcutProfil ? "Profili Düzenle" : "Profil Oluştur"}</h1>
          <p>{mevcutProfil ? "Dükkan bilgilerinizi güncelleyin" : "Dükkan bilgilerini girerek yayına alın"}</p>
        </div>

        {hata && <div className="auth-hata-kutusu" style={{ marginBottom: "var(--bosluk-5)" }}>⚠ {hata}</div>}
        {basari && <div className="auth-basari-kutusu" style={{ marginBottom: "var(--bosluk-5)" }}>✓ {basari}</div>}

        <form onSubmit={formuGonder} style={{ display: "flex", flexDirection: "column", gap: "var(--bosluk-6)" }}>

          <div className="panel-bolum">
            <div className="panel-bolum-baslik"><h2>Temel Bilgiler</h2></div>
            <div style={{ padding: "var(--bosluk-6)", display: "flex", flexDirection: "column", gap: "var(--bosluk-4)" }}>

              <div className="form-grup">
                <label className="form-etiket" htmlFor="dukkan-adi">Dükkan Adı *</label>
                <input id="dukkan-adi" className="form-girdi" value={dukkanAdi}
                  onChange={(e) => setDukkanAdi(e.target.value)} placeholder="Örn: Ahmet Berber" required />
              </div>

              <div className="form-grup">
                <label className="form-etiket" htmlFor="kullanici-adi">
                  Sayfa Linki (Kullanıcı Adı)
                  <span style={{ fontWeight: 400, color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-xs)", marginLeft: "var(--bosluk-2)" }}>
                    — sadece küçük harf, rakam ve _ kullanabilirsiniz
                  </span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <span style={{
                    background: "var(--renk-krem-koyu)",
                    border: "1px solid var(--renk-krem-sinir)",
                    borderRight: "none",
                    borderRadius: "var(--yuvarlak-md) 0 0 var(--yuvarlak-md)",
                    padding: "10px 12px",
                    fontSize: "var(--boyut-sm)",
                    color: "var(--renk-metin-soluk)",
                    whiteSpace: "nowrap",
                  }}>
                    berber.app/berberler/
                  </span>
                  <input
                    id="kullanici-adi"
                    className="form-girdi"
                    style={{ borderRadius: "0 var(--yuvarlak-md) var(--yuvarlak-md) 0" }}
                    value={kullaniciAdi}
                    onChange={(e) => setKullaniciAdi(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="mehmetberber"
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                {kullaniciAdi.length >= 3 && (
                  <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-basari)", marginTop: "var(--bosluk-1)" }}>
                    ✓ Linkiniz: <strong>/berberler/{kullaniciAdi}</strong>
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--bosluk-4)" }}>
                <div className="form-grup">
                  <label className="form-etiket" htmlFor="profil-il">İl *</label>
                  <input id="profil-il" className="form-girdi" value={il}
                    onChange={(e) => setIl(e.target.value)} placeholder="Nevşehir" required />
                </div>
                <div className="form-grup">
                  <label className="form-etiket" htmlFor="profil-ilce">İlçe *</label>
                  <input id="profil-ilce" className="form-girdi" value={ilce}
                    onChange={(e) => setIlce(e.target.value)} placeholder="Ürgüp" required />
                </div>
              </div>

              <div className="form-grup">
                <label className="form-etiket" htmlFor="profil-adres">Adres</label>
                <input id="profil-adres" className="form-girdi" value={adres}
                  onChange={(e) => setAdres(e.target.value)}
                  placeholder="Sokak, bina no, mahalle..." />
              </div>

              <div className="form-grup">
                <label className="form-etiket" htmlFor="profil-aciklama">Hakkımda</label>
                <textarea id="profil-aciklama" className="form-girdi" value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Deneyim, uzmanlık alanları..." rows={3}
                  style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          <div className="panel-bolum">
            <div className="panel-bolum-baslik">
              <h2>Harita</h2>
            </div>
            <div style={{ padding: "var(--bosluk-5) var(--bosluk-6)", display: "flex", flexDirection: "column", gap: "var(--bosluk-3)" }}>
              <div style={{
                background: "var(--renk-krem-koyu)",
                borderRadius: "var(--yuvarlak-lg)",
                padding: "var(--bosluk-4)",
                fontSize: "var(--boyut-sm)",
                lineHeight: 1.8,
              }}>
                <strong>📍 Google Maps&apos;ten embed kodu nasıl alınır?</strong>
                <ol style={{ margin: "var(--bosluk-2) 0 0", paddingLeft: "var(--bosluk-5)" }}>
                  <li>Google Maps&apos;te dükkanınızı aratın ve bulun</li>
                  <li>Sol panelde <strong>Paylaş</strong> &rsaquo; <strong>&quot;Haritayı yerleştir&quot;</strong> sekmesine geçin</li>
                  <li>Çıkan <code style={{ background: "rgba(0,0,0,0.08)", padding: "1px 4px", borderRadius: 3 }}>&lt;iframe ...&gt;</code> kodunu <strong>Embed Kodu</strong> alanına yapıştırın</li>
                  <li>Aynı Paylaş penceresinde <strong>&quot;Bağlantıyı kopyala&quot;</strong> sekmesindeki linki de <strong>Maps Linki</strong> alanına yapıştırın</li>
                </ol>
              </div>

              <div className="form-grup">
                <label className="form-etiket" htmlFor="profil-harita">
                  Embed Kodu
                  <span style={{ fontWeight: 400, color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-xs)", marginLeft: "var(--bosluk-2)" }}>
                    (haritanın görüntüleneceği kod)
                  </span>
                </label>
                <textarea
                  id="profil-harita"
                  className="form-girdi"
                  value={haritaEmbedKodu}
                  onChange={(e) => setHaritaEmbedKodu(e.target.value)}
                  placeholder={'<iframe src="https://www.google.com/maps/embed?pb=!1m18..." ...></iframe>'}
                  rows={3}
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: "var(--boyut-xs)" }}
                />
              </div>

              <div className="form-grup">
                <label className="form-etiket" htmlFor="profil-maps-link">
                  Maps Linki
                  <span style={{ fontWeight: 400, color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-xs)", marginLeft: "var(--bosluk-2)" }}>
                    (&quot;Maps&apos;te Aç&quot; butonu için)
                  </span>
                </label>
                <input
                  id="profil-maps-link"
                  className="form-girdi"
                  value={googleMapsLinki}
                  onChange={(e) => setGoogleMapsLinki(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... veya https://www.google.com/maps/place/..."
                />
                {haritaEmbedKodu && googleMapsLinki && (
                  <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-basari)" }}>
                    ✓ Harita ve link girildi — hazır!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="panel-bolum">
            <div className="panel-bolum-baslik">
              <h2>Fotoğraflar</h2>
            </div>
            <div style={{ padding: "var(--bosluk-5) var(--bosluk-6)", display: "flex", flexDirection: "column", gap: "var(--bosluk-4)" }}>
              <p style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)", margin: 0 }}>
                Dükkanınızın fotoğraflarını yükleyin. Müşteriler bu fotoğrafları profilinizde görecek.
              </p>

              {fotograflar.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "var(--bosluk-3)" }}>
                  {fotograflar.map((url, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--yuvarlak-lg)", overflow: "hidden", border: "1px solid var(--renk-krem-sinir)" }}>
                      <img src={url} alt={`Fotoğraf ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => setFotograflar((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: "absolute", top: 4, right: 4,
                          width: 24, height: 24, borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)", color: "#fff",
                          border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12,
                        }}
                        aria-label="Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--bosluk-2)",
                padding: "var(--bosluk-4)",
                border: "2px dashed var(--renk-krem-sinir)",
                borderRadius: "var(--yuvarlak-lg)",
                cursor: fotoYukleniyor ? "wait" : "pointer",
                color: "var(--renk-metin-soluk)",
                fontSize: "var(--boyut-sm)",
                transition: "border-color 0.2s",
              }}>
                {fotoYukleniyor ? (
                  <><span className="yukleniyor-dondurme" style={{ width: 16, height: 16 }} /> Yükleniyor...</>
                ) : (
                  <>📷 Fotoğraf Ekle (JPG, PNG, WebP — Max 5MB)</>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  disabled={fotoYukleniyor}
                  onChange={async (e) => {
                    const dosya = e.target.files?.[0];
                    if (!dosya) return;
                    setFotoYukleniyor(true);
                    try {
                      const fd = new FormData();
                      fd.append("dosya", dosya);
                      const r = await fetch("/api/yukle", { method: "POST", body: fd });
                      const json = await r.json();
                      if (json.basarili) {
                        setFotograflar((prev) => [...prev, json.veri.url]);
                      } else {
                        setHata(json.hata || "Fotoğraf yüklenemedi");
                      }
                    } catch {
                      setHata("Fotoğraf yükleme başarısız");
                    } finally {
                      setFotoYukleniyor(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="panel-bolum">
            <div className="panel-bolum-baslik">
              <h2>Hizmetler</h2>
              <button type="button" className="btn btn-ikincil btn-kucuk" onClick={hizmetEkle}>
                + Hizmet Ekle
              </button>
            </div>
            <div style={{ padding: "var(--bosluk-5) var(--bosluk-6)", display: "flex", flexDirection: "column", gap: "var(--bosluk-3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 36px", gap: "var(--bosluk-3)" }}>
                <span className="form-etiket">Hizmet Adı</span>
                <span className="form-etiket">Süre (dk)</span>
                <span className="form-etiket">Fiyat ₺</span>
                <span />
              </div>
              {hizmetler.map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 36px", gap: "var(--bosluk-3)", alignItems: "center" }}>
                  <input className="form-girdi" value={h.ad}
                    onChange={(e) => hizmetGuncelle(i, "ad", e.target.value)} placeholder="Saç Kesimi" />
                  <input type="number" className="form-girdi" value={h.sure} min={5} max={480}
                    onChange={(e) => hizmetGuncelle(i, "sure", parseInt(e.target.value) || 30)} />
                  <input type="number" className="form-girdi" value={h.fiyat} min={0}
                    onChange={(e) => hizmetGuncelle(i, "fiyat", parseInt(e.target.value) || 0)} />
                  <button type="button" className="btn btn-tehlike btn-kucuk"
                    onClick={() => hizmetKaldir(i)} disabled={hizmetler.length === 1}
                    aria-label="Kaldır"
                    style={{ padding: "var(--bosluk-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-bolum">
            <div className="panel-bolum-baslik"><h2>Çalışma Saatleri</h2></div>
            <div style={{ padding: "var(--bosluk-5) var(--bosluk-6)", display: "flex", flexDirection: "column", gap: "var(--bosluk-3)" }}>
              {GUNLER.map((gun, i) => {
                const key = GUN_KISALTMA[i];
                const durum = calismaSaatleri[key];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-4)", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-2)", minWidth: 120, cursor: "pointer" }}>
                      <input type="checkbox" checked={durum.acik}
                        onChange={(e) => saatGuncelle(key, "acik", e.target.checked)} />
                      <span style={{ fontWeight: durum.acik ? 600 : 400, color: durum.acik ? "var(--renk-metin)" : "var(--renk-metin-soluk)" }}>
                        {gun}
                      </span>
                    </label>
                    {durum.acik ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-2)" }}>
                        <input type="time" className="form-girdi" style={{ width: "auto", padding: "6px 10px" }}
                          value={durum.acilis} onChange={(e) => saatGuncelle(key, "acilis", e.target.value)} />
                        <span style={{ color: "var(--renk-metin-soluk)" }}>—</span>
                        <input type="time" className="form-girdi" style={{ width: "auto", padding: "6px 10px" }}
                          value={durum.kapanis} onChange={(e) => saatGuncelle(key, "kapanis", e.target.value)} />
                      </div>
                    ) : (
                      <span style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-soluk)" }}>Kapalı</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {mevcutProfil && (
            <div className="panel-bolum">
              <div className="panel-bolum-baslik">
                <h2>Berber Personeli</h2>
                <button
                  type="button"
                  className="btn btn-ikincil btn-kucuk"
                  onClick={() => { setYeniPersonelFormu(true); setPersonelDuzenleIdx(null); }}
                >
                  + Personel Ekle
                </button>
              </div>
              <div style={{ padding: "var(--bosluk-5) var(--bosluk-6)", display: "flex", flexDirection: "column", gap: "var(--bosluk-4)" }}>
                <p style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)", margin: 0 }}>
                  Aynı dükkanda çalışan berberler. Müşteriler randevu alırken berber seçebilir.
                </p>

                {personelYukleniyor ? (
                  <span className="yukleniyor-dondurme" style={{ width: 24, height: 24 }} />
                ) : (
                  personelListesi.map((p, i) => (
                    <div key={p._id || i} style={{ display: "flex", flexDirection: "column", gap: "var(--bosluk-2)" }}>
                      
                      <div style={{
                        display: "flex", alignItems: "center", gap: "var(--bosluk-3)",
                        padding: "var(--bosluk-3) var(--bosluk-4)",
                        background: "var(--renk-krem-koyu)",
                        borderRadius: personelDuzenleIdx === i ? "var(--yuvarlak-lg) var(--yuvarlak-lg) 0 0" : "var(--yuvarlak-lg)",
                        border: `2px solid ${p.renk}22`,
                        borderBottom: personelDuzenleIdx === i ? "none" : undefined,
                      }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: p.renk, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontWeight: 600 }}>{p.ad} {p.soyad}</span>
                        {p.telefon && <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)" }}>📞 {p.telefon}</span>}
                        <button type="button" className={`btn btn-kucuk ${personelDuzenleIdx === i ? "btn-birincil" : "btn-hayalet"}`}
                          onClick={() => {
                            setPersonelDuzenleIdx(personelDuzenleIdx === i ? null : i);
                            setYeniPersonelFormu(false);
                          }}>
                          {personelDuzenleIdx === i ? "Kapat" : "Düzenle"}
                        </button>
                        <button type="button" className="btn btn-tehlike btn-kucuk"
                          disabled={personelYukleniyor}
                          onClick={async () => {
                            if (!p._id || !confirm(`${p.ad} ${p.soyad} personeli kaldırılacak. Emin misiniz?`)) return;
                            setPersonelYukleniyor(true);
                            await fetch(`/api/berber/personel/${p._id}`, { method: "DELETE" });
                            setPersonelListesi((prev) => prev.filter((_, idx) => idx !== i));
                            if (personelDuzenleIdx === i) setPersonelDuzenleIdx(null);
                            setPersonelYukleniyor(false);
                          }}>
                          Kaldır
                        </button>
                      </div>

                      {personelDuzenleIdx === i && !yeniPersonelFormu && (
                        <div style={{ borderRadius: "0 0 var(--yuvarlak-lg) var(--yuvarlak-lg)", overflow: "hidden", border: `2px solid ${p.renk}22`, borderTop: "none" }}>
                          <PersonelFormu
                            key={`duzenle-${p._id || i}`}
                            mevcutVeri={personelListesi[i]}
                            GUNLER={GUNLER}
                            GUN_KISALTMA={GUN_KISALTMA}
                            RENK_SECENEKLERI={RENK_SECENEKLERI}
                            onKaydet={async (veri) => {
                              setPersonelYukleniyor(true);
                              try {
                                const r = await fetch(`/api/berber/personel/${p._id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(veri),
                                });
                                const json = await r.json();
                                if (json.basarili) {
                                  setPersonelListesi((prev) => prev.map((x, idx) =>
                                    idx === i ? { ...x, ...veri, _id: x._id } : x
                                  ));
                                  setPersonelDuzenleIdx(null);
                                }
                              } finally {
                                setPersonelYukleniyor(false);
                              }
                            }}
                            onIptal={() => setPersonelDuzenleIdx(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {yeniPersonelFormu && (
                  <PersonelFormu
                    mevcutVeri={undefined}
                    GUNLER={GUNLER}
                    GUN_KISALTMA={GUN_KISALTMA}
                    RENK_SECENEKLERI={RENK_SECENEKLERI}
                    onKaydet={async (veri) => {
                      setPersonelYukleniyor(true);
                      try {
                        const r = await fetch("/api/berber/personel", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(veri),
                        });
                        const json = await r.json();
                        if (json.basarili) {
                          setPersonelListesi((prev) => [...prev, { ...veri, _id: json.veri.personel._id }]);
                          setYeniPersonelFormu(false);
                        }
                      } finally {
                        setPersonelYukleniyor(false);
                      }
                    }}
                    onIptal={() => setYeniPersonelFormu(false)}
                  />
                )}
              </div>
            </div>
          )}

          <button type="submit" id="profil-kaydet-btn" className="btn btn-birincil btn-buyuk" disabled={gonderiyor}>
            {gonderiyor
              ? <><span className="yukleniyor-dondurme" style={{ width: 16, height: 16, borderTopColor: "#fff" }} /> Kaydediliyor...</>
              : mevcutProfil ? "Değişiklikleri Kaydet" : "Profil Oluştur"
            }
          </button>
        </form>
      </div>
    </div>
  );
}

function PersonelFormu({
  mevcutVeri,
  GUNLER,
  GUN_KISALTMA,
  RENK_SECENEKLERI,
  onKaydet,
  onIptal,
}: {
  mevcutVeri?: { ad: string; soyad: string; telefon?: string; renk: string; calismaSaatleri: Record<string, { acik: boolean; acilis: string; kapanis: string }> };
  GUNLER: string[];
  GUN_KISALTMA: string[];
  RENK_SECENEKLERI: string[];
  onKaydet: (veri: { ad: string; soyad: string; telefon?: string; renk: string; calismaSaatleri: Record<string, { acik: boolean; acilis: string; kapanis: string }> }) => void;
  onIptal: () => void;
}) {
  const [ad, setAd]         = useState(mevcutVeri?.ad || "");
  const [soyad, setSoyad]   = useState(mevcutVeri?.soyad || "");
  const [telefon, setTelefon] = useState(mevcutVeri?.telefon || "");
  const [renk, setRenk]     = useState(mevcutVeri?.renk || RENK_SECENEKLERI[0]);

  // DB'den {kapali, baslangic, bitis} veya {acik, acilis, kapanis} gelebilir — normalize et
  const normalizeSaatler = () => {
    if (!mevcutVeri?.calismaSaatleri) {
      return Object.fromEntries(GUN_KISALTMA.map((g, i) => [g, { acik: i < 6, acilis: "09:00", kapanis: "21:00" }]));
    }
    return Object.fromEntries(
      GUN_KISALTMA.map((g) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gun: any = (mevcutVeri.calismaSaatleri as any)[g] || {};
        // {kapali, baslangic, bitis} formatı
        if ("kapali" in gun || "baslangic" in gun) {
          return [g, { acik: !gun.kapali, acilis: gun.baslangic || "09:00", kapanis: gun.bitis || "21:00" }];
        }
        // {acik, acilis, kapanis} formatı
        return [g, { acik: gun.acik ?? true, acilis: gun.acilis || "09:00", kapanis: gun.kapanis || "21:00" }];
      })
    );
  };

  const [calismaSaatleri, setCalismaSaatleri] = useState(normalizeSaatler);

  const saatGuncelle = (gun: string, alan: "acik" | "acilis" | "kapanis", deger: boolean | string) => {
    setCalismaSaatleri((prev) => ({ ...prev, [gun]: { ...prev[gun], [alan]: deger } }));
  };

  return (
    <div style={{
      border: "1px solid var(--renk-krem-sinir)",
      borderRadius: "var(--yuvarlak-xl)",
      padding: "var(--bosluk-5)",
      background: "var(--renk-beyaz)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--bosluk-4)",
    }}>
      <h4 style={{ margin: 0 }}>{mevcutVeri ? "Personeli Düzenle" : "Yeni Personel Ekle"}</h4>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--bosluk-3)" }}>
        <div className="form-grup">
          <label className="form-etiket">Ad *</label>
          <input className="form-girdi" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ahmet" />
        </div>
        <div className="form-grup">
          <label className="form-etiket">Soyad *</label>
          <input className="form-girdi" value={soyad} onChange={(e) => setSoyad(e.target.value)} placeholder="Yılmaz" />
        </div>
      </div>
      <div className="form-grup">
        <label className="form-etiket">Telefon</label>
        <input className="form-girdi" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="0532 xxx xx xx" type="tel" />
      </div>

      <div className="form-grup">
        <label className="form-etiket">Takvim Rengi</label>
        <div style={{ display: "flex", gap: "var(--bosluk-2)", flexWrap: "wrap" }}>
          {RENK_SECENEKLERI.map((r) => (
            <button key={r} type="button" onClick={() => setRenk(r)} style={{
              width: 28, height: 28, borderRadius: "50%", background: r,
              border: renk === r ? "3px solid var(--renk-metin)" : "2px solid transparent",
              cursor: "pointer", outline: "none",
            }} />
          ))}
        </div>
      </div>

      <div>
        <p className="form-etiket" style={{ marginBottom: "var(--bosluk-2)" }}>Çalışma Saatleri</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--bosluk-2)" }}>
          {GUNLER.map((gun, i) => {
            const key = GUN_KISALTMA[i];
            const d = calismaSaatleri[key] || { acik: i < 6, acilis: "09:00", kapanis: "19:00" };
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-3)", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-2)", minWidth: 110, cursor: "pointer" }}>
                  <input type="checkbox" checked={d.acik} onChange={(e) => saatGuncelle(key, "acik", e.target.checked)} />
                  <span style={{ fontSize: "var(--boyut-sm)", fontWeight: d.acik ? 600 : 400, color: d.acik ? "var(--renk-metin)" : "var(--renk-metin-soluk)" }}>
                    {gun}
                  </span>
                </label>
                {d.acik ? (
                  <div style={{ display: "flex", gap: "var(--bosluk-2)", alignItems: "center" }}>
                    <input type="time" className="form-girdi" style={{ width: "auto", padding: "4px 8px" }}
                      value={d.acilis} onChange={(e) => saatGuncelle(key, "acilis", e.target.value)} />
                    <span style={{ color: "var(--renk-metin-soluk)" }}>—</span>
                    <input type="time" className="form-girdi" style={{ width: "auto", padding: "4px 8px" }}
                      value={d.kapanis} onChange={(e) => saatGuncelle(key, "kapanis", e.target.value)} />
                  </div>
                ) : (
                  <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)" }}>Kapalı</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--bosluk-3)" }}>
        <button type="button" className="btn btn-birincil"
          disabled={!ad.trim() || !soyad.trim()}
          onClick={() => onKaydet({ ad, soyad, telefon: telefon || undefined, renk, calismaSaatleri })}>
          Kaydet
        </button>
        <button type="button" className="btn btn-hayalet" onClick={onIptal}>İptal</button>
      </div>
    </div>
  );
}
