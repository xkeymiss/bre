"use client";

/**
 * Müşteri — Randevularım Sayfası
 *
 * Kullanıcının tüm randevularını listeler (geçmiş ve gelecek).
 * Her randevu için durum rozeti ve berber linkine yönlendirme.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

interface RandevuKarti {
  _id: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  durum: "bekliyor" | "onaylandi" | "tamamlandi" | "iptal";
  hizmet: { ad: string; sure: number; fiyat: number };
  hizmetler?: { ad: string; sure: number; fiyat: number }[];
  berber: { _id: string; dukkanAdi: string; il: string; ilce: string; kullaniciAdi?: string } | string;
  personel?: { ad: string; soyad: string; renk: string } | string | null;
}

const DURUM_RENK: Record<string, string> = {
  bekliyor:   "rozet-uyari",
  onaylandi:  "rozet-basari",
  tamamlandi: "rozet-tarafsiz",
  iptal:      "rozet-hata",
};

const DURUM_ETIKET: Record<string, string> = {
  bekliyor:   "Bekliyor",
  onaylandi:  "Onaylandı",
  tamamlandi: "Tamamlandı",
  iptal:      "İptal Edildi",
};

export default function RandevularimSayfasi() {
  const [randevular, setRandevular] = useState<RandevuKarti[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    fetch("/api/randevular")
      .then((r) => r.json())
      .then((json) => {
        if (json.basarili) setRandevular(json.veri.randevular);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  if (yukleniyor) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-16)" }}>
        <span className="yukleniyor-dondurme" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--bosluk-8) 0 var(--bosluk-16)" }}>
      <div className="konteyner">
        <div style={{ marginBottom: "var(--bosluk-8)" }}>
          <h1>Randevularım</h1>
          <p style={{ color: "var(--renk-metin-ince)", marginTop: "var(--bosluk-2)" }}>
            Tüm randevu geçmişiniz
          </p>
        </div>

        {randevular.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--bosluk-16)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "var(--bosluk-4)" }}>📅</div>
            <h3 style={{ marginBottom: "var(--bosluk-2)" }}>Henüz Randevunuz Yok</h3>
            <p style={{ color: "var(--renk-metin-ince)", marginBottom: "var(--bosluk-6)" }}>
              Yakınızdaki berberleri keşfedin ve ilk randevunuzu alın.
            </p>
            <Link href="/berberler" className="btn btn-birincil">
              Berberlere Gözat
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--bosluk-4)" }}>
            {randevular.map((randevu) => {
              const berber = typeof randevu.berber === "string"
                ? null
                : randevu.berber;

              return (
                <div
                  key={randevu._id}
                  style={{
                    background: "var(--renk-beyaz)",
                    border: "1px solid var(--renk-krem-sinir)",
                    borderRadius: "var(--yuvarlak-xl)",
                    padding: "var(--bosluk-5) var(--bosluk-6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "var(--bosluk-4)",
                    boxShadow: "var(--golge-sm)",
                  }}
                >
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-4)" }}>
                    <div style={{
                      background: "var(--renk-krem-koyu)",
                      borderRadius: "var(--yuvarlak-lg)",
                      padding: "var(--bosluk-3) var(--bosluk-4)",
                      textAlign: "center",
                      minWidth: 64,
                    }}>
                      <div style={{ fontFamily: "var(--font-baslik)", fontWeight: 700, fontSize: "var(--boyut-xl)", color: "var(--renk-kahve)" }}>
                        {randevu.tarih.split("-")[2]}
                      </div>
                      <div style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-ince)" }}>
                        {["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][parseInt(randevu.tarih.split("-")[1]) - 1]}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: "var(--boyut-md)" }}>
                        
                        {randevu.hizmetler?.length
                          ? randevu.hizmetler.map((h) => h.ad).join(" + ")
                          : randevu.hizmet.ad}
                      </div>
                      {berber && (
                        <div style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)", marginTop: 2 }}>
                          {berber.dukkanAdi} · {berber.il}
                        </div>
                      )}
                      <div style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-soluk)", marginTop: 2 }}>
                        🕐 {randevu.baslangicSaati} · {randevu.hizmet.sure} dk · {randevu.hizmet.fiyat} ₺
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-3)" }}>
                    <span className={`rozet ${DURUM_RENK[randevu.durum]}`}>
                      {DURUM_ETIKET[randevu.durum]}
                    </span>
                    {berber && (
                      <Link
                        href={`/berberler/${berber.kullaniciAdi || berber._id}`}
                        className="btn btn-hayalet btn-kucuk"
                      >
                        Berbere Git →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
