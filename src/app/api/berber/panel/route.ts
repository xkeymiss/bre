import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import Randevu from "@/models/Randevu";
import BerberProfil from "@/models/BerberProfil";
import "@/models/Personel"; // populate için şema kaydı
import { ApiYanit } from "@/types";

export async function GET(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json(
      { basarili: false, hata: "Yetkiniz yok" },
      { status: 403 }
    );
  }

  try {
    await baglan();

    const berberProfil = await BerberProfil.findOne({
      kullanici: oturum.user.id,
    });

    if (!berberProfil) {
      return NextResponse.json({
        basarili: true,
        veri: { profilYok: true },
      });
    }

            const tumRandevularIsteniyor = istek.nextUrl.searchParams.get("tumRandevular") === "1";

    // Takvim sayfası tüm randevuları ister
    if (tumRandevularIsteniyor) {
      const personelId = istek.nextUrl.searchParams.get("personelId");
      const filtre: Record<string, unknown> = { berber: berberProfil._id };
      if (personelId && personelId !== "hepsi") {
        filtre.personel = personelId;
      }
      const tumRandevular = await Randevu.find(filtre)
        .populate("musteri", "ad soyad telefon")
        .populate("personel", "ad soyad renk")
        .sort({ tarih: 1, baslangicSaati: 1 })
        .lean();
      return NextResponse.json({ basarili: true, veri: { tumRandevular } });
    }

    // Paralel sorgu: bugünkü + toplam randevular
    const [bugunRandevular, bekleyenler, toplamTamamlanan] = await Promise.all([
      Randevu.find({
        berber: berberProfil._id,
        durum: { $in: ["bekliyor", "onaylandi"] },
      })
        .populate("musteri", "ad soyad telefon")
        .populate("personel", "ad soyad renk")
        .sort({ tarih: 1, baslangicSaati: 1 })
        .lean(),

      Randevu.countDocuments({
        berber: berberProfil._id,
        durum: "bekliyor",
      }),

      Randevu.countDocuments({
        berber: berberProfil._id,
        durum: "tamamlandi",
      }),
    ]);

    return NextResponse.json({
      basarili: true,
      veri: {
        profil: berberProfil,
        bugunRandevular,
        bekleyenler,
        toplamTamamlanan,
      },
    });
  } catch (hata) {
    console.error("[BERBER_PANEL_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

export async function PATCH(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user || oturum.user.rol !== "berber") {
    return NextResponse.json(
      { basarili: false, hata: "Yetkiniz yok" },
      { status: 403 }
    );
  }

  try {
    const { randevuId, durum } = await istek.json();
    const gecerliDurumlar = ["onaylandi", "tamamlandi", "iptal"];

    if (!gecerliDurumlar.includes(durum)) {
      return NextResponse.json(
        { basarili: false, hata: "Geçersiz durum" },
        { status: 400 }
      );
    }

    await baglan();

    // Sadece kendi randevusunu güncelleyebilir
    const berberProfil = await BerberProfil.findOne({ kullanici: oturum.user.id });
    if (!berberProfil) {
      return NextResponse.json({ basarili: false, hata: "Profil bulunamadı" }, { status: 404 });
    }

    const randevu = await Randevu.findOneAndUpdate(
      { _id: randevuId, berber: berberProfil._id },
      { durum },
      { returnDocument: "after" }
    );

    if (!randevu) {
      return NextResponse.json({ basarili: false, hata: "Randevu bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ basarili: true, veri: { randevu } });
  } catch (hata) {
    console.error("[RANDEVU_GUNCELLE_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}
