import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import BerberProfil from "@/models/BerberProfil";
import Personel from "@/models/Personel";
import { ApiYanit } from "@/types";

// Form alanı dönüşümü (acik/acilis/kapanis → kapali/baslangic/bitis)
function calismaSaatleriDonustur(
  cs: Record<string, { acik?: boolean; acilis?: string; kapanis?: string; kapali?: boolean; baslangic?: string; bitis?: string }>
) {
  const sonuc: Record<string, { kapali: boolean; baslangic: string; bitis: string }> = {};
  for (const [gun, d] of Object.entries(cs)) {
    sonuc[gun] = {
      kapali:    d.kapali    !== undefined ? d.kapali : !(d.acik ?? true),
      baslangic: d.baslangic || d.acilis   || "09:00",
      bitis:     d.bitis     || d.kapanis  || "19:00",
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
  if (!profil) {
    return NextResponse.json({ basarili: true, veri: { personel: [] } });
  }

  const personel = await Personel.find({ berberProfil: profil._id, aktif: true })
    .sort({ olusturmaTarihi: 1 })
    .lean();

  return NextResponse.json({ basarili: true, veri: { personel } });
}

export async function POST(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json({ basarili: false, hata: "Yetkiniz yok" }, { status: 403 });
  }

  try {
    const veri = await istek.json();
    await baglan();

    const profil = await BerberProfil.findOne({ kullanici: oturum.user.id });
    if (!profil) {
      return NextResponse.json({ basarili: false, hata: "Profil bulunamadı" }, { status: 404 });
    }

    if (veri.calismaSaatleri) {
      veri.calismaSaatleri = calismaSaatleriDonustur(veri.calismaSaatleri);
    }

    const yeniPersonel = new Personel({
      ...veri,
      berberProfil: profil._id,
    });
    await yeniPersonel.save();

    return NextResponse.json(
      { basarili: true, mesaj: "Personel eklendi", veri: { personel: yeniPersonel } },
      { status: 201 }
    );
  } catch (hata) {
    console.error("[PERSONEL_EKLE]", hata);
    return NextResponse.json({ basarili: false, hata: "Personel eklenemedi" }, { status: 500 });
  }
}
