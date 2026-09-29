import mongoose, { Schema, Document, Model } from "mongoose";

export interface BlokeSaatDocument extends Document {
  berber: mongoose.Types.ObjectId;
  baslangic: Date;
  bitis: Date;
  sebep?: string;
  olusturmaTarihi: Date;
}

const BlokeSaatSemasi = new Schema<BlokeSaatDocument>(
  {
    berber: {
      type: Schema.Types.ObjectId,
      ref: "BerberProfil",
      required: true,
    },
    baslangic: {
      type: Date,
      required: [true, "Başlangıç tarihi/saati zorunludur"],
    },
    bitis: {
      type: Date,
      required: [true, "Bitiş tarihi/saati zorunludur"],
    },
    sebep: {
      type: String,
      trim: true,
      maxlength: [200, "Sebep en fazla 200 karakter olabilir"],
    },
  },
  {
    timestamps: { createdAt: "olusturmaTarihi" },
  }
);

BlokeSaatSemasi.index({ berber: 1, baslangic: 1, bitis: 1 });

const BlokeSaat: Model<BlokeSaatDocument> =
  mongoose.models.BlokeSaat ||
  mongoose.model<BlokeSaatDocument>("BlokeSaat", BlokeSaatSemasi);

export default BlokeSaat;
