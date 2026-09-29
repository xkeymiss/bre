import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { baglan } from "@/lib/db";
import Randevu from "@/models/Randevu";
import BerberProfil from "@/models/BerberProfil";
import BlokeSaat from "@/models/BlokeSaat";
import "@/models/Personel"; // populate için şema kaydı
import { berberIdCoz } from "@/lib/berberIdCoz";
import { ApiYanit } from "@/types";
import { musaitSlotlariHesapla, randevularıDonustur, blokeSaatleriDonustur, randevuCakisiyorMu } from "@/lib/musaitlik";

export async function POST(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user) {
    return NextResponse.json(
      { basarili: false, hata: "Giriş yapmanız gerekiyor" },
      { status: 401 }
    );
  }

  try {
    // hizmetIds (array) veya geriye dönük uyumluluk için hizmetId (tekil) kabul et
    const { berberId, hizmetId, hizmetIds, tarih, baslangicSaati, personelId } = await istek.json();
    const seciliHizmetIds: string[] = hizmetIds?.length ? hizmetIds : hizmetId ? [hizmetId] : [];

    if (!berberId || !seciliHizmetIds.length || !tarih || !baslangicSaati) {
      return NextResponse.json(
        { basarili: false, hata: "Eksik bilgi gönderildi" },
        { status: 400 }
      );
    }

    await baglan();

    // Slug veya ObjectId çöz
    const gercekBerberId = await berberIdCoz(berberId);
    if (!gercekBerberId) {
      return NextResponse.json({ basarili: false, hata: "Berber bulunamadı" }, { status: 404 });
    }

    // Berberi ve seçilen hizmeti bul
    const berber = await BerberProfil.findById(gercekBerberId);
    if (!berber || !berber.aktif) {
      return NextResponse.json(
        { basarili: false, hata: "Berber bulunamadı" },
        { status: 404 }
      );
    }

    // Seçilen hizmetleri bul ve toplam süreyi hesapla
    const seciliHizmetler = seciliHizmetIds.map((hid) => {
      const h = berber.hizmetler.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h) => (h as any)._id?.toString() === hid
      );
      return h;
    }).filter(Boolean) as Array<{ ad: string; sure: number; fiyat: number }>;

    if (!seciliHizmetler.length) {
      return NextResponse.json(
        { basarili: false, hata: "Hizmet bulunamadı" },
        { status: 404 }
      );
    }

    // Toplam süre = tüm seçili hizmetlerin süresi
    const toplamSure = seciliHizmetler.reduce((sum, h) => sum + h.sure, 0);
    const anaHizmet = seciliHizmetler[0]; // primary hizmet (eski alan uyumluluğu)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let calismaSaatleriKaynagi: any = berber.calismaSaatleri;
    if (personelId) {
      const Personel = (await import("@/models/Personel")).default;
      const personel = await Personel.findById(personelId);
      if (personel) calismaSaatleriKaynagi = personel.calismaSaatleri;
    }

    // Müsaitliği tekrar doğrula (yarış koşulu önlemi)
    const randevuFiltresi: Record<string, unknown> = {
      berber: gercekBerberId,   // ← ObjectId
      tarih,
      durum: { $in: ["bekliyor", "onaylandi"] },
    };
    if (personelId) randevuFiltresi.personel = personelId;

    const mevcutRandevular = await Randevu.find(randevuFiltresi)
      .select("baslangicSaati bitisSaati").lean();

    const blokeSaatler = await BlokeSaat.find({
      berber: gercekBerberId,   // ← ObjectId
      baslangic: { $lte: new Date(`${tarih}T23:59:59`) },
      bitis: { $gte: new Date(`${tarih}T00:00:00`) },
    }).select("baslangic bitis").lean();

    const slotlar = musaitSlotlariHesapla(
      tarih,
      toplamSure,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      calismaSaatleriKaynagi as any,
      randevularıDonustur(mevcutRandevular as Array<{ baslangicSaati: string; bitisSaati: string }>),
      blokeSaatleriDonustur(blokeSaatler as unknown as Array<{ baslangic: string; bitis: string }>, tarih)
    );

    const secilenSlot = slotlar.find((s) => s.baslangic === baslangicSaati);
    if (!secilenSlot || !secilenSlot.musait) {
      return NextResponse.json(
        { basarili: false, hata: "Seçilen saat artık müsait değil. Lütfen başka bir saat seçin." },
        { status: 409 }
      );
    }

    // Sunucu tarafı tam süre çakışma kontrolü (görüntüleme algoritmasından bağımsız)
    if (randevuCakisiyorMu(
      baslangicSaati,
      toplamSure,
      mevcutRandevular as Array<{ baslangicSaati: string; bitisSaati: string }>
    )) {
      return NextResponse.json(
        { basarili: false, hata: "Seçilen saat başka bir randevuyla çakışıyor. Lütfen başka bir saat seçin." },
        { status: 409 }
      );
    }

    // Randevuyu oluştur
    const randevu = new Randevu({
      musteri: oturum.user.id,
      berber: gercekBerberId,   // ← ObjectId
      personel: personelId || null,
      hizmet: {
        ad: anaHizmet.ad,
        sure: toplamSure, // toplam süre
        fiyat: seciliHizmetler.reduce((sum, h) => sum + h.fiyat, 0),
      },
      hizmetler: seciliHizmetler.map((h) => ({ ad: h.ad, sure: h.sure, fiyat: h.fiyat })),
      tarih,
      baslangicSaati,
      bitisSaati: secilenSlot.bitis,
      durum: "bekliyor",
    });

    await randevu.save();

    return NextResponse.json(
      {
        basarili: true,
        mesaj: "Randevunuz başarıyla oluşturuldu!",
        veri: { randevuId: randevu._id.toString() },
      },
      { status: 201 }
    );
  } catch (hata) {
    console.error("[RANDEVU_OLUSTUR_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Randevu oluşturulamadı" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user) {
    return NextResponse.json(
      { basarili: false, hata: "Giriş yapmanız gerekiyor" },
      { status: 401 }
    );
  }

  try {
    await baglan();

    // Role göre farklı sorgula
    const sorgu =
      oturum.user.rol === "berber"
        ? { berber: oturum.user.id }   // Berber kendi randevularını görür
        : { musteri: oturum.user.id };  // Müşteri kendi randevularını görür

    const randevular = await Randevu.find(sorgu)
      .populate("musteri", "ad soyad telefon")
      .populate("berber", "dukkanAdi il ilce kullaniciAdi")
      .populate("personel", "ad soyad renk")
      .sort({ tarih: -1, baslangicSaati: -1 })
      .lean();

    return NextResponse.json({ basarili: true, veri: { randevular } });
  } catch (hata) {
    console.error("[RANDEVULAR_LISTELE_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Randevular yüklenemedi" },
      { status: 500 }
    );
  }
}
