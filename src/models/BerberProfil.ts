import mongoose, { Schema, Document, Model } from "mongoose";

interface HizmetBelge {
  ad: string;
  sure: number;
  fiyat: number;
}

interface GunlikCalismaBelge {
  baslangic: string;
  bitis: string;
  kapali: boolean;
}

interface CalismaSaatleriBelge {
  pazartesi: GunlikCalismaBelge;
  sali: GunlikCalismaBelge;
  carsamba: GunlikCalismaBelge;
  persembe: GunlikCalismaBelge;
  cuma: GunlikCalismaBelge;
  cumartesi: GunlikCalismaBelge;
  pazar: GunlikCalismaBelge;
}

export interface BerberProfilDocument extends Document {
  kullanici: mongoose.Types.ObjectId;
  dukkanAdi: string;
  aciklama?: string;
  il: string;
  ilce: string;
  adres?: string;
  kullaniciAdi?: string;        // URL slug — örn: mehmetberber
  haritaEmbedKodu?: string;
  googleMapsLinki?: string;
  hizmetler: HizmetBelge[];
  calismaSaatleri: CalismaSaatleriBelge;
  fotograflar: string[];
  ortalamaPuan: number;
  puanSayisi: number;
  aktif: boolean;
  olusturmaTarihi: Date;
}

const HizmetSemasi = new Schema<HizmetBelge>({
  ad: { type: String, required: true, trim: true },
  sure: { type: Number, required: true, min: 5, max: 480 }, // dakika
  fiyat: { type: Number, required: true, min: 0 },
});

const varsayilanGun = { baslangic: "09:00", bitis: "21:00", kapali: false };
const varsayilanCalismaSaatleri = {
  pazartesi: varsayilanGun,
  sali: varsayilanGun,
  carsamba: varsayilanGun,
  persembe: varsayilanGun,
  cuma: varsayilanGun,
  cumartesi: varsayilanGun,
  pazar: { baslangic: "09:00", bitis: "14:00", kapali: true },
};

const BerberProfilSemasi = new Schema<BerberProfilDocument>(
  {
    kullanici: {
      type: Schema.Types.ObjectId,
      ref: "Kullanici",
      required: true,
      unique: true, // Bir kullanıcının tek bir berber profili olabilir
    },
    dukkanAdi: {
      type: String,
      required: [true, "Dükkan adı zorunludur"],
      trim: true,
      maxlength: [100, "Dükkan adı en fazla 100 karakter olabilir"],
    },
    aciklama: {
      type: String,
      trim: true,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
    },
    il: {
      type: String,
      required: [true, "İl zorunludur"],
      trim: true,
    },
    ilce: {
      type: String,
      required: [true, "İlçe zorunludur"],
      trim: true,
    },
    adres: {
      type: String,
      trim: true,
    },
    kullaniciAdi: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // null değerler unique kısıtına dahil edilmez
      match: [/^[a-z0-9_]+$/, "Kullanıcı adı sadece küçük harf, rakam ve alt çizgi içerebilir"],
      minlength: [3, "Kullanıcı adı en az 3 karakter olmalıdır"],
      maxlength: [30, "Kullanıcı adı en fazla 30 karakter olabilir"],
    },
    haritaEmbedKodu: {
      type: String,
      trim: true,
    },
    googleMapsLinki: {
      type: String,
      trim: true,
    },
    hizmetler: {
      type: [HizmetSemasi],
      default: [],
    },
    calismaSaatleri: {
      type: Schema.Types.Mixed,
      default: varsayilanCalismaSaatleri,
    },
    fotograflar: {
      type: [String],
      default: [],
    },
    ortalamaPuan: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    puanSayisi: {
      type: Number,
      default: 0,
      min: 0,
    },
    aktif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "olusturmaTarihi", updatedAt: "guncellemeTarihi" },
  }
);

BerberProfilSemasi.index({ il: 1, ilce: 1 });
BerberProfilSemasi.index({ ortalamaPuan: -1 });
BerberProfilSemasi.index({ aktif: 1 });

const BerberProfil: Model<BerberProfilDocument> =
  mongoose.models.BerberProfil ||
  mongoose.model<BerberProfilDocument>("BerberProfil", BerberProfilSemasi);

export default BerberProfil;
