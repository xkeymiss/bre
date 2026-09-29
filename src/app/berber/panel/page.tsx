"use client";

/**
 * Berber Panel Sayfası — Dashboard
 *
 * Bugünkü randevuları listeler, durum değiştirme butonları sunar.
 * İstatistik kartları: bugün / bekleyen / toplam tamamlanan.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Randevu } from "@/types";
import "@/app/panel.css";

// Durum rozet renkleri
const DURUM_RENK: Record<string, string> = {
  bekliyor:    "rozet-uyari",
  onaylandi:   "rozet-basari",
  tamamlandi:  "rozet-tarafsiz",
  iptal:       "rozet-hata",
};

const DURUM_ETIKET: Record<string, string> = {
  bekliyor:   "Bekliyor",
  onaylandi:  "Onaylandı",
  tamamlandi: "Tamamlandı",
  iptal:      "İptal",
};

interface PanelVeri {
  bugunRandevular: Randevu[];
  bekleyenler: number;
  toplamTamamlanan: number;
  profilYok?: boolean;
}

export default function BerberPanelSayfasi() {
  const [veri, setVeri] = useState<PanelVeri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [guncellenenId, setGuncellenenId] = useState<string | null>(null);

  const panelVerisiniGetir = async () => {
    setYukleniyor(true);
    try {
      const r = await fetch("/api/berber/panel");
      const json = await r.json();
      if (json.basarili) setVeri(json.veri);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { panelVerisiniGetir(); }, []);

  // Randevu durumunu güncelle
  const durumGuncelle = async (randevuId: string, yeniDurum: string) => {
    setGuncellenenId(randevuId);
    try {
      await fetch("/api/berber/panel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ randevuId, durum: yeniDurum }),
      });
      await panelVerisiniGetir();
    } finally {
      setGuncellenenId(null);
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

  // Profil yoksa yönlendir
  if (veri?.profilYok) {
    return (
      <div className="panel-sayfa">
        <div className="konteyner" style={{ textAlign: "center" }}>
          <h2>Berber Profiliniz Yok</h2>
          <p style={{ color: "var(--renk-metin-ince)", margin: "var(--bosluk-4) 0" }}>
            Randevu alabilmek için önce berber profilinizi oluşturun.
          </p>
          <Link href="/berber/profil" className="btn btn-birincil">
            Profil Oluştur
          </Link>
        </div>
      </div>
    );
  }

  const bugun = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long"
  });

  return (
    <div className="panel-sayfa">
      <div className="konteyner">
        
        <div className="panel-ust-baslik">
          <div>
            <h1>Paneliniz</h1>
            <p>{bugun}</p>
          </div>
          <div style={{ display: "flex", gap: "var(--bosluk-3)" }}>
            <Link href="/berber/profil" className="btn btn-ikincil btn-kucuk">
              ✏️ Profili Düzenle
            </Link>
            <Link href="/berber/takvim" className="btn btn-hayalet btn-kucuk">
              📅 Takvim
            </Link>
          </div>
        </div>

        <div className="istatistik-kartlari">
          <div className="istatistik-kart">
            <div className="istatistik-kart-ikon">📅</div>
            <div className="istatistik-kart-sayi">
              {veri?.bugunRandevular.length ?? 0}
            </div>
            <div className="istatistik-kart-etiket">Bekleyen Randevu</div>
          </div>
          <div className="istatistik-kart">
            <div className="istatistik-kart-ikon">⏳</div>
            <div className="istatistik-kart-sayi">{veri?.bekleyenler ?? 0}</div>
            <div className="istatistik-kart-etiket">Bekleyen Randevu</div>
          </div>
          <div className="istatistik-kart">
            <div className="istatistik-kart-ikon">✅</div>
            <div className="istatistik-kart-sayi">{veri?.toplamTamamlanan ?? 0}</div>
            <div className="istatistik-kart-etiket">Toplam Tamamlanan</div>
          </div>
        </div>

        <div className="panel-bolum">
          <div className="panel-bolum-baslik">
            <h2>Randevular</h2>
            <Link href="/berber/takvim" className="btn btn-hayalet btn-kucuk">
              Tüm Takvim →
            </Link>
          </div>

          {!veri?.bugunRandevular.length ? (
            <div className="panel-bos">
              Bugün için randevu bulunmuyor. 🎉
            </div>
          ) : (
            <div className="randevu-listesi">
              {veri.bugunRandevular.map((randevu) => {
                const musteri = randevu.musteri as { ad: string; soyad: string; telefon?: string } | string;
                const musteriAdi = typeof musteri === "string"
                  ? "Müşteri"
                  : `${musteri.ad} ${musteri.soyad}`;

                // Personel bilgisi
                const personel = randevu.personel as { ad: string; soyad: string; renk: string } | string | null | undefined;
                const personelAdi = personel && typeof personel !== "string"
                  ? `${personel.ad} ${personel.soyad}`
                  : null;
                const personelRenk = personel && typeof personel !== "string" ? personel.renk : "#888";

                // Hizmetler — çoklu veya tekil
                const hizmetler = (randevu as { hizmetler?: { ad: string; sure: number; fiyat: number }[] }).hizmetler;
                const hizmetMetni = hizmetler?.length
                  ? hizmetler.map((h) => h.ad).join(" + ")
                  : randevu.hizmet.ad;
                const toplamFiyat = randevu.hizmet.fiyat; // API'de zaten toplam

                return (
                  <div key={randevu._id} className="randevu-satiri">
                    <div className="randevu-satiri-sol">
                      <span className="randevu-saat-badge">
                        {randevu.baslangicSaati}
                      </span>
                      <div>
                        <div className="randevu-musteri-adi" style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-2)", flexWrap: "wrap" }}>
                          <span>{musteriAdi}</span>
                          {personelAdi && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--renk-metin-ince)", fontWeight: 400 }}>
                              <span style={{ color: "var(--renk-metin-soluk)" }}>·</span>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: personelRenk, display: "inline-block" }} />
                              {personelAdi}
                            </span>
                          )}
                        </div>
                        <div className="randevu-hizmet-adi">
                          {hizmetMetni} · {randevu.hizmet.sure} dk · {toplamFiyat} ₺
                        </div>
                      </div>
                    </div>

                    <div className="randevu-satiri-sag">
                      <span className={`rozet ${DURUM_RENK[randevu.durum]}`}>
                        {DURUM_ETIKET[randevu.durum]}
                      </span>

                      {randevu.durum === "bekliyor" && (
                        <div className="durum-btn-grubu">
                          <button
                            className="btn btn-birincil btn-kucuk"
                            onClick={() => durumGuncelle(randevu._id, "onaylandi")}
                            disabled={guncellenenId === randevu._id}
                          >
                            Onayla
                          </button>
                          <button
                            className="btn btn-tehlike btn-kucuk"
                            onClick={() => durumGuncelle(randevu._id, "iptal")}
                            disabled={guncellenenId === randevu._id}
                          >
                            İptal
                          </button>
                        </div>
                      )}
                      {randevu.durum === "onaylandi" && (
                        <button
                          className="btn btn-ikincil btn-kucuk"
                          onClick={() => durumGuncelle(randevu._id, "tamamlandi")}
                          disabled={guncellenenId === randevu._id}
                        >
                          Tamamlandı
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
