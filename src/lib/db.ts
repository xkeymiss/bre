import mongoose from "mongoose";

// Bağlantı dizesi ortam değişkeninden okunur
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    ".env.local dosyasında MONGODB_URI tanımlanmamış. Lütfen kontrol edin."
  );
}

// Global cache tipi — TypeScript için genişletilmiş global namespace
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global nesneye cache ekliyoruz (Next.js hot-reload'da sıfırlanmaz)
declare global {
    var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cache;
}

/**
 * Veritabanı bağlantısı kurar veya mevcut bağlantıyı döndürür.
 * Her API route'u bu fonksiyonu çağırır.
 */
export async function baglan(): Promise<typeof mongoose> {
  // Zaten bağlıysa mevcut bağlantıyı döndür
  if (cache.conn) {
    return cache.conn;
  }

  // Bağlantı promise'i yoksa oluştur
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI);
  }

  // Promise tamamlanana kadar bekle ve cache'e kaydet
  cache.conn = await cache.promise;
  return cache.conn;
}
