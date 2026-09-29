import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import BerberProfil from "@/models/BerberProfil";
import { ApiYanit } from "@/types";

/**
 * Form'dan gelen {acik, acilis, kapanis} formatını
 * Mongoose şemasının {kapali, baslangic, bitis} formatına çevirir.
 * Her iki format da desteklenir (eski kayıtlar için uyumluluk).
 */
function calismaSaatleriDonustur(
  cs: Record<string, {
    acik?: boolean; acilis?: string; kapanis?: string;
    kapali?: boolean; baslangic?: string; bitis?: string;
  }>
): Record<string, { kapali: boolean; baslangic: string; bitis: string }> {
  const sonuc: Record<string, { kapali: boolean; baslangic: string; bitis: string }> = {};
  for (const [gun, d] of Object.entries(cs)) {
    sonuc[gun] = {
      kapali: d.kapali !== undefined ? d.kapali : !(d.acik ?? true),
      baslangic: d.baslangic || d.acilis || "09:00",
      bitis:     d.bitis    || d.kapanis || "19:00",
    };
  }
  return sonuc;
}

export async function GET(): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json({ basarili: false, hata: "Yetkiniz yok" }, { status: 403 });
  }
  await baglan();
  const profil = await BerberProfil.findOne({ kullanici: oturum.user.id }).lean();
  return NextResponse.json({ basarili: true, veri: { profil } });
}

export async function POST(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json({ basarili: false, hata: "Yetkiniz yok" }, { status: 403 });
  }
  try {
    const veri = await istek.json();
    if (veri.calismaSaatleri) {
      veri.calismaSaatleri = calismaSaatleriDonustur(veri.calismaSaatleri);
    }
    await baglan();

    const mevcutProfil = await BerberProfil.findOne({ kullanici: oturum.user.id });
    if (mevcutProfil) {
      return NextResponse.json({ basarili: false, hata: "Zaten bir profiliniz var" }, { status: 409 });
    }

    const profil = new BerberProfil({ ...veri, kullanici: oturum.user.id });
    await profil.save();
    return NextResponse.json({ basarili: true, mesaj: "Profil oluşturuldu!", veri: { profil } }, { status: 201 });
  } catch (hata) {
    console.error("[BERBER_PROFIL_OLUSTUR]", hata);
    return NextResponse.json({ basarili: false, hata: "Profil oluşturulamadı" }, { status: 500 });
  }
}

export async function PUT(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json({ basarili: false, hata: "Yetkiniz yok" }, { status: 403 });
  }
  try {
    const veri = await istek.json();
    // calismaSaatleri'yi dönüştür (form formatı → DB formatı)
    if (veri.calismaSaatleri) {
      veri.calismaSaatleri = calismaSaatleriDonustur(veri.calismaSaatleri);
    }
    await baglan();

    console.log("[BERBER_PROFIL_GUNCELLE] kullaniciAdi:", veri.kullaniciAdi);
    const profil = await BerberProfil.findOneAndUpdate(
      { kullanici: oturum.user.id },
      { $set: veri },
      { returnDocument: "after", new: true }
    );
    console.log("[BERBER_PROFIL_GUNCELLE] kaydedilen kullaniciAdi:", (profil as { kullaniciAdi?: string } | null)?.kullaniciAdi);
    if (!profil) {
      return NextResponse.json({ basarili: false, hata: "Profil bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ basarili: true, mesaj: "Profil güncellendi", veri: { profil } });
  } catch (hata) {
    console.error("[BERBER_PROFIL_GUNCELLE]", hata);
    return NextResponse.json({ basarili: false, hata: "Güncelleme başarısız" }, { status: 500 });
  }
}
