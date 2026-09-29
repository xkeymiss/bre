import { SaatSlotu, CalismaSaatleri } from "@/types";

function saatiDakikayaCevir(saat: string): number {
  const [saat_, dakika] = saat.split(":").map(Number);
  return saat_ * 60 + dakika;
}

function dakikayiSaateCevir(dakika: number): string {
  const saat = Math.floor(dakika / 60);
  const dk = dakika % 60;
  return `${String(saat).padStart(2, "0")}:${String(dk).padStart(2, "0")}`;
}

function aralikCakisiyor(
  aBaslangic: number,
  aBitis: number,
  bBaslangic: number,
  bBitis: number
): boolean {
  return aBaslangic < bBitis && aBitis > bBaslangic;
}

const GUN_ADLARI: Record<number, keyof CalismaSaatleri> = {
  0: "pazar",
  1: "pazartesi",
  2: "sali",
  3: "carsamba",
  4: "persembe",
  5: "cuma",
  6: "cumartesi",
};

interface ZamanAraligi {
  baslangic: number; // dakika cinsinden
  bitis: number;     // dakika cinsinden
}

/**
 * Belirli bir tarihte berber için müsait saat slotlarını döndürür.
 *
 * @param tarih          - "YYYY-MM-DD" formatında tarih
 * @param hizmetSuresi   - Seçilen hizmetin süresi (dakika)
 * @param calismaSaatleri - Berberin haftalık çalışma saatleri
 * @param mevcutRandevular - O gün mevcut randevuların saat aralıkları
 * @param blokeSaatler   - O gün aktif bloke aralıklar
 * @returns Müsait/dolu saat slotları listesi
 */
export function musaitSlotlariHesapla(
  tarih: string,
  hizmetSuresi: number,
  calismaSaatleri: CalismaSaatleri,
  mevcutRandevular: ZamanAraligi[],
  blokeSaatler: ZamanAraligi[]
): SaatSlotu[] {
    const tarihNesnesi = new Date(tarih + "T00:00:00");
  const gunIndeksi = tarihNesnesi.getDay();
  const gunAdi = GUN_ADLARI[gunIndeksi];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gunBilgisiRaw: any = (calismaSaatleri as any)[gunAdi];

  // Her iki DB formatını destekle: {kapali,baslangic,bitis} veya {acik,acilis,kapanis}
  const gunBilgisi = gunBilgisiRaw ? {
    kapali: gunBilgisiRaw.kapali !== undefined
      ? gunBilgisiRaw.kapali
      : !(gunBilgisiRaw.acik ?? true),
    baslangic: gunBilgisiRaw.baslangic || gunBilgisiRaw.acilis || "09:00",
    bitis:     gunBilgisiRaw.bitis     || gunBilgisiRaw.kapanis || "21:00",
  } : null;

  // Berber o gün kapalıysa veya çalışma saati yoksa boş liste döndür
  if (!gunBilgisi || gunBilgisi.kapali) {
    return [];
  }

    const calismaBaslangic = saatiDakikayaCevir(gunBilgisi.baslangic);
  const calismaBitis = saatiDakikayaCevir(gunBilgisi.bitis);

    const mesgulAraliklar: ZamanAraligi[] = [
    ...mevcutRandevular,
    ...blokeSaatler,
  ];

    const slotlar: SaatSlotu[] = [];
  let slotBaslangic = calismaBaslangic;

  while (slotBaslangic + hizmetSuresi <= calismaBitis) {
    const slotBitis = slotBaslangic + hizmetSuresi;

    // Bu slotun 30 dakikalık başlangıç penceresi meşgul mu?
    // (Tam servis süresi çakışması sunucuda ayrıca kontrol edilir)
    const pencereBitis = slotBaslangic + 30;
    const mesgulMu = mesgulAraliklar.some((aralik) =>
      aralikCakisiyor(slotBaslangic, pencereBitis, aralik.baslangic, aralik.bitis)
    );

    slotlar.push({
      baslangic: dakikayiSaateCevir(slotBaslangic),
      bitis: dakikayiSaateCevir(slotBitis),
      musait: !mesgulMu,
    });

    // Bir sonraki slot 30 dakika sonra başlar
    slotBaslangic += 30;
  }

  return slotlar;
}

/**
 * Randevu POST sırasında sunucu tarafında tam süre çakışması kontrol eder.
 * Görüntüleme algoritmasının 30-dk pencere kontrolünden bağımsız,
 * gerçek hizmet süresiyle çakışmayı doğrular.
 */
export function randevuCakisiyorMu(
  baslangicSaati: string,
  hizmetSuresi: number,
  mevcutRandevular: Array<{ baslangicSaati: string; bitisSaati: string }>
): boolean {
  const yeniBaslangic = saatiDakikayaCevir(baslangicSaati);
  const yeniBitis = yeniBaslangic + hizmetSuresi;
  return mevcutRandevular.some((r) => {
    const rBaslangic = saatiDakikayaCevir(r.baslangicSaati);
    const rBitis = saatiDakikayaCevir(r.bitisSaati);
    return yeniBaslangic < rBitis && yeniBitis > rBaslangic;
  });
}

/**
 * Randevu listesini ZamanAraligi formatına dönüştürür.
 * API'den gelen veriyi hesaplama motoruna uyumlu hale getirir.
 */
export function randevularıDonustur(
  randevular: Array<{ baslangicSaati: string; bitisSaati: string }>
): ZamanAraligi[] {
  return randevular.map((r) => ({
    baslangic: saatiDakikayaCevir(r.baslangicSaati),
    bitis: saatiDakikayaCevir(r.bitisSaati),
  }));
}

/**
 * Bloke saatleri ZamanAraligi formatına dönüştürür.
 * Sadece belirtilen tarihe denk gelen aralıkları filtreler.
 */
export function blokeSaatleriDonustur(
  blokeSaatler: Array<{ baslangic: string; bitis: string }>,
  tarih: string
): ZamanAraligi[] {
  return blokeSaatler
    .filter((bloke) => {
      const blokeBaslangicTarih = new Date(bloke.baslangic)
        .toISOString()
        .split("T")[0];
      return blokeBaslangicTarih === tarih;
    })
    .map((bloke) => {
      const baslangicSaat = new Date(bloke.baslangic)
        .toTimeString()
        .slice(0, 5);
      const bitisSaat = new Date(bloke.bitis).toTimeString().slice(0, 5);
      return {
        baslangic: saatiDakikayaCevir(baslangicSaat),
        bitis: saatiDakikayaCevir(bitisSaat),
      };
    });
}
