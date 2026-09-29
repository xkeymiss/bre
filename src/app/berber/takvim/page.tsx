"use client";

/**
 * Berber Takvim Sayfası
 *
 * İki görünüm:
 *   - Haftalık: 7 günlük sütun, randevular zaman dilimine göre renk kodlu
 *   - Günlük : Seçili günün saat saat listesi (08:00 - 20:00)
 *
 * Berber randevuları onaylayabilir, iptal edebilir, tamamlandı işaretleyebilir.
 */

import { useState, useEffect, useCallback } from "react";
import "@/app/panel.css";
import "./takvim.css";

const DURUM_RENK: Record<string, string> = {
  bekliyor:   "#D4A017",
  onaylandi:  "#2D6A4F",
  tamamlandi: "#6B7280",
  iptal:      "#B91C1C",
};

const DURUM_BG: Record<string, string> = {
  bekliyor:   "#FEF3C7",
  onaylandi:  "#D1FAE5",
  tamamlandi: "#F3F4F6",
  iptal:      "#FEE2E2",
};

const DURUM_ETIKET: Record<string, string> = {
  bekliyor:   "Bekliyor",
  onaylandi:  "Onaylandı",
  tamamlandi: "Tamamlandı",
  iptal:      "İptal",
};

const AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const GUN_ADLARI = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];

// 08:00'den 20:00'ye saat aralıkları
const SAATLER = Array.from({ length: 25 }, (_, i) => {
  const saat = Math.floor(i / 2) + 8;
  const dakika = i % 2 === 0 ? "00" : "30";
  return `${String(saat).padStart(2, "0")}:${dakika}`;
}).filter((s) => s <= "20:00");

interface Randevu {
  _id: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  durum: string;
  hizmet: { ad: string; sure: number; fiyat: number };
  musteri: { ad: string; soyad: string; telefon?: string } | string;
  personel?: { _id: string; ad: string; soyad: string; renk: string } | string;
}

interface PersonelItem {
  _id: string;
  ad: string;
  soyad: string;
  renk: string;
}

export default function BerberTakvimSayfasi() {
  const bugun = new Date();
  const [gorunum, setGorunum] = useState<"haftalik" | "gunluk">("haftalik");
  const [secilenTarih, setSecilenTarih] = useState(bugun);
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemId, setIslemId] = useState<string | null>(null);
  const [acikRandevu, setAcikRandevu] = useState<Randevu | null>(null);
  const [personelListesi, setPersonelListesi] = useState<PersonelItem[]>([]);
  const [secilenPersonelId, setSecilenPersonelId] = useState("hepsi");

  // Haftanın başlangıcını bul (Pazartesi)
  const haftaBaslangici = useCallback((tarih: Date) => {
    const d = new Date(tarih);
    const gun = d.getDay(); // 0=Pazar
    const fark = gun === 0 ? -6 : 1 - gun;
    d.setDate(d.getDate() + fark);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [haftaBaslangic, setHaftaBaslangic] = useState(() => haftaBaslangici(bugun));

  // Haftanın 7 günü
  const haftaGunleri = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(haftaBaslangic);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Randevuları getir — mevcut haftanın tüm günlerini kapsa
  const randevulariGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const params = new URLSearchParams({ tumRandevular: "1" });
      if (secilenPersonelId !== "hepsi") params.set("personelId", secilenPersonelId);
      const r = await fetch(`/api/berber/panel?${params}`);
      const json = await r.json();
      if (json.basarili) setRandevular(json.veri.tumRandevular ?? json.veri.bugunRandevular ?? []);
    } finally {
      setYukleniyor(false);
    }
  }, [secilenPersonelId]);

  useEffect(() => { randevulariGetir(); }, [randevulariGetir]);

  // Personel listesini yükle
  useEffect(() => {
    fetch("/api/berber/personel")
      .then((r) => r.json())
      .then((json) => { if (json.basarili) setPersonelListesi(json.veri.personel ?? []); });
  }, []);

  // Durum değiştir
  const durumGuncelle = async (randevuId: string, yeniDurum: string) => {
    setIslemId(randevuId);
    try {
      await fetch("/api/berber/panel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ randevuId, durum: yeniDurum }),
      });
      await randevulariGetir();
      setAcikRandevu(null);
    } finally {
      setIslemId(null);
    }
  };

  // Tarih nesnesini YYYY-MM-DD string'ine çevir (yerel saat dilimiyle, UTC kayması olmadan)
  const yerelTarihStr = (d: Date) => {
    const yil = d.getFullYear();
    const ay = String(d.getMonth() + 1).padStart(2, "0");
    const gun = String(d.getDate()).padStart(2, "0");
    return `${yil}-${ay}-${gun}`;
  };

  // Bir tarihe ait randevuları filtrele
  const gunRandevulari = (tarih: Date) => {
    const tarihStr = yerelTarihStr(tarih);
    return randevular.filter((r) => r.tarih === tarihStr && r.durum !== "iptal");
  };

  // Tarih string üret
  const tarihStr = (d: Date) => {
    return `${d.getDate()} ${AY_ADLARI[d.getMonth()]}`;
  };

  const bugunMu = (d: Date) => d.toDateString() === bugun.toDateString();

  // ── HAFTALIK GÖRÜNÜM ──────────────────────────────────────────────────────
  const renderHaftalikGorunum = () => (
    <div className="takvim-haftalik">
      
      <div className="takvim-gun-basliklar">
        {haftaGunleri.map((gun, i) => (
          <div
            key={i}
            className={`takvim-gun-baslik ${bugunMu(gun) ? "bugun" : ""}`}
            onClick={() => { setSecilenTarih(gun); setGorunum("gunluk"); }}
          >
            <span className="takvim-gun-kisa">{GUN_ADLARI[gun.getDay()]}</span>
            <span className={`takvim-gun-sayi ${bugunMu(gun) ? "bugun" : ""}`}>
              {gun.getDate()}
            </span>
            <span className="takvim-gun-ay">{AY_ADLARI[gun.getMonth()]}</span>
          </div>
        ))}
      </div>

      <div className="takvim-gun-sutunlar">
        {haftaGunleri.map((gun, i) => {
          const gunRandevulariListesi = gunRandevulari(gun);
          return (
            <div key={i} className={`takvim-gun-sutun ${bugunMu(gun) ? "bugun-sutun" : ""}`}>
              {gunRandevulariListesi.length === 0 ? (
                <div className="takvim-bos-gun">—</div>
              ) : (
                gunRandevulariListesi.map((r) => (
                  <button
                    key={r._id}
                    className="takvim-randevu-kart"
                    style={{
                      background: DURUM_BG[r.durum],
                      borderLeft: `3px solid ${
                        r.personel && typeof r.personel !== "string" ? r.personel.renk : DURUM_RENK[r.durum]
                      }`,
                    }}
                    onClick={() => setAcikRandevu(r)}
                  >
                    <span className="takvim-randevu-saat">{r.baslangicSaati}</span>
                    <span className="takvim-randevu-ad">
                      {typeof r.musteri === "string" ? "Müşteri" : `${r.musteri.ad} ${r.musteri.soyad[0]}.`}
                    </span>
                    <span className="takvim-randevu-hizmet">{r.hizmet.ad}</span>
                  </button>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── GÜNLÜK GÖRÜNÜM ────────────────────────────────────────────────────────
  const renderGunlukGorunum = () => {
    const secilenGunRandevular = gunRandevulari(secilenTarih);

    return (
      <div className="takvim-gunluk">
        {SAATLER.map((saat) => {
          const buSaatteRandevu = secilenGunRandevular.find((r) => r.baslangicSaati === saat);
          return (
            <div key={saat} className="takvim-saat-satiri">
              <div className="takvim-saat-etiket">{saat}</div>
              <div className="takvim-saat-icerik">
                {buSaatteRandevu ? (
                  <button
                    className="takvim-gunluk-randevu"
                    style={{ background: DURUM_BG[buSaatteRandevu.durum], borderLeft: `4px solid ${DURUM_RENK[buSaatteRandevu.durum]}` }}
                    onClick={() => setAcikRandevu(buSaatteRandevu)}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {typeof buSaatteRandevu.musteri === "string"
                        ? "Müşteri"
                        : `${buSaatteRandevu.musteri.ad} ${buSaatteRandevu.musteri.soyad}`}
                    </span>
                    <span style={{ color: "var(--renk-metin-ince)", fontSize: "var(--boyut-sm)" }}>
                      {buSaatteRandevu.hizmet.ad} · {buSaatteRandevu.baslangicSaati}–{buSaatteRandevu.bitisSaati}
                    </span>
                    <span className={`rozet rozet-sm`} style={{ color: DURUM_RENK[buSaatteRandevu.durum], background: DURUM_BG[buSaatteRandevu.durum] }}>
                      {DURUM_ETIKET[buSaatteRandevu.durum]}
                    </span>
                  </button>
                ) : (
                  <div className="takvim-bos-saat" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="panel-sayfa">
      <div className="konteyner">
        
        <div className="panel-ust-baslik" style={{ marginBottom: "var(--bosluk-4)" }}>
          <div>
            <h1>Takvimim</h1>
            <p>Randevularınızı yönetin</p>
          </div>

          <div style={{ display: "flex", gap: "var(--bosluk-2)", alignItems: "center", flexWrap: "wrap" }}>
            
            {personelListesi.length > 0 && (
              <select
                className="form-girdi"
                style={{ width: "auto", padding: "6px 12px", fontSize: "var(--boyut-sm)" }}
                value={secilenPersonelId}
                onChange={(e) => setSecilenPersonelId(e.target.value)}
                id="personel-filtre-select"
              >
                <option value="hepsi">Tüm Berberler</option>
                {personelListesi.map((p) => (
                  <option key={p._id} value={p._id}>{p.ad} {p.soyad}</option>
                ))}
              </select>
            )}
            <button
              className={`btn btn-kucuk ${gorunum === "haftalik" ? "btn-birincil" : "btn-hayalet"}`}
              onClick={() => setGorunum("haftalik")}
              id="haftalik-gorunum-btn"
            >
              Haftalık
            </button>
            <button
              className={`btn btn-kucuk ${gorunum === "gunluk" ? "btn-birincil" : "btn-hayalet"}`}
              onClick={() => setGorunum("gunluk")}
              id="gunluk-gorunum-btn"
            >
              Günlük
            </button>
          </div>
        </div>

        <div className="takvim-navigasyon">
          {gorunum === "haftalik" ? (
            <>
              <button className="btn btn-hayalet btn-kucuk" onClick={() => {
                const yeni = new Date(haftaBaslangic);
                yeni.setDate(yeni.getDate() - 7);
                setHaftaBaslangic(yeni);
              }}>‹ Önceki</button>

              <span className="takvim-donem-baslik">
                {tarihStr(haftaGunleri[0])} – {tarihStr(haftaGunleri[6])} {haftaGunleri[0].getFullYear()}
              </span>

              <button className="btn btn-hayalet btn-kucuk" onClick={() => {
                const yeni = new Date(haftaBaslangic);
                yeni.setDate(yeni.getDate() + 7);
                setHaftaBaslangic(yeni);
              }}>Sonraki ›</button>
            </>
          ) : (
            <>
              <button className="btn btn-hayalet btn-kucuk" onClick={() => {
                const yeni = new Date(secilenTarih);
                yeni.setDate(yeni.getDate() - 1);
                setSecilenTarih(yeni);
              }}>‹ Dün</button>

              <span className="takvim-donem-baslik">
                {GUN_ADLARI[secilenTarih.getDay()]}, {tarihStr(secilenTarih)} {secilenTarih.getFullYear()}
              </span>

              <button className="btn btn-hayalet btn-kucuk" onClick={() => {
                const yeni = new Date(secilenTarih);
                yeni.setDate(yeni.getDate() + 1);
                setSecilenTarih(yeni);
              }}>Yarın ›</button>
            </>
          )}
        </div>

        {yukleniyor ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-16)" }}>
            <span className="yukleniyor-dondurme" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <div className="takvim-kapsayici">
            {gorunum === "haftalik" ? renderHaftalikGorunum() : renderGunlukGorunum()}
          </div>
        )}
      </div>

      {acikRandevu && (
        <div className="modal-arkaplan" onClick={() => setAcikRandevu(null)}>
          <div className="modal-kart" onClick={(e) => e.stopPropagation()}>
            <div className="modal-baslik">
              <h3>Randevu Detayı</h3>
              <button className="modal-kapat" onClick={() => setAcikRandevu(null)}>✕</button>
            </div>

            <div className="modal-icerik">
              <div className="modal-satir">
                <span>Müşteri</span>
                <strong>
                  {typeof acikRandevu.musteri === "string"
                    ? "Müşteri"
                    : `${acikRandevu.musteri.ad} ${acikRandevu.musteri.soyad}`}
                </strong>
              </div>
              {typeof acikRandevu.musteri !== "string" && acikRandevu.musteri.telefon && (
                <div className="modal-satir">
                  <span>Telefon</span>
                  <strong>📞 {acikRandevu.musteri.telefon}</strong>
                </div>
              )}
              <div className="modal-satir">
                <span>Hizmet</span>
                <strong>{acikRandevu.hizmet.ad}</strong>
              </div>
              <div className="modal-satir">
                <span>Saat</span>
                <strong>{acikRandevu.baslangicSaati} – {acikRandevu.bitisSaati}</strong>
              </div>
              <div className="modal-satir">
                <span>Fiyat</span>
                <strong>{acikRandevu.hizmet.fiyat} ₺</strong>
              </div>
              <div className="modal-satir">
                <span>Durum</span>
                <span className="rozet" style={{ color: DURUM_RENK[acikRandevu.durum], background: DURUM_BG[acikRandevu.durum] }}>
                  {DURUM_ETIKET[acikRandevu.durum]}
                </span>
              </div>
            </div>

            <div className="modal-butonlar">
              {acikRandevu.durum === "bekliyor" && (
                <>
                  <button className="btn btn-birincil" disabled={islemId === acikRandevu._id}
                    onClick={() => durumGuncelle(acikRandevu._id, "onaylandi")}>
                    ✓ Onayla
                  </button>
                  <button className="btn btn-tehlike" disabled={islemId === acikRandevu._id}
                    onClick={() => durumGuncelle(acikRandevu._id, "iptal")}>
                    ✕ İptal
                  </button>
                </>
              )}
              {acikRandevu.durum === "onaylandi" && (
                <button className="btn btn-ikincil" disabled={islemId === acikRandevu._id}
                  onClick={() => durumGuncelle(acikRandevu._id, "tamamlandi")}>
                  ✓ Tamamlandı
                </button>
              )}
              <button className="btn btn-hayalet" onClick={() => setAcikRandevu(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
