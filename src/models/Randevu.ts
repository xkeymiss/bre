import mongoose, { Schema, Document, Model } from "mongoose";

export interface RandevuDocument extends Document {
  musteri: mongoose.Types.ObjectId;
  berber: mongoose.Types.ObjectId;
  personel?: mongoose.Types.ObjectId;
  hizmet: { ad: string; sure: number; fiyat: number };
  hizmetler: { ad: string; sure: number; fiyat: number }[]; // çoklu hizmet
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  durum: "bekliyor" | "onaylandi" | "tamamlandi" | "iptal";
  notlar?: string;
  olusturmaTarihi: Date;
}

const RandevuSemasi = new Schema<RandevuDocument>(
  {
    musteri: {
      type: Schema.Types.ObjectId,
      ref: "Kullanici",
      required: true,
    },
    berber: {
      type: Schema.Types.ObjectId,
      ref: "BerberProfil",
      required: true,
    },
    personel: {
      type: Schema.Types.ObjectId,
      ref: "Personel",
      default: null,
    },
    hizmet: {
      ad: { type: String, required: true },
      sure: { type: Number, required: true },
      fiyat: { type: Number, required: true },
    },
    hizmetler: {
      type: [{ ad: String, sure: Number, fiyat: Number }],
      default: [],
    },
    tarih: {
      type: String,
      required: [true, "Randevu tarihi zorunludur"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"],
    },
    baslangicSaati: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Saat HH:MM formatında olmalıdır"],
    },
    bitisSaati: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Saat HH:MM formatında olmalıdır"],
    },
    durum: {
      type: String,
      enum: ["bekliyor", "onaylandi", "tamamlandi", "iptal"],
      default: "bekliyor",
    },
    notlar: {
      type: String,
      trim: true,
      maxlength: [300, "Notlar en fazla 300 karakter olabilir"],
    },
  },
  {
    timestamps: { createdAt: "olusturmaTarihi", updatedAt: "guncellemeTarihi" },
  }
);

// Çakışma kontrolü için indeks
RandevuSemasi.index({ berber: 1, tarih: 1, durum: 1 });
RandevuSemasi.index({ musteri: 1, olusturmaTarihi: -1 });

const Randevu: Model<RandevuDocument> =
  mongoose.models.Randevu ||
  mongoose.model<RandevuDocument>("Randevu", RandevuSemasi);

export default Randevu;
