import mongoose, { Schema, Document, Model } from "mongoose";

interface GunlikCalisma {
  baslangic: string;
  bitis: string;
  kapali: boolean;
}

export interface PersonelDocument extends Document {
  berberProfil: mongoose.Types.ObjectId;
  ad: string;
  soyad: string;
  telefon?: string;
  renk: string; // Takvimde gösterim rengi (#hex)
  calismaSaatleri: Record<string, GunlikCalisma>;
  aktif: boolean;
  olusturmaTarihi: Date;
}

const varsayilanGun = { baslangic: "09:00", bitis: "21:00", kapali: false };

const PersonelSemasi = new Schema<PersonelDocument>(
  {
    berberProfil: {
      type: Schema.Types.ObjectId,
      ref: "BerberProfil",
      required: true,
    },
    ad: {
      type: String,
      required: [true, "Ad zorunludur"],
      trim: true,
      maxlength: 50,
    },
    soyad: {
      type: String,
      required: [true, "Soyad zorunludur"],
      trim: true,
      maxlength: 50,
    },
    telefon: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    renk: {
      type: String,
      default: "#2D6A4F", // Varsayılan: koyu yeşil
    },
    calismaSaatleri: {
      type: Schema.Types.Mixed,
      default: () => ({
        pazartesi: { ...varsayilanGun },
        sali:      { ...varsayilanGun },
        carsamba:  { ...varsayilanGun },
        persembe:  { ...varsayilanGun },
        cuma:      { ...varsayilanGun },
        cumartesi: { ...varsayilanGun },
        pazar:     { baslangic: "09:00", bitis: "14:00", kapali: true },
      }),
    },
    aktif: { type: Boolean, default: true },
    olusturmaTarihi: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const Personel: Model<PersonelDocument> =
  mongoose.models.Personel ||
  mongoose.model<PersonelDocument>("Personel", PersonelSemasi);

export default Personel;
