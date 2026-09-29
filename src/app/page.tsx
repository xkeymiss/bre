"use client";

/**
 * Ana Sayfa — Berber Arama ve Platform Tanıtımı
 */

import Link from "next/link";
import "./page.css";

export default function AnaSayfa() {
  return (
    <>
      
      <section className="hero konteyner">
        <span className="hero-ust-etiket">✂ Türkiye&apos;nin Berber Platformu</span>

        <h1 className="hero-baslik">
          Yakınındaki en iyi<br />
          <span>berberi bul</span>, anında randevu al
        </h1>

        <p className="hero-aciklama">
          Fotoğraflı yorumları okuyun,
          takvimden boş saati seçin — hepsi saniyeler içinde.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--bosluk-6)" }}>
          <Link href="/berberler" className="btn btn-birincil btn-buyuk" id="arama-butonu">
            Berber Ara
          </Link>
        </div>
      </section>

      <section className="nasil-calisir">
        <div className="konteyner">
          <div className="bolum-baslik" style={{ textAlign: "center" }}>
            <h2>Nasıl Çalışır?</h2>
            <p>Üç adımda randevunuzu alın</p>
          </div>

          <div className="adimlar-listesi">
            <div className="adim-karti">
              <div className="adim-numara">1</div>
              <h3 className="adim-baslik">Berber Ara</h3>
              <p className="adim-aciklama">
                Size en yakın ve en yüksek puanlı
                berberleri anında listeleyin.
              </p>
            </div>

            <div className="adim-karti">
              <div className="adim-numara">2</div>
              <h3 className="adim-baslik">Saat Seç</h3>
              <p className="adim-aciklama">
                Berberin takviminden size uygun boş saati seçin.
                Müsait slotları gerçek zamanlı görün.
              </p>
            </div>

            <div className="adim-karti">
              <div className="adim-numara">3</div>
              <h3 className="adim-baslik">Randevu Al</h3>
              <p className="adim-aciklama">
                Hizmetinizi seçin, randevunuzu onaylayın.
                Sonra yorum yaparak deneyiminizi paylaşın.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "var(--bosluk-10)" }}>
            <Link href="/kayit" className="btn btn-birincil btn-buyuk" id="kayit-baslat-btn">
              Hemen Başla — Ücretsiz
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

