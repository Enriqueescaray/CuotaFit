import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuotafit",
    short_name: "Cuotafit",
    description: "Administración de gimnasios: socios, cobros y control de acceso.",
    start_url: "/checkin",
    display: "standalone",
    background_color: "#0F1729",
    theme_color: "#2563EB",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
