import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiYanit } from "@/types";

const MAX_BOYUT = 5 * 1024 * 1024; // 5 MB
const IZINLI_TIPLER = ["image/jpeg", "image/png", "image/webp"];

export async function POST(istek: NextRequest): Promise<NextResponse<ApiYanit>> {
  const oturum = await auth();

  if (!oturum?.user) {
    return NextResponse.json(
      { basarili: false, hata: "Giriş yapmanız gerekiyor" },
      { status: 401 }
    );
  }

  try {
    const formData = await istek.formData();
    const dosya = formData.get("dosya") as File | null;

    if (!dosya) {
      return NextResponse.json(
        { basarili: false, hata: "Dosya bulunamadı" },
        { status: 400 }
      );
    }

    // Tip ve boyut kontrolü
    if (!IZINLI_TIPLER.includes(dosya.type)) {
      return NextResponse.json(
        { basarili: false, hata: "Sadece JPG, PNG ve WebP yükleyebilirsiniz" },
        { status: 400 }
      );
    }

    if (dosya.size > MAX_BOYUT) {
      return NextResponse.json(
        { basarili: false, hata: "Dosya boyutu en fazla 5MB olabilir" },
        { status: 400 }
      );
    }

    // Cloudinary'ye yükle
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { basarili: false, hata: "Cloudinary yapılandırılmamış" },
        { status: 500 }
      );
    }

    // Cloudinary imzası oluştur
    const zaman = Math.round(Date.now() / 1000);
    const imzaVeri = `folder=bre&timestamp=${zaman}${apiSecret}`;
    const { createHash } = await import("crypto");
    const imza = createHash("sha1").update(imzaVeri).digest("hex");

    // FormData oluştur
    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", dosya);
    cloudinaryForm.append("api_key", apiKey);
    cloudinaryForm.append("timestamp", String(zaman));
    cloudinaryForm.append("signature", imza);
    cloudinaryForm.append("folder", "bre");

    const yanit = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudinaryForm }
    );

    if (!yanit.ok) {
      return NextResponse.json(
        { basarili: false, hata: "Cloudinary yükleme başarısız" },
        { status: 500 }
      );
    }

    const sonuc = await yanit.json();

    return NextResponse.json({
      basarili: true,
      veri: {
        url: sonuc.secure_url as string,
        publicId: sonuc.public_id as string,
      },
    });
  } catch (hata) {
    console.error("[FOTO_YUKLE_HATASI]", hata);
    return NextResponse.json(
      { basarili: false, hata: "Yükleme başarısız" },
      { status: 500 }
    );
  }
}
