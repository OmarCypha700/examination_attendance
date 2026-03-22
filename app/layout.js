import "./globals.css";
import { Providers } from "./providers";
import InstallPrompt from "@/components/InstallPrompt";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "ScanOva – Examination Attendance System",
  description: "QR-powered exam attendance tracking",
  manifest: "/manifest.json",
};
<meta name="apple-mobile-web-app-title" content="ScanOva" />;

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
