import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import OturumSarmalayici from "@/components/layout/OturumSarmalayici";

export const metadata: Metadata = {
  title: {
    default: "Bre — Berber & Kuaför Randevu Platformu",
    template: "%s | Bre",
  },
  description:
    "Türkiye'nin en kullanışlı berber randevu platformu. İl ve ilçe bazlı berber arayın, anında randevu alın, fotoğraflı yorumları okuyun.",
  keywords: ["berber", "kuaför", "randevu", "berber randevu", "online randevu"],
};

export default function KokDuzen({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <OturumSarmalayici>
          <Navbar />
          <main>{children}</main>
        </OturumSarmalayici>
      </body>
    </html>
  );
}
