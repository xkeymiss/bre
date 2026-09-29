import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Cloudinary profil fotoğrafları & yorum görselleri
      },
    ],
  },
};

export default nextConfig;
