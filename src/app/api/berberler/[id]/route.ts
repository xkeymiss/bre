import { CalismaSaatleri } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { baglan } from "@/lib/db";
import BerberProfil from "@/models/BerberProfil";
import Personel from "@/models/Personel";
import Randevu from "@/models/Randevu";
import BlokeSaat from "@/models/BlokeSaat";
import { ApiYanit } from "@/types";
import {
  musaitSlotlariHesapla,
  randevularıDonustur,
  blokeSaatleriDonustur,
} from "@/lib/musaitlik";

export async function GET(
  istek: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiYanit>> {
  try {
    const { id } = await params;

    await baglan();

    // Önce kullaniciAdi (slug) ile ara, bulamazsa ObjectId ile dene
    console.log(`[BERBER_DETAY] id param: "${id}"`);
    let berber = await BerberProfil.findOne({ kullaniciAdi: id })
      .populate("kullanici", "ad soyad profilFoto telefon")
      .lean();
    console.log(`[BERBER_DETAY] slug sorgusu sonucu: ${berber ? (berber as { _id: unknown })._id : "bulunamadı"}`);

    if (!berber) {
      // ObjectId formatını kontrol et (24 hex karakter)
      const objectIdMi = /^[a-f0-9]{24}$/i.test(id);
      if (objectIdMi) {
        berber = await BerberProfil.findById(id)
          .populate("kullanici", "ad soyad profilFoto telefon")
          .lean();
        console.log(`[BERBER_DETAY] objectId sorgusu sonucu: ${berber ? "bulundu" : "bulunamadı"}`);
      }
    }

    if (!berber) {
      console.log(`[BERBER_DETAY] Berber bulunamadı: ${id}`);
      return NextResponse.json(
        { basarili: false, hata: "Berber bulunamadı" },
        { status: 404 }
      );
    }

    // Personel sorgusunu berber._id ile yap (id slug olabilir)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const berberId = (berber as any)._id;

    // Personel listesini de getir (berber._id ile sorgula, id slug olabilir)
    const personelListesi = await Personel.find({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      berberProfil: berberId as any,
      aktif: true,
    })
      .sort({ olusturmaTarihi: 1 })
      .lean();

    // Müsaitlik sorgusu varsa işle
    const tarih = istek.nextUrl.searchParams.get("tarih");
    const hizmetSuresiStr = istek.nextUrl.searchParams.get("hizmetSuresi");
    const personelId = istek.nextUrl.searchParams.get("personelId");

    if (tarih && hizmetSuresiStr) {
      const hizmetSuresi = parseInt(hizmetSuresiStr);

      // Personel seçildiyse onun çalışma saatlerini kullan, yoksa dükkanınkini
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let calismaSaatleriKaynagi = (berber as any).calismaSaatleri;
      if (personelId && personelListesi.length > 0) {
        const secilenPersonel = personelListesi.find((p) => p._id.toString() === personelId);
        if (secilenPersonel) {
          calismaSaatleriKaynagi = secilenPersonel.calismaSaatleri;
        }
      }

      // O güne ait randevuları çek — personele göre filtrele
      // berberId = gerçek ObjectId (id slug olabilir)
      const randevuFiltresi: Record<string, unknown> = {
        berber: berberId,   // ← slug değil ObjectId
        tarih,
        durum: { $in: ["bekliyor", "onaylandi"] },
      };
      if (personelId) {
        randevuFiltresi.personel = personelId;
      }

      const randevular = await Randevu.find(randevuFiltresi)
        .select("baslangicSaati bitisSaati")
        .lean();

      // Bloke saatleri
      const blokeBaslangic = new Date(`${tarih}T00:00:00`);
      const blokeBitis = new Date(`${tarih}T23:59:59`);
      const blokeSaatler = await BlokeSaat.find({
        berber: berberId,   // ← slug değil ObjectId
        baslangic: { $lte: blokeBitis },
        bitis: { $gte: blokeBaslangic },
      })
        .select("baslangic bitis")
        .lean();

      const donusturulmusRandevular = randevularıDonustur(
        randevular as Array<{ baslangicSaati: string; bitisSaati: string }>
      );
      const donusturulmusBloke = blokeSaatleriDonustur(
        blokeSaatler as unknown as Array<{ baslangic: string; bitis: string }>,
        tarih
      );

      const slotlar = musaitSlotlariHesapla(
        tarih,
        hizmetSuresi,
        calismaSaatleriKaynagi as unknown as CalismaSaatleri,
        donusturulmusRandevular,
        donusturulmusBloke
      );

      return NextResponse.json({
        basarili: true,
        veri: { berber, personelListesi, slotlar },
      });
    }

    return NextResponse.json({ basarili: true, veri: { berber, personelListesi } });
  } catch (hata) {
    console.error("[BERBER_DETAY_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
