import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import Degerlendirme from "@/models/Degerlendirme";
import Randevu from "@/models/Randevu";
import BerberProfil from "@/models/BerberProfil";
import { berberIdCoz } from "@/lib/berberIdCoz";
import { ApiYanit } from "@/types";

export async function GET(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const berberId = istek.nextUrl.searchParams.get("berberId");

  if (!berberId) {
    return NextResponse.json(
      { basarili: false, hata: "berberId zorunludur" },
      { status: 400 }
    );
  }

  try {
    await baglan();

    // Slug veya ObjectId çöz
    const gercekBerberId = await berberIdCoz(berberId);
    if (!gercekBerberId) {
      return NextResponse.json({ basarili: false, hata: "Berber bulunamadı" }, { status: 404 });
    }

    const degerlendirmeler = await Degerlendirme.find({ berber: gercekBerberId })
      .populate("musteri", "ad soyad profilFoto")
      .sort({ olusturmaTarihi: -1 })
      .lean();

    return NextResponse.json({ basarili: true, veri: { degerlendirmeler } });
  } catch (hata) {
    console.error("[DEGERLENDIRME_LISTELE]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

export async function POST(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user) {
    return NextResponse.json(
      { basarili: false, hata: "Giriş yapmanız gerekiyor" },
      { status: 401 }
    );
  }

  try {
    const { berberId, puan, yorum, fotograflar } = await istek.json();

    // Temel doğrulama
    if (!berberId || !puan) {
      return NextResponse.json(
        { basarili: false, hata: "Berber ve puan zorunludur" },
        { status: 400 }
      );
    }
    if (puan < 1 || puan > 5) {
      return NextResponse.json(
        { basarili: false, hata: "Puan 1-5 arasında olmalıdır" },
        { status: 400 }
      );
    }

    await baglan();

    // Slug veya ObjectId çöz
    const gercekBerberId = await berberIdCoz(berberId);
    if (!gercekBerberId) {
      return NextResponse.json({ basarili: false, hata: "Berber bulunamadı" }, { status: 404 });
    }

    // Daha önce yorum yapılmış mı kontrol et
    const mevcutYorum = await Degerlendirme.findOne({
      musteri: oturum.user.id,
      berber: gercekBerberId,
    });
    if (mevcutYorum) {
      return NextResponse.json(
        { basarili: false, hata: "Bu berbere zaten yorum yaptınız" },
        { status: 409 }
      );
    }

    // Tamamlanmış randevusu var mı kontrol et
    const tamamlanmisRandevu = await Randevu.findOne({
      musteri: oturum.user.id,
      berber: gercekBerberId,
      durum: "tamamlandi",
    });
    if (!tamamlanmisRandevu) {
      return NextResponse.json(
        { basarili: false, hata: "Yorum yapabilmek için bu berberde tamamlanmış bir randevunuz olmalı" },
        { status: 403 }
      );
    }

    // Değerlendirmeyi kaydet
    const degerlendirme = new Degerlendirme({
      musteri: oturum.user.id,
      berber: gercekBerberId,
      randevu: tamamlanmisRandevu._id,
      puan,
      yorum: yorum?.trim() || "",
      fotograflar: fotograflar || [],
    });
    await degerlendirme.save();

    // Berberin ortalama puanını güncelle
    const tumPuanlar = await Degerlendirme.find({ berber: gercekBerberId }).select("puan");
    const ortalama = tumPuanlar.reduce((t, d) => t + d.puan, 0) / tumPuanlar.length;

    await BerberProfil.findByIdAndUpdate(gercekBerberId, {
      ortalamaPuan: Math.round(ortalama * 10) / 10,
      puanSayisi: tumPuanlar.length,
    });

    return NextResponse.json(
      { basarili: true, mesaj: "Değerlendirmeniz eklendi!", veri: { degerlendirme } },
      { status: 201 }
    );
  } catch (hata) {
    console.error("[DEGERLENDIRME_EKLE]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Yorum eklenemedi" },
      { status: 500 }
    );
  }
}
