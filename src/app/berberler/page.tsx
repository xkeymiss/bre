"use client";

/**
 * Berberler Listeleme Sayfası
 *
 * URL parametrelerinden il/ilçe filtresi okur.
 * Arama formu URL'i güncelleyerek yeni sorgu yapar.
 * Sayfalama destekli.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import BerberKarti from "@/components/berber/BerberKarti";
import { BerberProfil } from "@/types";
import "./berberler.css";

const ILLER = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya",
  "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik",
  "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
  "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
  "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis",
  "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
  "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye",
  "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas",
  "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

interface BerberlerYanit {
  berberler: BerberProfil[];
  sayfalama: {
    toplam: number;
    mevcutSayfa: number;
    toplamSayfa: number;
  };
}

function BerberlerIcerik() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL'den başlangıç değerleri
  const [il, setIl] = useState(searchParams.get("il") || "");
  const [ilce, setIlce] = useState(searchParams.get("ilce") || "");
  const [sayfa, setSayfa] = useState(
    parseInt(searchParams.get("sayfa") || "1")
  );

  const [veri, setVeri] = useState<BerberlerYanit | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  // Berberleri API'den çek
  const berberleriGetir = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const params = new URLSearchParams();
      if (il) params.set("il", il);
      if (ilce) params.set("ilce", ilce);
      params.set("sayfa", String(sayfa));

      const yanit = await fetch(`/api/berberler?${params}`);
      const json = await yanit.json();

      if (!json.basarili) throw new Error(json.hata);
      setVeri(json.veri);
    } catch {
      setHata("Berberler yüklenirken bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }, [il, ilce, sayfa]);

  useEffect(() => {
    berberleriGetir();
  }, [berberleriGetir]);

  // Arama yapıldığında URL'i güncelle ve sayfa 1'e dön
  const aramaYap = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (il) params.set("il", il);
    if (ilce) params.set("ilce", ilce);
    params.set("sayfa", "1");
    setSayfa(1);
    router.push(`/berberler?${params}`);
  };

  const sayfaDegistir = (yeniSayfa: number) => {
    setSayfa(yeniSayfa);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="berberler-sayfa">
      <div className="konteyner">
        
        <div className="berberler-baslik-bolumu">
          <h1>Berberler</h1>
          <p style={{ color: "var(--renk-metin-ince)", marginTop: "var(--bosluk-2)" }}>
            İl ve ilçeye göre filtreleyin, size en yakın berberi bulun
          </p>
        </div>

        <form className="filtre-cubugu" onSubmit={aramaYap}>
          <div className="form-grup">
            <label className="form-etiket" htmlFor="filtre-il">İl</label>
            <select
              id="filtre-il"
              className="form-girdi"
              value={il}
              onChange={(e) => setIl(e.target.value)}
            >
              <option value="">Tüm İller</option>
              {ILLER.map((ilAdi) => (
                <option key={ilAdi} value={ilAdi}>{ilAdi}</option>
              ))}
            </select>
          </div>

          <div className="form-grup">
            <label className="form-etiket" htmlFor="filtre-ilce">İlçe</label>
            <input
              id="filtre-ilce"
              type="text"
              className="form-girdi"
              placeholder="İlçe ara..."
              value={ilce}
              onChange={(e) => setIlce(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-birincil"
            id="filtre-ara-btn"
            style={{ alignSelf: "flex-end" }}
          >
            Ara
          </button>

          {(il || ilce) && (
            <button
              type="button"
              className="btn btn-hayalet"
              onClick={() => { setIl(""); setIlce(""); router.push("/berberler"); }}
              style={{ alignSelf: "flex-end" }}
            >
              Temizle
            </button>
          )}
        </form>

        {!yukleniyor && veri && (
          <p className="sonuc-bilgisi">
            <strong>{veri.sayfalama.toplam}</strong> berber bulundu
            {il && ` — ${il}`}{ilce && `, ${ilce}`}
          </p>
        )}

        {yukleniyor && (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-16)" }}>
            <span className="yukleniyor-dondurme" style={{ width: 36, height: 36 }} />
          </div>
        )}

        {hata && !yukleniyor && (
          <div className="auth-hata-kutusu" style={{ maxWidth: 480, margin: "0 auto" }}>
            ⚠ {hata}
          </div>
        )}

        {!yukleniyor && !hata && veri?.berberler.length === 0 && (
          <div className="bos-durum">
            <div className="bos-durum-ikon">✂️</div>
            <h3>Berber Bulunamadı</h3>
            <p style={{ color: "var(--renk-metin-ince)" }}>
              {il || ilce
                ? "Bu bölgede kayıtlı berber bulunmuyor. Farklı bir bölge deneyin."
                : "Henüz kayıtlı berber bulunmuyor."}
            </p>
          </div>
        )}

        {!yukleniyor && veri && veri.berberler.length > 0 && (
          <>
            <div className="izgara izgara-2 izgara-3">
              {veri.berberler.map((berber) => (
                <BerberKarti key={berber._id} berber={berber} />
              ))}
            </div>

            {veri.sayfalama.toplamSayfa > 1 && (
              <div className="sayfalama">
                <button
                  className="sayfalama-btn"
                  onClick={() => sayfaDegistir(sayfa - 1)}
                  disabled={sayfa === 1}
                  aria-label="Önceki sayfa"
                >
                  ‹
                </button>

                {Array.from({ length: veri.sayfalama.toplamSayfa }, (_, i) => i + 1).map((s) => (
                  <button
                    key={s}
                    className={`sayfalama-btn ${s === sayfa ? "aktif" : ""}`}
                    onClick={() => sayfaDegistir(s)}
                    aria-label={`Sayfa ${s}`}
                    aria-current={s === sayfa ? "page" : undefined}
                  >
                    {s}
                  </button>
                ))}

                <button
                  className="sayfalama-btn"
                  onClick={() => sayfaDegistir(sayfa + 1)}
                  disabled={sayfa === veri.sayfalama.toplamSayfa}
                  aria-label="Sonraki sayfa"
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BerberlerSayfasi() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--bosluk-16)" }}>
        <span className="yukleniyor-dondurme" style={{ width: 36, height: 36 }} />
      </div>
    }>
      <BerberlerIcerik />
    </Suspense>
  );
}
