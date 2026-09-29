import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import BerberProfil from "@/models/BerberProfil";
import Personel from "@/models/Personel";
import { ApiYanit } from "@/types";

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

export async function PUT(
  istek: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json({ basarili: false, hata: "Yetkiniz yok" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const veri = await istek.json();
    await baglan();

    // Sahipliği doğrula
    const profil = await BerberProfil.findOne({ kullanici: oturum.user.id });
    if (!profil) {
      return NextResponse.json({ basarili: false, hata: "Profil bulunamadı" }, { status: 404 });
    }

    if (veri.calismaSaatleri) {
      veri.calismaSaatleri = calismaSaatleriDonustur(veri.calismaSaatleri);
    }

    const personel = await Personel.findOneAndUpdate(
      { _id: id, berberProfil: profil._id },
      { $set: veri },
      { returnDocument: "after" }
    );

    if (!personel) {
      return NextResponse.json({ basarili: false, hata: "Personel bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ basarili: true, mesaj: "Personel güncellendi", veri: { personel } });
  } catch (hata) {
    console.error("[PERSONEL_GUNCELLE]", hata);
    return NextResponse.json({ basarili: false, hata: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(
  _istek: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json({ basarili: false, hata: "Yetkiniz yok" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await baglan();

    const profil = await BerberProfil.findOne({ kullanici: oturum.user.id });
    if (!profil) {
      return NextResponse.json({ basarili: false, hata: "Profil bulunamadı" }, { status: 404 });
    }

    await Personel.findOneAndUpdate(
      { _id: id, berberProfil: profil._id },
      { aktif: false }
    );

    return NextResponse.json({ basarili: true, mesaj: "Personel kaldırıldı" });
  } catch (hata) {
    console.error("[PERSONEL_SIL]", hata);
    return NextResponse.json({ basarili: false, hata: "Silme başarısız" }, { status: 500 });
  }
}
