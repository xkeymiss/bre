import { NextRequest, NextResponse } from "next/server";
import { baglan } from "@/lib/db";
import BerberProfil from "@/models/BerberProfil";
import { ApiYanit } from "@/types";

const SAYFA_BOYUTU = 12;

export async function GET(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  try {
    const { searchParams } = istek.nextUrl;
    const il = searchParams.get("il")?.trim();
    const ilce = searchParams.get("ilce")?.trim();
    const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1"));

    await baglan();

    // Filtre nesnesini dinamik olarak oluştur
    const filtre: Record<string, unknown> = { aktif: true };
    if (il) filtre.il = { $regex: il, $options: "i" };
    if (ilce) filtre.ilce = { $regex: ilce, $options: "i" };

    // Toplam kayıt sayısı ve sayfalı liste paralel çek
    const [toplam, berberler] = await Promise.all([
      BerberProfil.countDocuments(filtre),
      BerberProfil.find(filtre)
        .populate("kullanici", "ad soyad profilFoto") // Kullanıcı bilgilerini birleştir
        .sort({ ortalamaPuan: -1, puanSayisi: -1 })   // En yüksek puanlı önce
        .skip((sayfa - 1) * SAYFA_BOYUTU)
        .limit(SAYFA_BOYUTU)
        .select("-calismaSaatleri") // Liste görünümünde gerekmez
        .lean(),                    // Plain JS objesi döndür (performans)
    ]);

    return NextResponse.json({
      basarili: true,
      veri: {
        berberler,
        sayfalama: {
          toplam,
          mevcutSayfa: sayfa,
          toplamSayfa: Math.ceil(toplam / SAYFA_BOYUTU),
          sayfaBoyutu: SAYFA_BOYUTU,
        },
      },
    });
  } catch (hata) {
    console.error("[BERBERLER_LISTELE_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Berberler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
