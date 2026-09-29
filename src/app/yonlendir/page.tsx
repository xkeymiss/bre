"use client";

/**
 * /yonlendir — Client Taraflı Yönlendirme Sayfası
 *
 * useSession() ile session'ı okur (client-side çalışır),
 * role göre doğru sayfaya yönlendirir.
 */

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ROL_YONLENDIRME: Record<string, string> = {
  admin:   "/admin/panel",
  berber:  "/berber/panel",
  musteri: "/berberler",
};

function YonlendirIci() {
  const { data: oturum, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/giris");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    const rol = (oturum?.user as { rol?: string })?.rol;
    const hedef = callbackUrl || ROL_YONLENDIRME[rol ?? "musteri"] || "/berberler";

    router.replace(hedef);
  }, [status, oturum, router, searchParams]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "var(--bosluk-4)",
    }}>
      <span className="yukleniyor-dondurme" style={{ width: 40, height: 40 }} />
      <p style={{ color: "var(--renk-metin-ince)" }}>Yönlendiriliyor...</p>
    </div>
  );
}

export default function YonlendirSayfasi() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "var(--bosluk-16)" }}>
        <span className="yukleniyor-dondurme" style={{ width: 40, height: 40 }} />
      </div>
    }>
      <YonlendirIci />
    </Suspense>
  );
}
