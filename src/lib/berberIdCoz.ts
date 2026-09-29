import BerberProfil from "@/models/BerberProfil";
import mongoose from "mongoose";

/**
 * ObjectId string'i veya kullaniciAdi slug'ını alıp gerçek _id'yi döndürür.
 * Bulunamazsa null döner.
 */
export async function berberIdCoz(idVeyaSlug: string): Promise<mongoose.Types.ObjectId | null> {
  // 24 hex karakter → zaten ObjectId
  if (/^[a-f0-9]{24}$/i.test(idVeyaSlug)) {
    return new mongoose.Types.ObjectId(idVeyaSlug);
  }

  // Slug → ObjectId ara
  const profil = await BerberProfil.findOne({ kullaniciAdi: idVeyaSlug })
    .select("_id")
    .lean();

  if (!profil) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (profil as any)._id as mongoose.Types.ObjectId;
}
