import Link from "next/link";
import YildizGosterge from "./YildizGosterge";
import { BerberProfil, Kullanici } from "@/types";

interface BerberKartiProps {
  berber: BerberProfil;
}

export default function BerberKarti({ berber }: BerberKartiProps) {
  // Populate edilmiş kullanıcı bilgisini al
  const kullanici = berber.kullanici as Kullanici;
  const kapakFoto = berber.fotograflar?.[0] || null;

  // İlk 3 hizmeti göster
  const gosterilecekHizmetler = berber.hizmetler.slice(0, 3);
  const fazlaHizmet = berber.hizmetler.length - 3;

  return (
    <Link
      href={`/berberler/${berber.kullaniciAdi || berber._id}`}
      className="berber-karti"
      aria-label={`${berber.dukkanAdi} — ${berber.il}, ${berber.ilce}`}
    >
      
      <div className="berber-karti-foto">
        {kapakFoto ? (
          <img src={kapakFoto} alt={`${berber.dukkanAdi} dükkan fotoğrafı`} />
        ) : (
          <div className="berber-karti-foto-placeholder">✂️</div>
        )}
      </div>

      <div className="berber-karti-icerik">
        
        <h3 className="berber-karti-baslik">{berber.dukkanAdi}</h3>

        <p className="berber-karti-konum">
          <span aria-hidden="true">📍</span>
          {berber.ilce}, {berber.il}
        </p>

        <div className="berber-karti-puan-satiri">
          <div className="berber-karti-puan">
            <YildizGosterge puan={berber.ortalamaPuan} boyut="kucuk" />
            <span className="berber-karti-puan-sayi">
              {berber.ortalamaPuan > 0 ? berber.ortalamaPuan.toFixed(1) : "Yeni"}
            </span>
          </div>
          <span className="berber-karti-yorum-sayi">
            {berber.puanSayisi > 0 ? `${berber.puanSayisi} yorum` : ""}
          </span>
        </div>

        {gosterilecekHizmetler.length > 0 && (
          <div className="berber-karti-hizmetler">
            {gosterilecekHizmetler.map((hizmet, i) => (
              <span key={i} className="berber-hizmet-etiketi">
                {hizmet.ad}
              </span>
            ))}
            {fazlaHizmet > 0 && (
              <span className="berber-hizmet-etiketi">
                +{fazlaHizmet} daha
              </span>
            )}
          </div>
        )}

        {kullanici?.ad && (
          <p style={{ fontSize: "var(--boyut-xs)", color: "var(--renk-metin-soluk)" }}>
            {kullanici.ad} {kullanici.soyad}
          </p>
        )}
      </div>
    </Link>
  );
}
