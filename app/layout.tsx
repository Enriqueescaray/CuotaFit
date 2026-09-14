import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { GymProvider } from "@/lib/store";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cuotafit",
  description: "Cuotafit — administración de gimnasios: socios, cobros y control de acceso.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <GymProvider>{children}</GymProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
