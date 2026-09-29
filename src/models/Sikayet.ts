import mongoose, { Schema, Document, Model } from "mongoose";

export interface SikayetDocument extends Document {
  bildiren: mongoose.Types.ObjectId;
  hedefId: mongoose.Types.ObjectId;
  hedefTuru: "kullanici" | "yorum";
  sebep: string;
  aciklama?: string;
  durum: "bekliyor" | "incelendi" | "cozuldu";
  olusturmaTarihi: Date;
}

const SikayetSemasi = new Schema<SikayetDocument>(
  {
    bildiren: {
      type: Schema.Types.ObjectId,
      ref: "Kullanici",
      required: true,
    },
    hedefId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    hedefTuru: {
      type: String,
      enum: ["kullanici", "yorum"],
      required: true,
    },
    sebep: {
      type: String,
      required: [true, "Şikayet sebebi zorunludur"],
      trim: true,
      maxlength: [200, "Sebep en fazla 200 karakter olabilir"],
    },
    aciklama: {
      type: String,
      trim: true,
      maxlength: [1000, "Açıklama en fazla 1000 karakter olabilir"],
    },
    durum: {
      type: String,
      enum: ["bekliyor", "incelendi", "cozuldu"],
      default: "bekliyor",
    },
  },
  {
    timestamps: { createdAt: "olusturmaTarihi" },
  }
);

SikayetSemasi.index({ durum: 1, olusturmaTarihi: -1 });

const Sikayet: Model<SikayetDocument> =
  mongoose.models.Sikayet ||
  mongoose.model<SikayetDocument>("Sikayet", SikayetSemasi);

export default Sikayet;
