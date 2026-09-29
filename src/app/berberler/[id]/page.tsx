"use client";

/**
 * Berber Detay Sayfası
 *
 * Berber profili, hizmet listesi, aylık takvim ve saat seçicisi.
 * Seçim tamamlandığında randevu API'sine POST atar.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import YildizGosterge from "@/components/berber/YildizGosterge";
import YorumListesi from "@/components/berber/YorumListesi";
import { BerberProfil, Hizmet, SaatSlotu } from "@/types";
import "./berber-detay.css";

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function tarihiStr(yil: number, ay: number, gun: number): string {
  return `${yil}-${String(ay + 1).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

export default function BerberDetaySayfasi() {
  const params = useParams();
  const router = useRouter();
  const { data: oturum } = useSession();
  const berberId = params.id as string;

  // Berber verisi
  const [berber, setBerber] = useState<BerberProfil | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Seçim durumu
  const [seciliHizmetler, setSeciliHizmetler] = useState<Hizmet[]>([]);
  const [seciliTarih, setSeciliTarih] = useState<string>("");
  const [seciliSaat, setSeciliSaat] = useState<string>("");
  const [slotlar, setSlotlar] = useState<SaatSlotu[]>([]);
  const [slotYukleniyor, setSlotYukleniyor] = useState(false);
  // Personel
  const [personelListesi, setPersonelListesi] = useState<{ _id: string; ad: string; soyad: string; renk: string; telefon?: string }[]>([]);
  const [seciliPersonelId, setSeciliPersonelId] = useState<string>("");

  // Takvim durumu
  const bugun = new Date();
  const [gorulenAy, setGorulenAy] = useState(bugun.getMonth());
  const [gorulenYil, setGorulenYil] = useState(bugun.getFullYear());

  // Randevu gönderme
  const [randevuGonderiliyor, setRandevuGonderiliyor] = useState(false);
  const [basariMesaji, setBasariMesaji] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");

  // Berberi yükle
  useEffect(() => {
    fetch(`/api/berberler/${berberId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.basarili) {
          setBerber(json.veri.berber);
          setPersonelListesi(json.veri.personelListesi || []);
        }
      })
      .finally(() => setYukleniyor(false));
  }, [berberId]);

  // Toplam süre ve fiyat
  const toplamSure = seciliHizmetler.reduce((sum, h) => sum + h.sure, 0);
  const toplamFiyat = seciliHizmetler.reduce((sum, h) => sum + h.fiyat, 0);

  // Hizmet toggle: seçiliyse çıkar, değilse ekle
  const hizmetToggle = (hizmet: Hizmet) => {
    setSeciliHizmetler((prev) => {
      const varMi = prev.some((h) => h._id === hizmet._id);
      const yeni = varMi ? prev.filter((h) => h._id !== hizmet._id) : [...prev, hizmet];
      return yeni;
    });
    setSeciliSaat("");
  };

  // Tarih ve hizmet seçilince müsait slotları çek
  const slotlariGetir = useCallback(async () => {
    if (!seciliTarih || !seciliHizmetler.length) return;
    setSlotYukleniyor(true);
    setSeciliSaat("");
    try {
      const params = new URLSearchParams({
          tarih: seciliTarih,
          hizmetSuresi: String(toplamSure),
        });
        if (seciliPersonelId) params.set("personelId", seciliPersonelId);
        const r = await fetch(`/api/berberler/${berberId}?${params}`);
      const json = await r.json();
      if (json.basarili) setSlotlar(json.veri.slotlar || []);
    } finally {
      setSlotYukleniyor(false);
    }
  }, [berberId, seciliTarih, seciliHizmetler, seciliPersonelId, toplamSure]);

  useEffect(() => {
    slotlariGetir();
  }, [slotlariGetir]);

  // Takvim günlerini oluştur
  const takvimGunleriniOlustur = () => {
    const ilkGun = new Date(gorulenYil, gorulenAy, 1).getDay();
    // Pzt=0 olacak şekilde düzelt (JS'de Paz=0)
    const baslangicBoslugu = ilkGun === 0 ? 6 : ilkGun - 1;
    const ayinGunSayisi = new Date(gorulenYil, gorulenAy + 1, 0).getDate();

    const gunler: Array<{ gun: number | null; tarih: string }> = [];

    for (let i = 0; i < baslangicBoslugu; i++) {
      gunler.push({ gun: null, tarih: "" });
    }
    for (let g = 1; g <= ayinGunSayisi; g++) {
      gunler.push({ gun: g, tarih: tarihiStr(gorulenYil, gorulenAy, g) });
    }
    return gunler;
  };

  const gecmisMi = (tarih: string) => {
    if (!tarih) return true;
    const gun = new Date(tarih + "T00:00:00");
    const bugunBaslangic = new Date();
    bugunBaslangic.setHours(0, 0, 0, 0);
    return gun < bugunBaslangic;
  };

  // Randevu oluştur
  const randevuOlustur = async () => {
    if (!oturum?.user) {
      router.push(`/giris?callbackUrl=/berberler/${berberId}`);
      return;
    }
  if (!seciliHizmetler.length || !seciliTarih || !seciliSaat) return;

    setRandevuGonderiliyor(true);
    setHataMesaji("");
    try {
      const yanit = await fetch("/api/randevular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          berberId,
          hizmetIds: seciliHizmetler.map((h) => h._id),
          tarih: seciliTarih,
          baslangicSaati: seciliSaat,
          personelId: seciliPersonelId || undefined,
        }),
      });
      const json = await yanit.json();
      if (!yanit.ok) {
        setHataMesaji(json.hata || "Randevu oluşturulamadı");
        return;
      }
      setBasariMesaji("Randevunuz başarıyla alındı! 🎉");
      setTimeout(() => router.push("/musteri/randevularim"), 2000);
    } catch {
      setHataMesaji("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setRandevuGonderiliyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-16)" }}>
        <span className="yukleniyor-dondurme" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!berber) {
    return (
      <div className="konteyner" style={{ padding: "var(--bosluk-16) var(--bosluk-4)", textAlign: "center" }}>
        <h2>Berber Bulunamadı</h2>
        <Link href="/berberler" className="btn btn-birincil" style={{ marginTop: "var(--bosluk-4)" }}>
          Berberlere Dön
        </Link>
      </div>
    );
  }

    const takvimGunleri = takvimGunleriniOlustur();
  const bugunStr = tarihiStr(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());

  return (
    <div className="berber-detay-sayfa">
      
      <div className="berber-hero">
        <div className="konteyner">
          <div className="berber-hero-icerik">
            <div className="berber-profil-foto">
              {berber.fotograflar?.[0] ? (
                <img src={berber.fotograflar[0]} alt={berber.dukkanAdi} />
              ) : "✂️"}
            </div>
            <div className="berber-hero-bilgi">
              <h1 className="berber-hero-baslik">{berber.dukkanAdi}</h1>
              <div className="berber-hero-alt">
                <YildizGosterge puan={berber.ortalamaPuan} />
                <span style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)" }}>
                  {berber.ortalamaPuan > 0
                    ? `${berber.ortalamaPuan.toFixed(1)} (${berber.puanSayisi} yorum)`
                    : "Henüz değerlendirme yok"}
                </span>
              </div>
              <p className="berber-hero-konum">
                📍 {berber.adres}, {berber.ilce} / {berber.il}
              </p>
              {berber.aciklama && (
                <p style={{ marginTop: "var(--bosluk-3)", color: "var(--renk-metin-ince)", fontSize: "var(--boyut-sm)" }}>
                  {berber.aciklama}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="konteyner">
        <div className="berber-detay-icerik">
          
          <div>
            <h2 className="detay-bolum-baslik">Hizmetler</h2>
            {berber.hizmetler.length === 0 ? (
              <p style={{ color: "var(--renk-metin-ince)" }}>Henüz hizmet eklenmemiş.</p>
            ) : (
              <div className="hizmetler-listesi">
                {berber.hizmetler.map((hizmet) => {
                  const seciliMi = seciliHizmetler.some((h) => h._id === hizmet._id);
                  return (
                    <button
                      key={hizmet._id}
                      className={`hizmet-satiri ${seciliMi ? "secili" : ""}`}
                      onClick={() => hizmetToggle(hizmet)}
                      aria-pressed={seciliMi}
                    >
                      <div>
                        <div className="hizmet-adi">{hizmet.ad}</div>
                        <div className="hizmet-sure">{hizmet.sure} dakika</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <span className="hizmet-fiyat">{hizmet.fiyat} ₺</span>
                        {seciliMi && <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-basari)" }}>✓ Seçildi</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {personelListesi.length > 0 ? (
              <>
                <h2 className="detay-bolum-baslik" style={{ marginTop: "var(--bosluk-8)" }}>
                  Berberler
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--bosluk-2)" }}>
                  {personelListesi.map((p) => (
                    <div key={p._id} style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-3)" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.renk, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{p.ad} {p.soyad}</span>
                      {p.telefon && (
                        <span style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)" }}>📞 {p.telefon}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {berber.haritaEmbedKodu && (() => {
              // iframe src'yi embed kodundan güvenli şekilde çıkar
              const srcEslestirme = berber.haritaEmbedKodu.match(/src="([^"]+)"/);
              const iframeSrc = srcEslestirme?.[1] ?? "";
              if (!iframeSrc) return null;

              return (
                <div style={{ marginTop: "var(--bosluk-8)" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--bosluk-3)",
                    paddingBottom: "var(--bosluk-3)",
                    borderBottom: "1px solid var(--renk-krem-sinir)",
                  }}>
                    <h2 className="detay-bolum-baslik" style={{ margin: 0, border: "none", padding: 0 }}>
                      Konum
                    </h2>
                    <a
                      href={berber.googleMapsLinki || `https://www.google.com/maps/search/${encodeURIComponent(`${berber.dukkanAdi} ${berber.ilce} ${berber.il}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-hayalet btn-kucuk"
                    >
                      📍 Maps&apos;te Aç
                    </a>
                  </div>
                  <div style={{ borderRadius: "var(--yuvarlak-xl)", overflow: "hidden", border: "1px solid var(--renk-krem-sinir)", position: "relative" }}>
                    <iframe
                      width="100%"
                      height="300"
                      frameBorder="0"
                      scrolling="no"
                      src={iframeSrc}
                      title={`${berber.dukkanAdi} harita konumu`}
                      loading="lazy"
                      style={{ display: "block" }}
                      allowFullScreen
                    />
                    
                    <style>{`
                      .harita-sarici a[href*="gps.ie"],
                      .harita-sarici a[href*="maps.ie"] {
                        display: none !important;
                      }
                    `}</style>
                  </div>
                </div>
              );
            })()}

            <YorumListesi
              berberId={berberId}
              ortalamaPuan={berber.ortalamaPuan}
              puanSayisi={berber.puanSayisi}
            />
          </div>

          <div className="randevu-paneli">
            <div className="takvim-kart">
              
              {personelListesi.length > 0 && seciliHizmetler.length > 0 && (
                <div style={{ padding: "var(--bosluk-4)", borderBottom: "1px solid var(--renk-krem-sinir)" }}>
                  <p style={{ fontSize: "var(--boyut-sm)", fontWeight: 600, marginBottom: "var(--bosluk-3)" }}>
                    Berber Seç *
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--bosluk-2)" }}>
                    {personelListesi.map((p) => (
                      <button
                        key={p._id}
                        className={`btn btn-kucuk ${seciliPersonelId === p._id ? "btn-birincil" : "btn-hayalet"}`}
                        style={{ borderLeft: `3px solid ${p.renk}`, paddingLeft: "var(--bosluk-3)" }}
                        onClick={() => { setSeciliPersonelId(p._id); setSeciliSaat(""); }}
                      >
                        {p.ad} {p.soyad}
                      </button>
                    ))}
                  </div>
                  {personelListesi.length > 0 && !seciliPersonelId && (
                    <p style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-hata)", marginTop: "var(--bosluk-2)" }}>
                      Lütfen bir berber seçin
                    </p>
                  )}
                </div>
              )}

              <div className="takvim-baslik">
                <button
                  className="takvim-nav-btn"
                  onClick={() => {
                    if (gorulenAy === 0) { setGorulenAy(11); setGorulenYil((y) => y - 1); }
                    else setGorulenAy((a) => a - 1);
                  }}
                  disabled={gorulenYil === bugun.getFullYear() && gorulenAy === bugun.getMonth()}
                  aria-label="Önceki ay"
                >‹</button>
                <span className="takvim-ay-yil">
                  {AY_ADLARI[gorulenAy]} {gorulenYil}
                </span>
                <button
                  className="takvim-nav-btn"
                  onClick={() => {
                    if (gorulenAy === 11) { setGorulenAy(0); setGorulenYil((y) => y + 1); }
                    else setGorulenAy((a) => a + 1);
                  }}
                  aria-label="Sonraki ay"
                >›</button>
              </div>

              <div className="takvim-gun-isimleri">
                {GUN_ADLARI.map((g) => (
                  <div key={g} className="takvim-gun-ismi">{g}</div>
                ))}
              </div>

              <div className="takvim-gunler">
                {takvimGunleri.map((item, i) => {
                  if (!item.gun) return <div key={`bos-${i}`} className="takvim-gun bos" />;
                  const eskiMi = gecmisMi(item.tarih);
                  const bugunMu = item.tarih === bugunStr;
                  const seciliMi = item.tarih === seciliTarih;

                  return (
                    <button
                      key={item.tarih}
                      className={[
                        "takvim-gun",
                        bugunMu && !seciliMi ? "bugun" : "",
                        seciliMi ? "secili" : "",
                        eskiMi ? "gecmis" : "",
                      ].join(" ")}
                      onClick={() => !eskiMi && setSeciliTarih(item.tarih)}
                      disabled={eskiMi}
                      aria-label={`${item.gun} ${AY_ADLARI[gorulenAy]}`}
                      aria-pressed={seciliMi}
                    >
                      {item.gun}
                    </button>
                  );
                })}
              </div>

              {seciliTarih && seciliHizmetler.length > 0 && (
                <div className="saat-slotlari">
                  <p className="saat-slotlari-baslik">
                    Müsait Saatler
                    {slotYukleniyor && " ⏳"}
                  </p>
                  {!slotYukleniyor && slotlar.length === 0 && (
                    <p style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-soluk)" }}>
                      Bu gün için müsait saat yok.
                    </p>
                  )}
                  {!slotYukleniyor && slotlar.length > 0 && (
                    <div className="saat-grid">
                      {slotlar.map((slot) => (
                        <button
                          key={slot.baslangic}
                          className={`saat-btn ${!slot.musait ? "dolu" : ""} ${seciliSaat === slot.baslangic ? "secili" : ""}`}
                          onClick={() => slot.musait && setSeciliSaat(slot.baslangic)}
                          disabled={!slot.musait}
                          aria-label={`${slot.baslangic} ${slot.musait ? "müsait" : "dolu"}`}
                        >
                          {slot.baslangic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {seciliHizmetler.length > 0 && seciliTarih && seciliSaat &&
                (personelListesi.length === 0 || seciliPersonelId) && (
                <div className="randevu-al-alani">
                  
                  <div className="randevu-ozet">
                    {seciliHizmetler.map((h) => (
                      <div key={h._id} className="randevu-ozet-satir">
                        <span>{h.ad}</span>
                        <strong>{h.fiyat} ₺</strong>
                      </div>
                    ))}
                    {seciliHizmetler.length > 1 && (
                      <div className="randevu-ozet-satir" style={{ borderTop: "1px solid var(--renk-krem-sinir)", paddingTop: "var(--bosluk-2)", marginTop: "var(--bosluk-1)" }}>
                        <span>Toplam Süre</span>
                        <strong>{toplamSure} dk</strong>
                      </div>
                    )}
                    <div className="randevu-ozet-satir">
                      <span>Tarih</span>
                      <strong>{seciliTarih}</strong>
                    </div>
                    <div className="randevu-ozet-satir">
                      <span>Saat</span>
                      <strong>{seciliSaat}</strong>
                    </div>
                    {seciliPersonelId && (() => {
                      const p = personelListesi.find(x => x._id === seciliPersonelId);
                      return p ? (
                        <div className="randevu-ozet-satir">
                          <span>Berber</span>
                          <strong>{p.ad} {p.soyad}</strong>
                        </div>
                      ) : null;
                    })()}
                    <div className="randevu-ozet-satir">
                      <span>Toplam Ücret</span>
                      <strong style={{ color: "var(--renk-kahve)" }}>{toplamFiyat} ₺</strong>
                    </div>
                  </div>

                  {hataMesaji && (
                    <div className="auth-hata-kutusu" style={{ marginBottom: "var(--bosluk-3)" }}>
                      ⚠ {hataMesaji}
                    </div>
                  )}
                  {basariMesaji && (
                    <div className="auth-basari-kutusu" style={{ marginBottom: "var(--bosluk-3)" }}>
                      ✓ {basariMesaji}
                    </div>
                  )}

                  <button
                    className="btn btn-birincil btn-tam btn-buyuk"
                    onClick={randevuOlustur}
                    disabled={randevuGonderiliyor}
                    id="randevu-al-btn"
                  >
                    {randevuGonderiliyor ? (
                      <>
                        <span className="yukleniyor-dondurme" style={{ width: 16, height: 16, borderTopColor: "#fff" }} />
                        Randevu alınıyor...
                      </>
                    ) : (
                      oturum ? "Randevu Al" : "Giriş Yap & Randevu Al"
                    )}
                  </button>
                </div>
              )}

              {!seciliHizmetler.length && (
                <div style={{ padding: "var(--bosluk-5)", textAlign: "center", color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-sm)" }}>
                  👈 Hizmet seçerek başlayın (birden fazla seçebilirsiniz)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
