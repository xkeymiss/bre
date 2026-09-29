import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { baglan } from "@/lib/db";
import Kullanici from "@/models/Kullanici";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // JWT tabanlı oturum yönetimi (veritabanı session kullanmıyoruz)
  session: { strategy: "jwt" },

  // Vercel ve reverse proxy'ler için host güven ayarı (NextAuth v5)
  trustHost: true,

  // Özel sayfa yönlendirmeleri
  pages: {
    signIn: "/giris",
    error: "/giris",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        sifre: { label: "Şifre", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.sifre) {
          return null;
        }

        const db = await baglan();
        // Bağlantının tamamen hazır olduğundan emin ol (cold start koruması)
        if (db.connection.readyState !== 1) {
          await db.connection.asPromise();
        }

        // Kullanıcıyı email ile bul (şifreHash alanını özellikle seç)
        const kullanici = await Kullanici.findOne({
          email: credentials.email,
        }).select("+sifreHash");

        if (!kullanici) return null;

        // Şifreyi doğrula (senkron PBKDF2)
        const sifreGecerli = kullanici.sifreDogrula(
          credentials.sifre as string
        );
        if (!sifreGecerli) return null;

        // NextAuth user nesnesine rol bilgisini ekle
        return {
          id: kullanici._id.toString(),
          name: `${kullanici.ad} ${kullanici.soyad}`,
          email: kullanici.email,
          rol: kullanici.rol,
          image: kullanici.profilFoto || null,
        };
      },
    }),
  ],

  callbacks: {
    // Tüm sayfalara erişime izin ver — koruma API katmanında yapılıyor
    // Bu olmazsa NextAuth /berber/* gibi sayfalara 307 atabilir
    authorized() {
      return true;
    },

    // JWT oluşturulurken rol bilgisini token'a ekle
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol?: string }).rol;
      }
      return token;
    },

    // Session oluşturulurken JWT'den rol bilgisini al
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
      }
      return session;
    },
  },
});
