import { Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "../public/template/css/sb-admin-2.min.css";
import "../public/template/css/fontawesome-free/css/all.min.css";
import { AuthProvider } from "./context/AuthContext";

const nunito = Nunito({ subsets: ['latin'] });

export const metadata = {
  title: "FIPP21 - Jogo 21 Multiplayer",
  description: "Plataforma de jogo 21 multiplayer criada para a disciplina de PFS2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={nunito.className}>
        <AuthProvider>
          {children}
        </AuthProvider>

        <Script src="/template/js/jquery.min.js" strategy="beforeInteractive" />
        <Script src="/template/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
        <Script src="/template/js/sb-admin-2.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
