"use client";

/**
 * Navbar Bileşeni
 *
 * Oturum durumuna göre farklı menü öğeleri gösterir:
 * - Giriş yapılmamış: Giriş / Kayıt ol
 * - Müşteri: Berberler / Randevularım / Çıkış
 * - Berber: Pane lim / Takvimim / Çıkış
 * - Admin: Yönetim Paneli / Çıkış
 */

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import "./Navbar.css";

// Rol bazlı menü linkleri
const ROL_MENU_LINKLERI: Record<string, Array<{ etiket: string; href: string }>> = {
  musteri: [
    { etiket: "Berberler", href: "/berberler" },
    { etiket: "Randevularım", href: "/musteri/randevularim" },
  ],
  berber: [
    { etiket: "Panelim", href: "/berber/panel" },
    { etiket: "Takvimim", href: "/berber/takvim" },
  ],
  admin: [
    { etiket: "Yönetim", href: "/admin/panel" },
  ],
};

// Role göre profil linki
const ROL_PROFIL_HREF: Record<string, string> = {
  musteri: "/musteri/profil",
  berber:  "/berber/profil",
  admin:   "/admin/panel",
};

export default function Navbar() {
  const { data: oturum } = useSession();
  const [mobilAcik, setMobilAcik] = useState(false);

  const kullaniciRol = oturum?.user?.rol as string | undefined;
  const menuLinkleri = kullaniciRol ? ROL_MENU_LINKLERI[kullaniciRol] ?? [] : [];

  const mobilMenuToggle = () => setMobilAcik((onceki) => !onceki);

  return (
    <header className="navbar">
      <nav className="konteyner">
        <div className="navbar-ic">
          
          <Link href="/" className="navbar-logo">
            Bre
          </Link>

          <div className="navbar-menu">
            
            {!oturum && (
              <Link href="/berberler" className="navbar-link">
                Berberler
              </Link>
            )}

            {menuLinkleri.map((link) => (
              <Link key={link.href} href={link.href} className="navbar-link">
                {link.etiket}
              </Link>
            ))}

            {oturum ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--bosluk-2)" }}>
                
                <Link
                  href={ROL_PROFIL_HREF[kullaniciRol ?? ""] ?? "/"}
                  title="Profilim"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bosluk-2)",
                    padding: "var(--bosluk-1) var(--bosluk-3)",
                    borderRadius: "var(--yuvarlak-xl)",
                    border: "1px solid var(--renk-krem-sinir)",
                    background: "var(--renk-krem-koyu)",
                    textDecoration: "none",
                    color: "var(--renk-metin-koyu)",
                    fontSize: "var(--boyut-sm)",
                    fontWeight: 600,
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--renk-kahve), var(--renk-kahve-koyu))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "var(--boyut-xs)",
                    flexShrink: 0,
                  }}>
                    {(oturum.user?.name || oturum.user?.email || "?")[0].toUpperCase()}
                  </span>
                  <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {oturum.user?.name?.split(" ")[0] ?? "Profilim"}
                  </span>
                </Link>
                <button
                  className="btn btn-ikincil btn-kucuk"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <>
                <Link href="/giris" className="btn btn-hayalet btn-kucuk">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="btn btn-birincil btn-kucuk">
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          <button
            className="navbar-mobil-menu-btn"
            onClick={mobilMenuToggle}
            aria-label={mobilAcik ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobilAcik}
          >
            {mobilAcik ? (
              // Kapatma ikonu (X)
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            ) : (
              // Hamburger ikonu
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            )}
          </button>
        </div>

        <div className={`navbar-mobil-dropdown ${mobilAcik ? "acik" : ""}`}>
          {!oturum && (
            <Link href="/berberler" className="navbar-mobil-link" onClick={() => setMobilAcik(false)}>
              Berberler
            </Link>
          )}

          {menuLinkleri.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="navbar-mobil-link"
              onClick={() => setMobilAcik(false)}
            >
              {link.etiket}
            </Link>
          ))}

          {oturum ? (
            <>
              <Link
                href={ROL_PROFIL_HREF[kullaniciRol ?? ""] ?? "/"}
                className="navbar-mobil-link"
                onClick={() => setMobilAcik(false)}
              >
                👤 Profilim
              </Link>
              <button
                className="btn btn-ikincil btn-tam"
                style={{ marginTop: "var(--bosluk-2)" }}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/giris" className="btn btn-hayalet btn-tam" onClick={() => setMobilAcik(false)}>
                Giriş Yap
              </Link>
              <Link href="/kayit" className="btn btn-birincil btn-tam" onClick={() => setMobilAcik(false)}>
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
