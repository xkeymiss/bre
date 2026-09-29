"use client";

/**
 * Admin Panel Sayfası
 *
 * Kullanıcı listesi + tek tıkla rol yükseltme + profil düzenleme.
 * Tüm kullanıcılar; müşteri, berber veya admin yapılabilir.
 * Admin, herhangi bir kullanıcının profil bilgilerini düzenleyebilir.
 */

import { useState, useEffect } from "react";
import "@/app/panel.css";

interface BerberProfilVeri {
  _id?: string;
  dukkanAdi?: string;
  il?: string;
  ilce?: string;
  adres?: string;
  aciklama?: string;
  kullaniciAdi?: string;
  haritaEmbedKodu?: string;
  googleMapsLinki?: string;
  aktif?: boolean;
}

interface KullaniciSatiri {
  _id: string;
  ad: string;
  soyad: string;
  email: string;
  rol: "musteri" | "berber" | "admin";
  telefon?: string;
  olusturmaTarihi: string;
  berberProfil?: BerberProfilVeri | null;
}

const ROL_RENK: Record<string, string> = {
  musteri: "rozet-tarafsiz",
  berber:  "rozet-uyari",
  admin:   "rozet-hata",
};

const ROL_ETIKET: Record<string, string> = {
  musteri: "Müşteri",
  berber:  "Berber",
  admin:   "Admin",
};

export default function AdminPanelSayfasi() {
  const [kullanicilar, setKullanicilar] = useState<KullaniciSatiri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [guncellenenId, setGuncellenenId] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [aramaMetni, setAramaMetni] = useState("");
  const [duzenleId, setDuzenleId] = useState<string | null>(null);

  const kullanicilariGetir = async () => {
    setYukleniyor(true);
    try {
      const r = await fetch("/api/admin/kullanicilar");
      const json = await r.json();
      if (json.basarili) setKullanicilar(json.veri.kullanicilar);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { kullanicilariGetir(); }, []);

  const rolGuncelle = async (kullaniciId: string, yeniRol: string) => {
    setGuncellenenId(kullaniciId);
    setHata("");
    try {
      const r = await fetch("/api/admin/kullanicilar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullaniciId, yeniRol }),
      });
      const json = await r.json();
      if (!r.ok) { setHata(json.hata); return; }

      setKullanicilar((onceki) =>
        onceki.map((k) =>
          k._id === kullaniciId ? { ...k, rol: yeniRol as "musteri" | "berber" | "admin" } : k
        )
      );
    } catch {
      setHata("Bağlantı hatası");
    } finally {
      setGuncellenenId(null);
    }
  };

  const kullaniciSil = async (kullanici: KullaniciSatiri) => {
    const onay = window.confirm(
      `"${kullanici.ad} ${kullanici.soyad}" (${kullanici.email}) kullanıcısı ve tüm verileri kalıcı olarak silinecek.\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`
    );
    if (!onay) return;

    setHata("");
    try {
      const r = await fetch("/api/admin/kullanicilar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullaniciId: kullanici._id }),
      });
      const json = await r.json();
      if (!r.ok) { setHata(json.hata); return; }
      setKullanicilar((onceki) => onceki.filter((k) => k._id !== kullanici._id));
      if (duzenleId === kullanici._id) setDuzenleId(null);
    } catch {
      setHata("Bağlantı hatası");
    }
  };

  // Arama filtresi
  const filtreliKullanicilar = kullanicilar.filter((k) => {
    const metin = aramaMetni.toLowerCase();
    const dukkan = k.berberProfil?.dukkanAdi?.toLowerCase() || "";
    return (
      k.ad.toLowerCase().includes(metin) ||
      k.soyad.toLowerCase().includes(metin) ||
      k.email.toLowerCase().includes(metin) ||
      dukkan.includes(metin)
    );
  });

  return (
    <div className="panel-sayfa">
      <div className="konteyner">
        
        <div className="panel-ust-baslik">
          <h1>Admin Paneli</h1>
          <p>Kullanıcı rollerini ve profillerini yönetin</p>
        </div>

        {hata && (
          <div className="auth-hata-kutusu" style={{ marginBottom: "var(--bosluk-4)" }}>
            ⚠ {hata}
          </div>
        )}

        <div className="istatistik-kartlari" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "var(--bosluk-6)" }}>
          {(["musteri", "berber", "admin"] as const).map((rol) => (
            <div key={rol} className="istatistik-kart">
              <div className="istatistik-kart-ikon">
                {rol === "musteri" ? "👤" : rol === "berber" ? "✂️" : "🛡️"}
              </div>
              <div className="istatistik-kart-sayi">
                {kullanicilar.filter((k) => k.rol === rol).length}
              </div>
              <div className="istatistik-kart-etiket">{ROL_ETIKET[rol]}</div>
            </div>
          ))}
        </div>

        <div className="panel-bolum">
          <div className="panel-bolum-baslik">
            <h2>Kullanıcılar ({filtreliKullanicilar.length})</h2>
            <input
              type="search"
              className="form-girdi"
              placeholder="Ad, soyad, e-posta veya dükkan ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              style={{ maxWidth: 300 }}
              id="admin-arama"
            />
          </div>

          {yukleniyor ? (
            <div className="panel-bos">
              <span className="yukleniyor-dondurme" style={{ width: 28, height: 28 }} />
            </div>
          ) : filtreliKullanicilar.length === 0 ? (
            <div className="panel-bos">Kullanıcı bulunamadı.</div>
          ) : (
            <div className="randevu-listesi">
              {filtreliKullanicilar.map((kullanici) => (
                <div key={kullanici._id} style={{ display: "flex", flexDirection: "column" }}>
                  <div className="randevu-satiri">
                    
                    <div className="randevu-satiri-sol">
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "var(--renk-krem-koyu)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "var(--boyut-md)", color: "var(--renk-kahve)",
                          flexShrink: 0,
                        }}
                      >
                        {kullanici.ad[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="randevu-musteri-adi">
                          {kullanici.ad} {kullanici.soyad}
                          {kullanici.berberProfil?.dukkanAdi && (
                            <span style={{ fontWeight: 400, color: "var(--renk-metin-ince)", marginLeft: "var(--bosluk-2)", fontSize: "var(--boyut-sm)" }}>
                              — {kullanici.berberProfil.dukkanAdi}
                            </span>
                          )}
                        </div>
                        <div className="randevu-hizmet-adi">
                          {kullanici.email}
                          {kullanici.telefon && ` · ${kullanici.telefon}`}
                          {kullanici.berberProfil?.kullaniciAdi && (
                            <span style={{ marginLeft: "var(--bosluk-2)" }}>
                              · /{kullanici.berberProfil.kullaniciAdi}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="randevu-satiri-sag">
                      <span className={`rozet ${ROL_RENK[kullanici.rol]}`}>
                        {ROL_ETIKET[kullanici.rol]}
                      </span>

                      <select
                        value={kullanici.rol}
                        onChange={(e) => rolGuncelle(kullanici._id, e.target.value)}
                        disabled={guncellenenId === kullanici._id}
                        className="form-girdi"
                        style={{ padding: "var(--bosluk-1) var(--bosluk-3)", fontSize: "var(--boyut-sm)" }}
                        aria-label={`${kullanici.ad} ${kullanici.soyad} rolünü değiştir`}
                      >
                        <option value="musteri">Müşteri</option>
                        <option value="berber">Berber</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        type="button"
                        className={`btn btn-kucuk ${duzenleId === kullanici._id ? "btn-birincil" : "btn-ikincil"}`}
                        onClick={() => setDuzenleId(duzenleId === kullanici._id ? null : kullanici._id)}
                      >
                        {duzenleId === kullanici._id ? "Kapat" : "✏️ Düzenle"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-tehlike btn-kucuk"
                        onClick={() => kullaniciSil(kullanici)}
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>

                  {duzenleId === kullanici._id && (
                    <ProfilDuzenleFormu
                      kullanici={kullanici}
                      onKaydet={async () => {
                        setDuzenleId(null);
                        await kullanicilariGetir();
                      }}
                      onIptal={() => setDuzenleId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfilDuzenleFormu({
  kullanici,
  onKaydet,
  onIptal,
}: {
  kullanici: KullaniciSatiri;
  onKaydet: () => void;
  onIptal: () => void;
}) {
  const [ad, setAd] = useState(kullanici.ad);
  const [soyad, setSoyad] = useState(kullanici.soyad);
  const [email, setEmail] = useState(kullanici.email);
  const [telefon, setTelefon] = useState(kullanici.telefon || "");

  // Berber profil alanları
  const bp = kullanici.berberProfil;
  const [dukkanAdi, setDukkanAdi] = useState(bp?.dukkanAdi || "");
  const [il, setIl] = useState(bp?.il || "");
  const [ilce, setIlce] = useState(bp?.ilce || "");
  const [adres, setAdres] = useState(bp?.adres || "");
  const [aciklama, setAciklama] = useState(bp?.aciklama || "");
  const [slug, setSlug] = useState(bp?.kullaniciAdi || "");
  const [haritaEmbedKodu, setHaritaEmbedKodu] = useState(bp?.haritaEmbedKodu || "");
  const [googleMapsLinki, setGoogleMapsLinki] = useState(bp?.googleMapsLinki || "");
  const [aktif, setAktif] = useState(bp?.aktif ?? true);

  const [gonderiyor, setGonderiyor] = useState(false);
  const [formHata, setFormHata] = useState("");
  const [formBasari, setFormBasari] = useState("");

  const kaydet = async () => {
    if (!ad.trim() || !soyad.trim() || !email.trim()) {
      setFormHata("Ad, soyad ve e-posta zorunludur");
      return;
    }
    setGonderiyor(true);
    setFormHata("");
    setFormBasari("");

    try {
      const body: Record<string, unknown> = {
        kullaniciId: kullanici._id,
        ad, soyad, email, telefon,
      };

      if (kullanici.rol === "berber") {
        body.berberProfil = {
          dukkanAdi, il, ilce, adres, aciklama,
          kullaniciAdi: slug || undefined,
          haritaEmbedKodu, googleMapsLinki,
          aktif,
        };
      }

      const r = await fetch("/api/admin/kullanicilar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok) { setFormHata(json.hata); return; }

      setFormBasari("Kaydedildi!");
      setTimeout(() => onKaydet(), 500);
    } catch {
      setFormHata("Bağlantı hatası");
    } finally {
      setGonderiyor(false);
    }
  };

  return (
    <div style={{
      background: "var(--renk-krem-koyu)",
      border: "1px solid var(--renk-krem-sinir)",
      borderTop: "none",
      borderRadius: "0 0 var(--yuvarlak-lg) var(--yuvarlak-lg)",
      padding: "var(--bosluk-5) var(--bosluk-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--bosluk-4)",
    }}>
      <h3 style={{ margin: 0, fontSize: "var(--boyut-md)" }}>
        Profil Düzenle — {kullanici.ad} {kullanici.soyad}
      </h3>

      {formHata && <div className="auth-hata-kutusu" style={{ margin: 0 }}>⚠ {formHata}</div>}
      {formBasari && <div className="auth-basari-kutusu" style={{ margin: 0 }}>✓ {formBasari}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--bosluk-3)" }}>
        <div className="form-grup">
          <label className="form-etiket">Ad</label>
          <input className="form-girdi" value={ad} onChange={(e) => setAd(e.target.value)} />
        </div>
        <div className="form-grup">
          <label className="form-etiket">Soyad</label>
          <input className="form-girdi" value={soyad} onChange={(e) => setSoyad(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--bosluk-3)" }}>
        <div className="form-grup">
          <label className="form-etiket">E-posta</label>
          <input className="form-girdi" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-grup">
          <label className="form-etiket">Telefon</label>
          <input className="form-girdi" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="0555 000 00 00" />
        </div>
      </div>

      {kullanici.rol === "berber" && (
        <>
          <hr style={{ border: "none", borderTop: "1px solid var(--renk-krem-sinir)", margin: "var(--bosluk-2) 0" }} />
          <h4 style={{ margin: 0, fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)" }}>
            ✂️ Berber Profili
          </h4>

          <div className="form-grup">
            <label className="form-etiket">Dükkan Adı</label>
            <input className="form-girdi" value={dukkanAdi} onChange={(e) => setDukkanAdi(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--bosluk-3)" }}>
            <div className="form-grup">
              <label className="form-etiket">İl</label>
              <input className="form-girdi" value={il} onChange={(e) => setIl(e.target.value)} />
            </div>
            <div className="form-grup">
              <label className="form-etiket">İlçe</label>
              <input className="form-girdi" value={ilce} onChange={(e) => setIlce(e.target.value)} />
            </div>
            <div className="form-grup">
              <label className="form-etiket">Sayfa Linki</label>
              <input className="form-girdi" value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="dukkan_adi" />
            </div>
          </div>

          <div className="form-grup">
            <label className="form-etiket">Adres</label>
            <input className="form-girdi" value={adres} onChange={(e) => setAdres(e.target.value)} />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Açıklama</label>
            <textarea className="form-girdi" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
              rows={2} style={{ resize: "vertical" }} />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--renk-krem-sinir)", margin: "var(--bosluk-1) 0" }} />
          <h4 style={{ margin: 0, fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)" }}>
            📍 Harita
          </h4>

          <div className="form-grup">
            <label className="form-etiket">
              Embed Kodu
              <span style={{ fontWeight: 400, color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-xs)", marginLeft: "var(--bosluk-2)" }}>
                (haritanın görüntüleneceği kod)
              </span>
            </label>
            <textarea className="form-girdi" value={haritaEmbedKodu} onChange={(e) => setHaritaEmbedKodu(e.target.value)}
              placeholder={'<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'}
              rows={3} style={{ resize: "vertical", fontFamily: "monospace", fontSize: "var(--boyut-xs)" }} />
          </div>

          <div className="form-grup">
            <label className="form-etiket">
              Maps Linki
              <span style={{ fontWeight: 400, color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-xs)", marginLeft: "var(--bosluk-2)" }}>
                (&quot;Maps&apos;te Aç&quot; butonu için)
              </span>
            </label>
            <input className="form-girdi" value={googleMapsLinki} onChange={(e) => setGoogleMapsLinki(e.target.value)}
              placeholder="https://maps.app.goo.gl/... veya https://www.google.com/maps/place/..." />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-2)", cursor: "pointer" }}>
            <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
            <span style={{ fontWeight: 600 }}>Profil Aktif</span>
            <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)" }}>
              (Pasif profiller berber listesinde görünmez)
            </span>
          </label>
        </>
      )}

      <div style={{ display: "flex", gap: "var(--bosluk-3)", marginTop: "var(--bosluk-2)" }}>
        <button type="button" className="btn btn-birincil" onClick={kaydet} disabled={gonderiyor}>
          {gonderiyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="button" className="btn btn-hayalet" onClick={onIptal}>
          İptal
        </button>
      </div>
    </div>
  );
}

