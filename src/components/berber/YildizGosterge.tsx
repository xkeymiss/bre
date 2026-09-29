"use client";

interface YildizGostergeProps {
  puan: number;          // 0-5 arası
  boyut?: "kucuk" | "orta" | "buyuk";
  tiklanabiir?: boolean;
  onPuanSec?: (puan: number) => void;
}

const BOYUT_HARITASI = {
  kucuk: "14px",
  orta:  "18px",
  buyuk: "24px",
};

export default function YildizGosterge({
  puan,
  boyut = "orta",
  tiklanabiir = false,
  onPuanSec,
}: YildizGostergeProps) {
  const fontSize = BOYUT_HARITASI[boyut];

  return (
    <div
      className="yildiz-seti"
      role={tiklanabiir ? "radiogroup" : "img"}
      aria-label={`${puan} üzerinden 5 yıldız`}
      style={{ fontSize }}
    >
      {[1, 2, 3, 4, 5].map((yildizNo) => {
        const doluMu = yildizNo <= Math.round(puan);

        return (
          <span
            key={yildizNo}
            className={`yildiz ${doluMu ? "dolu" : ""} ${tiklanabiir ? "tiklanabiir" : ""}`}
            role={tiklanabiir ? "radio" : undefined}
            aria-checked={tiklanabiir ? doluMu : undefined}
            aria-label={tiklanabiir ? `${yildizNo} yıldız` : undefined}
            onClick={tiklanabiir && onPuanSec ? () => onPuanSec(yildizNo) : undefined}
            tabIndex={tiklanabiir ? 0 : undefined}
            onKeyDown={
              tiklanabiir && onPuanSec
                ? (e) => e.key === "Enter" && onPuanSec(yildizNo)
                : undefined
            }
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
