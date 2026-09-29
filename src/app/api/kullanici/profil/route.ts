import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import Kullanici from "@/models/Kullanici";
import { ApiYanit } from "@/types";
import { pbkdf2Sync, randomBytes } from "crypto";

export async function GET(): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user) {
    return NextResponse.json({ basarili: false, hata: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  try {
    await baglan();
    const kullanici = await Kullanici.findById(oturum.user.id)
      .select("ad soyad email telefon profilFoto rol olusturmaTarihi")
      .lean();

    if (!kullanici) {
      return NextResponse.json({ basarili: false, hata: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ basarili: true, veri: { kullanici } });
  } catch (hata) {
    console.error("[KULLANICI_PROFIL_GET]", hata);
    return NextResponse.json({ basarili: false, hata: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();
  if (!oturum?.user) {
    return NextResponse.json({ basarili: false, hata: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  try {
    const { ad, soyad, telefon, profilFoto, mevcutSifre, yeniSifre } = await istek.json();

    await baglan();
    const kullanici = await Kullanici.findById(oturum.user.id);
    if (!kullanici) {
      return NextResponse.json({ basarili: false, hata: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Temel bilgi güncellemesi
    if (ad?.trim())       kullanici.ad       = ad.trim();
    if (soyad?.trim())    kullanici.soyad    = soyad.trim();
    if (telefon !== undefined) kullanici.telefon = telefon?.trim() || undefined;
    if (profilFoto !== undefined) kullanici.profilFoto = profilFoto || undefined;

    // Şifre değişikliği
    if (yeniSifre) {
      if (!mevcutSifre) {
        return NextResponse.json({ basarili: false, hata: "Mevcut şifre gereklidir" }, { status: 400 });
      }
      const dogru = kullanici.sifreDogrula(mevcutSifre);
      if (!dogru) {
        return NextResponse.json({ basarili: false, hata: "Mevcut şifre hatalı" }, { status: 400 });
      }
      if (yeniSifre.length < 6) {
        return NextResponse.json({ basarili: false, hata: "Yeni şifre en az 6 karakter olmalıdır" }, { status: 400 });
      }
      // Yeni şifre hash'le
      const tuz = randomBytes(16).toString("hex");
      const hash = pbkdf2Sync(yeniSifre, tuz, 100000, 64, "sha512").toString("hex");
      kullanici.sifreHash = `${tuz}:${hash}`;
    }

    await kullanici.save();

    return NextResponse.json({
      basarili: true,
      mesaj: "Profil başarıyla güncellendi",
      veri: {
        kullanici: {
          ad: kullanici.ad,
          soyad: kullanici.soyad,
          email: kullanici.email,
          telefon: kullanici.telefon,
        },
      },
    });
  } catch (hata) {
    console.error("[KULLANICI_PROFIL_PUT]", hata);
    return NextResponse.json({ basarili: false, hata: "Sunucu hatası" }, { status: 500 });
  }
}
