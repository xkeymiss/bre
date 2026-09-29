import mongoose, { Schema, Document, Model } from "mongoose";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

function sifreHashle(sifre: string): string {
  const tuz = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(sifre, tuz, 100000, 64, "sha512").toString("hex");
  return `${tuz}:${hash}`;
}

function sifreKarsilastir(sifre: string, kayitliHash: string): boolean {
  const [tuz, hash] = kayitliHash.split(":");
  const yeniHash = pbkdf2Sync(sifre, tuz, 100000, 64, "sha512");
  const kayitliBuffer = Buffer.from(hash, "hex");
  return timingSafeEqual(yeniHash, kayitliBuffer);
}

export interface KullaniciDocument extends Document {
  ad: string;
  soyad: string;
  email: string;
  sifreHash: string;
  rol: "musteri" | "berber" | "admin";
  profilFoto?: string;
  telefon?: string;
  olusturmaTarihi: Date;
  sifreDogrula(sifre: string): boolean;
}

const KullaniciSemasi = new Schema<KullaniciDocument>(
  {
    ad: {
      type: String,
      required: [true, "Ad zorunludur"],
      trim: true,
      maxlength: [50, "Ad en fazla 50 karakter olabilir"],
    },
    soyad: {
      type: String,
      required: [true, "Soyad zorunludur"],
      trim: true,
      maxlength: [50, "Soyad en fazla 50 karakter olabilir"],
    },
    email: {
      type: String,
      required: [true, "E-posta zorunludur"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Geçerli bir e-posta adresi giriniz"],
    },
    sifreHash: {
      type: String,
      required: [true, "Şifre zorunludur"],
    },
    rol: {
      type: String,
      enum: {
        values: ["musteri", "berber", "admin"],
        message: "Geçersiz rol: {VALUE}",
      },
      default: "musteri",
    },
    profilFoto: { type: String, default: null },
    telefon: { type: String, trim: true, default: null },
  },
  {
    timestamps: { createdAt: "olusturmaTarihi", updatedAt: "guncellemeTarihi" },
  }
);

KullaniciSemasi.pre("save", function () {
  if (!this.isModified("sifreHash")) {
    return;
  }
  this.sifreHash = sifreHashle(this.sifreHash as string);
});

KullaniciSemasi.methods.sifreDogrula = function (sifre: string): boolean {
  return sifreKarsilastir(sifre, this.sifreHash as string);
};

const Kullanici: Model<KullaniciDocument> =
  mongoose.models.Kullanici ||
  mongoose.model<KullaniciDocument>("Kullanici", KullaniciSemasi);

export default Kullanici;
