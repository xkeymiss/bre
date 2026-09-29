"use client";

/**
 * Yorum Formu Bileşeni
 *
 * Yıldız seçimi, metin girişi ve opsiyonel fotoğraf yükleme.
 * Cloudinary'e yükleme yapıp URL'yi değerlendirme API'sine gönderir.
 */

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import YildizGosterge from "./YildizGosterge";

interface YorumFormuProps {
  berberId: string;
  onBasari: () => void; // Yorum sonrası listeyi yenile
}

export default function YorumFormu({ berberId, onBasari }: YorumFormuProps) {
  const { data: oturum } = useSession();
  const [puan, setPuan] = useState(0);
  const [yorum, setYorum] = useState("");
  const [fotograflar, setFotograflar] = useState<string[]>([]);
  const [fotografYukleniyor, setFotografYukleniyor] = useState(false);
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  // Fotoğraf seçilince Cloudinary'e yükle
  const fotografSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosyalar = Array.from(e.target.files || []);
    if (!dosyalar.length) return;
    if (fotograflar.length + dosyalar.length > 3) {
      setHata("En fazla 3 fotoğraf ekleyebilirsiniz");
      return;
    }

    setFotografYukleniyor(true);
    setHata("");

    try {
      const yuklenenUrller: string[] = [];

      for (const dosya of dosyalar) {
        const form = new FormData();
        form.append("dosya", dosya);

        const yanit = await fetch("/api/yukle", { method: "POST", body: form });
        const json = await yanit.json();

        if (!yanit.ok) {
          setHata(json.hata || "Fotoğraf yüklenemedi");
          return;
        }
        yuklenenUrller.push(json.veri.url);
      }

      setFotograflar((prev) => [...prev, ...yuklenenUrller]);
    } finally {
      setFotografYukleniyor(false);
      // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
      if (dosyaInputRef.current) dosyaInputRef.current.value = "";
    }
  };

  const fotografKaldir = (index: number) => {
    setFotograflar((prev) => prev.filter((_, i) => i !== index));
  };

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (puan === 0) { setHata("Lütfen bir puan verin"); return; }

    setGonderiyor(true);
    setHata("");
    try {
      const yanit = await fetch("/api/degerlendirmeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ berberId, puan, yorum, fotograflar }),
      });
      const json = await yanit.json();

      if (!yanit.ok) {
        setHata(json.hata || "Yorum gönderilemedi");
        return;
      }

      setBasari(true);
      setTimeout(() => onBasari(), 1500);
    } catch {
      setHata("Bağlantı hatası");
    } finally {
      setGonderiyor(false);
    }
  };

  if (!oturum) return null; // Giriş yapmamışsa form gösterme

  if (basari) {
    return (
      <div className="auth-basari-kutusu">
        ✓ Değerlendirmeniz eklendi, teşekkürler!
      </div>
    );
  }

  return (
    <form className="yorum-formu" onSubmit={formuGonder}>
      <h3 className="yorum-formu-baslik">Değerlendirme Yaz</h3>

      <div className="yorum-yildiz-bolumu">
        <label className="form-etiket">Puanınız</label>
        <YildizGosterge
          puan={puan}
          boyut="buyuk"
          tiklanabiir={true}
          onPuanSec={setPuan}
        />
        {puan > 0 && (
          <span style={{ fontSize: "var(--boyut-sm)", color: "var(--renk-metin-ince)" }}>
            {["", "Çok Kötü", "Kötü", "Orta", "İyi", "Mükemmel"][puan]}
          </span>
        )}
      </div>

      <div className="form-grup">
        <label className="form-etiket" htmlFor="yorum-metin">
          Yorumunuz <span style={{ color: "var(--renk-metin-soluk)", fontWeight: 400 }}>(opsiyonel)</span>
        </label>
        <textarea
          id="yorum-metin"
          className="form-girdi"
          placeholder="Deneyiminizi paylaşın..."
          value={yorum}
          onChange={(e) => setYorum(e.target.value)}
          rows={3}
          maxLength={500}
          style={{ resize: "vertical", minHeight: 80 }}
        />
        <span style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)", textAlign: "right" }}>
          {yorum.length}/500
        </span>
      </div>

      <div className="form-grup">
        <label className="form-etiket">
          Fotoğraf <span style={{ color: "var(--renk-metin-soluk)", fontWeight: 400 }}>(en fazla 3)</span>
        </label>

        {/* Yüklenen fotoğraf önizlemeleri */}
        {fotograflar.length > 0 && (
          <div className="yorum-foto-onizleme">
            {fotograflar.map((url, i) => (
              <div key={i} className="yorum-foto-kart">
                <img src={url} alt={`Yorum fotoğrafı ${i + 1}`} />
                <button
                  type="button"
                  className="yorum-foto-kaldir"
                  onClick={() => fotografKaldir(i)}
                  aria-label="Fotoğrafı kaldır"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {fotograflar.length < 3 && (
          <>
            <input
              ref={dosyaInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={fotografSec}
              style={{ display: "none" }}
              id="foto-yukle-input"
            />
            <label
              htmlFor="foto-yukle-input"
              className="btn btn-ikincil"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "var(--bosluk-2)" }}
            >
              {fotografYukleniyor ? (
                <>
                  <span className="yukleniyor-dondurme" style={{ width: 14, height: 14 }} />
                  Yükleniyor...
                </>
              ) : (
                "📷 Fotoğraf Ekle"
              )}
            </label>
          </>
        )}
      </div>

      {hata && (
        <div className="auth-hata-kutusu">⚠ {hata}</div>
      )}

      {/* Gönder */}
      <button
        type="submit"
        className="btn btn-birincil btn-tam"
        disabled={gonderiyor || puan === 0}
        id="yorum-gonder-btn"
      >
        {gonderiyor ? (
          <>
            <span className="yukleniyor-dondurme" style={{ width: 14, height: 14, borderTopColor: "#fff" }} />
            Gönderiliyor...
          </>
        ) : (
          "Değerlendirmeyi Gönder"
        )}
      </button>
    </form>
  );
}
