import mongoose, { Schema, Document, Model } from "mongoose";

export interface DegerlendirmeDocument extends Document {
  musteri: mongoose.Types.ObjectId;
  berber: mongoose.Types.ObjectId;
  randevu: mongoose.Types.ObjectId;
  puan: 1 | 2 | 3 | 4 | 5;
  yorum: string;
  fotograflar: string[];
  tarih: Date;
  onaylandi: boolean;
  olusturmaTarihi: Date;
}

const DegerlendirmeSemasi = new Schema<DegerlendirmeDocument>(
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
    randevu: {
      type: Schema.Types.ObjectId,
      ref: "Randevu",
      required: true,
      unique: true, // Bir randevuya sadece bir yorum yapılabilir
    },
    puan: {
      type: Number,
      required: [true, "Puan zorunludur"],
      min: [1, "Puan en az 1 olabilir"],
      max: [5, "Puan en fazla 5 olabilir"],
    },
    yorum: {
      type: String,
      required: [true, "Yorum metni zorunludur"],
      trim: true,
      minlength: [10, "Yorum en az 10 karakter olmalıdır"],
      maxlength: [1000, "Yorum en fazla 1000 karakter olabilir"],
    },
    fotograflar: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: "En fazla 5 fotoğraf yüklenebilir",
      },
    },
    tarih: {
      type: Date,
      default: Date.now,
    },
    onaylandi: {
      type: Boolean,
      default: true, // Varsayılan olarak onaylı (admin gerekirse kapatır)
    },
  },
  {
    timestamps: { createdAt: "olusturmaTarihi" },
  }
);

DegerlendirmeSemasi.post("save", async function () {
  const BerberProfil = mongoose.model("BerberProfil");

  // Bu berbere ait onaylanmış tüm puanların ortalamasını hesapla
  const sonuc = await mongoose.model("Degerlendirme").aggregate([
    {
      $match: {
        berber: this.berber,
        onaylandi: true,
      },
    },
    {
      $group: {
        _id: null,
        ortalama: { $avg: "$puan" },
        toplam: { $sum: 1 },
      },
    },
  ]);

  if (sonuc.length > 0) {
    await BerberProfil.findByIdAndUpdate(this.berber, {
      ortalamaPuan: Math.round(sonuc[0].ortalama * 10) / 10,
      puanSayisi: sonuc[0].toplam,
    });
  }
});

DegerlendirmeSemasi.index({ berber: 1, onaylandi: 1, tarih: -1 });

const Degerlendirme: Model<DegerlendirmeDocument> =
  mongoose.models.Degerlendirme ||
  mongoose.model<DegerlendirmeDocument>("Degerlendirme", DegerlendirmeSemasi);

export default Degerlendirme;
