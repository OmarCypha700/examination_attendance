import "./globals.css";
import { Providers } from "./providers";
import InstallPrompt from "@/components/InstallPrompt";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "ScanOva – Attendance System",
  description: "QR code powered examination attendance tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScanOva",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PWARegister />
        <InstallPrompt />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
