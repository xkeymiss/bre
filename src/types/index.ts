// TypeScript tip tanımlamaları — Bre projesinin tüm veri modelleri

export type Rol = "musteri" | "berber" | "admin";

export type RandevuDurumu = "bekliyor" | "onaylandi" | "tamamlandi" | "iptal";

export type SikayetHedefTuru = "kullanici" | "yorum";

export interface Kullanici {
  _id: string;
  ad: string;
  soyad: string;
  email: string;
  rol: Rol;
  profilFoto?: string;
  telefon?: string;
  olusturmaTarihi: string;
}

export interface Hizmet {
  _id?: string;
  ad: string;
  sure: number; // dakika cinsinden
  fiyat: number; // TL cinsinden
}

export interface GunlikCalisma {
  baslangic: string; // "09:00" formatında
  bitis: string;     // "18:00" formatında
  kapali: boolean;
}

export interface CalismaSaatleri {
  pazartesi: GunlikCalisma;
  sali: GunlikCalisma;
  carsamba: GunlikCalisma;
  persembe: GunlikCalisma;
  cuma: GunlikCalisma;
  cumartesi: GunlikCalisma;
  pazar: GunlikCalisma;
}

export interface BerberProfil {
  _id: string;
  kullanici: Kullanici | string;
  dukkanAdi: string;
  aciklama?: string;
  il: string;
  ilce: string;
  adres: string;
  kullaniciAdi?: string;
  haritaEmbedKodu?: string;
  googleMapsLinki?: string;
  hizmetler: Hizmet[];
  calismaSaatleri: CalismaSaatleri;
  fotograflar: string[];
  ortalamaPuan: number;
  puanSayisi: number;
  aktif: boolean;
  olusturmaTarihi: string;
}

export interface Randevu {
  _id: string;
  musteri: Kullanici | string;
  berber: BerberProfil | string;
  personel?: { _id: string; ad: string; soyad: string; renk: string } | string | null;
  hizmet: Hizmet;
  hizmetler?: { ad: string; sure: number; fiyat: number }[];
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  durum: RandevuDurumu;
  notlar?: string;
  olusturmaTarihi: string;
}

export interface BlokeSaat {
  _id: string;
  berber: BerberProfil | string;
  baslangic: string; // ISO tarih-saat formatında
  bitis: string;
  sebep?: string;
}

export interface Degerlendirme {
  _id: string;
  musteri: Kullanici | string;
  berber: BerberProfil | string;
  randevu: Randevu | string;
  puan: 1 | 2 | 3 | 4 | 5;
  yorum: string;
  fotograflar: string[];
  tarih: string;
  onaylandi: boolean;
}

export interface Sikayet {
  _id: string;
  bildiren: Kullanici | string;
  hedefId: string;
  hedefTuru: SikayetHedefTuru;
  sebep: string;
  aciklama?: string;
  durum: "bekliyor" | "incelendi" | "cozuldu";
  olusturmaTarihi: string;
}

export interface ApiYanit<T = unknown> {
  basarili: boolean;
  veri?: T;
  mesaj?: string;
  hata?: string;
}

export interface SaatSlotu {
  baslangic: string; // "10:00"
  bitis: string;     // "10:30"
  musait: boolean;
}

export interface TakvimGunu {
  tarih: string; // "YYYY-MM-DD"
  slotlar: SaatSlotu[];
  tumunuKapali: boolean;
}
