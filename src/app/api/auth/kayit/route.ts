import { NextRequest, NextResponse } from "next/server";
import { baglan } from "@/lib/db";
import Kullanici from "@/models/Kullanici";
import { ApiYanit } from "@/types";

// İstek gövdesi tipi
interface KayitIstegi {
  ad: string;
  soyad: string;
  email: string;
  sifre: string;
  telefon?: string;
}

// Basit giriş doğrulama — Zod kullanmadan okunabilir hata mesajları
function girdiDogrula(veri: KayitIstegi): string | null {
  if (!veri.ad?.trim()) return "Ad zorunludur";
  if (!veri.soyad?.trim()) return "Soyad zorunludur";
  if (!veri.email?.trim()) return "E-posta zorunludur";
  if (!/^\S+@\S+\.\S+$/.test(veri.email)) return "Geçerli bir e-posta giriniz";
  if (!veri.sifre) return "Şifre zorunludur";
  if (veri.sifre.length < 8) return "Şifre en az 8 karakter olmalıdır";
  return null;
}

export async function POST(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  try {
    const veri: KayitIstegi = await istek.json();

    // Giriş doğrulama
    const dogrulamaHatasi = girdiDogrula(veri);
    if (dogrulamaHatasi) {
      return NextResponse.json(
        { basarili: false, hata: dogrulamaHatasi },
        { status: 400 }
      );
    }

    await baglan();

    // E-posta daha önce kullanılmış mı?
    const mevcutKullanici = await Kullanici.findOne({
      email: veri.email.toLowerCase(),
    });
    if (mevcutKullanici) {
      return NextResponse.json(
        { basarili: false, hata: "Bu e-posta adresi zaten kayıtlı" },
        { status: 409 }
      );
    }

    // Yeni kullanıcı oluştur (şifre pre-save hook ile hash'lenir)
    const yeniKullanici = new Kullanici({
      ad: veri.ad.trim(),
      soyad: veri.soyad.trim(),
      email: veri.email.toLowerCase().trim(),
      sifreHash: veri.sifre, // hook otomatik hash'ler
      telefon: veri.telefon?.trim() || null,
      rol: "musteri", // Herkes müşteri olarak başlar
    });
    await yeniKullanici.save();

    return NextResponse.json(
      {
        basarili: true,
        mesaj: "Kayıt başarılı! Giriş yapabilirsiniz.",
        veri: {
          id: yeniKullanici._id.toString(),
          ad: yeniKullanici.ad,
          email: yeniKullanici.email,
        },
      },
      { status: 201 }
    );
  } catch (hata) {
    console.error("[KAYIT_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Sunucu hatası. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
