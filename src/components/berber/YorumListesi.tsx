"use client";

/**
 * Yorum Listesi Bileşeni
 *
 * Berberin değerlendirmelerini tarih sırasıyla gösterir.
 * Fotoğraf galerisi, yıldız puanı ve kullanıcı bilgisi içerir.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import YildizGosterge from "./YildizGosterge";
import YorumFormu from "./YorumFormu";

interface Degerlendirme {
  _id: string;
  puan: number;
  yorum: string;
  fotograflar: string[];
  olusturmaTarihi: string;
  musteri: { _id: string; ad: string; soyad: string; profilFoto?: string } | string;
}

interface YorumListesiProps {
  berberId: string;
  ortalamaPuan: number;
  puanSayisi: number;
}

export default function YorumListesi({ berberId, ortalamaPuan, puanSayisi }: YorumListesiProps) {
  const { data: oturum } = useSession();
  const [degerlendirmeler, setDegerlendirmeler] = useState<Degerlendirme[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [seciliFoto, setSeciliFoto] = useState<string | null>(null);

  const degerlendirmeleriGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const r = await fetch(`/api/degerlendirmeler?berberId=${berberId}`);
      const json = await r.json();
      if (json.basarili) setDegerlendirmeler(json.veri.degerlendirmeler);
    } finally {
      setYukleniyor(false);
    }
  }, [berberId]);

  useEffect(() => { degerlendirmeleriGetir(); }, [degerlendirmeleriGetir]);

  // Yorum gönderilince listeyi yenile ve formu kapat
  const yorumBasarili = () => {
    setFormAcik(false);
    degerlendirmeleriGetir();
  };

  const tarihi = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  return (
    <div className="yorum-bolumu">
      
      <div className="yorum-baslik-satiri">
        <h2 className="detay-bolum-baslik" style={{ margin: 0, border: "none", padding: 0 }}>
          Değerlendirmeler
        </h2>
        {puanSayisi > 0 && (
          <div className="yorum-ozet">
            <YildizGosterge puan={ortalamaPuan} boyut="orta" />
            <span className="yorum-ozet-sayi">{ortalamaPuan.toFixed(1)}</span>
            <span style={{ color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-sm)" }}>
              ({puanSayisi} değerlendirme)
            </span>
          </div>
        )}
      </div>

      {oturum && !formAcik && (
        <button
          className="btn btn-ikincil"
          onClick={() => setFormAcik(true)}
          id="yorum-yaz-btn"
          style={{ marginBottom: "var(--bosluk-6)" }}
        >
          ✏️ Değerlendirme Yaz
        </button>
      )}

      {formAcik && (
        <div style={{ marginBottom: "var(--bosluk-6)" }}>
          <YorumFormu berberId={berberId} onBasari={yorumBasarili} />
          <button
            type="button"
            className="btn btn-hayalet"
            onClick={() => setFormAcik(false)}
            style={{ marginTop: "var(--bosluk-2)" }}
          >
            İptal
          </button>
        </div>
      )}

      {yukleniyor && (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-8)" }}>
          <span className="yukleniyor-dondurme" />
        </div>
      )}

      {!yukleniyor && degerlendirmeler.length === 0 && (
        <p style={{ color: "var(--renk-metin-soluk)", fontSize: "var(--boyut-sm)" }}>
          Henüz değerlendirme yok. İlk yorumu sen yap! 🌟
        </p>
      )}

      {!yukleniyor && degerlendirmeler.length > 0 && (
        <div className="yorum-liste">
          {degerlendirmeler.map((d) => {
            const musteri = typeof d.musteri === "string" ? null : d.musteri;
            const isim = musteri ? `${musteri.ad} ${musteri.soyad[0]}.` : "Anonim";

            return (
              <div key={d._id} className="yorum-kart">
                
                <div className="yorum-kart-ust">
                  <div className="yorum-avatar">
                    {musteri?.profilFoto ? (
                      <img src={musteri.profilFoto} alt={isim} />
                    ) : (
                      <span>{isim[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="yorum-kart-isim">{isim}</div>
                    <div style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)" }}>
                      {tarihi(d.olusturmaTarihi)}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <YildizGosterge puan={d.puan} boyut="kucuk" />
                  </div>
                </div>

                {d.yorum && (
                  <p className="yorum-kart-metin">{d.yorum}</p>
                )}

                {d.fotograflar.length > 0 && (
                  <div className="yorum-foto-galeri">
                    {d.fotograflar.map((url, i) => (
                      <button
                        key={i}
                        className="yorum-foto-thumb"
                        onClick={() => setSeciliFoto(url)}
                        aria-label={`Fotoğrafı büyüt ${i + 1}`}
                      >
                        <img src={url} alt={`Yorum görseli ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {seciliFoto && (
        <div
          className="lightbox"
          onClick={() => setSeciliFoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf görüntüleyici"
        >
          <button
            className="lightbox-kapat"
            onClick={() => setSeciliFoto(null)}
            aria-label="Kapat"
          >
            ✕
          </button>
          <img
            src={seciliFoto}
            alt="Büyütülmüş yorum fotoğrafı"
            className="lightbox-foto"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
