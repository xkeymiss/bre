import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import Kullanici from "@/models/Kullanici";
import BerberProfil from "@/models/BerberProfil";
import Personel from "@/models/Personel";
import Randevu from "@/models/Randevu";
import Degerlendirme from "@/models/Degerlendirme";
import BlokeSaat from "@/models/BlokeSaat";
import Sikayet from "@/models/Sikayet";
import { ApiYanit } from "@/types";

export async function GET(): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user || oturum.user.rol !== "admin") {
    return NextResponse.json(
      { basarili: false, hata: "Yetkiniz yok" },
      { status: 403 }
    );
  }

  try {
    await baglan();

    const kullanicilar = await Kullanici.find()
      .select("-sifreHash") // Şifreyi asla gönderme
      .sort({ olusturmaTarihi: -1 })
      .lean();

    // Berber rolündeki kullanıcıların profillerini de getir
    const berberIdler = kullanicilar
      .filter((k) => k.rol === "berber")
      .map((k) => k._id);

    const berberProfiller = await BerberProfil.find({
      kullanici: { $in: berberIdler },
    }).lean();

    // Kullanıcı ID → Berber profil eşleştirme
    const profilMap = new Map(
      berberProfiller.map((p) => [p.kullanici.toString(), p])
    );

    const zenginKullanicilar = kullanicilar.map((k) => ({
      ...k,
      berberProfil: profilMap.get(k._id.toString()) || null,
    }));

    return NextResponse.json({ basarili: true, veri: { kullanicilar: zenginKullanicilar } });
  } catch (hata) {
    console.error("[ADMIN_KULLANICILAR_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

export async function PATCH(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user || oturum.user.rol !== "admin") {
    return NextResponse.json(
      { basarili: false, hata: "Yetkiniz yok" },
      { status: 403 }
    );
  }

  try {
    const { kullaniciId, yeniRol } = await istek.json();
    const gecerliRoller = ["musteri", "berber", "admin"];

    if (!gecerliRoller.includes(yeniRol)) {
      return NextResponse.json(
        { basarili: false, hata: "Geçersiz rol" },
        { status: 400 }
      );
    }

    // Adminin kendi rolünü değiştirmesini engelle
    if (kullaniciId === oturum.user.id) {
      return NextResponse.json(
        { basarili: false, hata: "Kendi rolünüzü değiştiremezsiniz" },
        { status: 400 }
      );
    }

    await baglan();

    const kullanici = await Kullanici.findByIdAndUpdate(
      kullaniciId,
      { rol: yeniRol },
      { new: true, select: "-sifreHash" }
    );

    if (!kullanici) {
      return NextResponse.json(
        { basarili: false, hata: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      basarili: true,
      mesaj: `Rol başarıyla "${yeniRol}" olarak güncellendi`,
      veri: { kullanici },
    });
  } catch (hata) {
    console.error("[ADMIN_ROL_GUNCELLE_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}

export async function PUT(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user || oturum.user.rol !== "admin") {
    return NextResponse.json(
      { basarili: false, hata: "Yetkiniz yok" },
      { status: 403 }
    );
  }

  try {
    const { kullaniciId, ad, soyad, email, telefon, berberProfil } = await istek.json();

    if (!kullaniciId) {
      return NextResponse.json(
        { basarili: false, hata: "Kullanıcı ID gerekli" },
        { status: 400 }
      );
    }

    await baglan();

    // Kullanıcı bilgilerini güncelle
    const guncellenecekAlanlar: Record<string, unknown> = {};
    if (ad !== undefined) guncellenecekAlanlar.ad = ad.trim();
    if (soyad !== undefined) guncellenecekAlanlar.soyad = soyad.trim();
    if (email !== undefined) guncellenecekAlanlar.email = email.trim().toLowerCase();
    if (telefon !== undefined) guncellenecekAlanlar.telefon = telefon.trim() || null;

    const kullanici = await Kullanici.findByIdAndUpdate(
      kullaniciId,
      { $set: guncellenecekAlanlar },
      { new: true, select: "-sifreHash" }
    );

    if (!kullanici) {
      return NextResponse.json(
        { basarili: false, hata: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Berber profili güncelle (varsa)
    if (berberProfil && kullanici.rol === "berber") {
      const profilAlanlar: Record<string, unknown> = {};
      if (berberProfil.dukkanAdi !== undefined) profilAlanlar.dukkanAdi = berberProfil.dukkanAdi;
      if (berberProfil.il !== undefined) profilAlanlar.il = berberProfil.il;
      if (berberProfil.ilce !== undefined) profilAlanlar.ilce = berberProfil.ilce;
      if (berberProfil.adres !== undefined) profilAlanlar.adres = berberProfil.adres;
      if (berberProfil.aciklama !== undefined) profilAlanlar.aciklama = berberProfil.aciklama;
      if (berberProfil.kullaniciAdi !== undefined) profilAlanlar.kullaniciAdi = berberProfil.kullaniciAdi;
      if (berberProfil.haritaEmbedKodu !== undefined) profilAlanlar.haritaEmbedKodu = berberProfil.haritaEmbedKodu;
      if (berberProfil.googleMapsLinki !== undefined) profilAlanlar.googleMapsLinki = berberProfil.googleMapsLinki;
      if (berberProfil.aktif !== undefined) profilAlanlar.aktif = berberProfil.aktif;

      await BerberProfil.findOneAndUpdate(
        { kullanici: kullaniciId },
        { $set: profilAlanlar },
        { new: true }
      );
    }

    return NextResponse.json({
      basarili: true,
      mesaj: "Profil güncellendi",
    });
  } catch (hata) {
    console.error("[ADMIN_PROFIL_GUNCELLE_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}

export async function DELETE(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user || oturum.user.rol !== "admin") {
    return NextResponse.json(
      { basarili: false, hata: "Yetkiniz yok" },
      { status: 403 }
    );
  }

  try {
    const { kullaniciId } = await istek.json();

    if (!kullaniciId) {
      return NextResponse.json(
        { basarili: false, hata: "Kullanıcı ID gerekli" },
        { status: 400 }
      );
    }

    // Adminin kendisini silmesini engelle
    if (kullaniciId === oturum.user.id) {
      return NextResponse.json(
        { basarili: false, hata: "Kendi hesabınızı silemezsiniz" },
        { status: 400 }
      );
    }

    await baglan();

    // Kullanıcının berber profil ID'sini bul (personel/bloke saat temizliği için)
    const berberProfil = await BerberProfil.findOne({ kullanici: kullaniciId });

    // İlişkili tüm verileri sil
    await Promise.all([
      BerberProfil.deleteMany({ kullanici: kullaniciId }),
      berberProfil ? Personel.deleteMany({ berberProfil: berberProfil._id }) : Promise.resolve(),
      berberProfil ? BlokeSaat.deleteMany({ berberProfil: berberProfil._id }) : Promise.resolve(),
      Randevu.deleteMany({ $or: [{ musteri: kullaniciId }, { berber: kullaniciId }] }),
      Degerlendirme.deleteMany({ $or: [{ kullanici: kullaniciId }, { berber: kullaniciId }] }),
      Sikayet.deleteMany({ kullanici: kullaniciId }),
    ]);

    // Son olarak kullanıcıyı sil
    await Kullanici.findByIdAndDelete(kullaniciId);

    return NextResponse.json({
      basarili: true,
      mesaj: "Kullanıcı ve tüm ilişkili veriler silindi",
    });
  } catch (hata) {
    console.error("[ADMIN_KULLANICI_SIL_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Silme işlemi başarısız" },
      { status: 500 }
    );
  }
}
