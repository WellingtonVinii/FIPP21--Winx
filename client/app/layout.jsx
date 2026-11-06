import { Nunito } from "next/font/google";
import "./globals.css";
import "../public/template/css/sb-admin-2.min.css";
import "../public/template/css/fontawesome-free/css/all.min.css";

const nunito = Nunito({ subsets: ['latin'] });

export const metadata = {
  title: "FIPP21 - Jogo 21 Multiplayer",
  description: "Plataforma de jogo 21 multiplayer criada para a disciplina de PFS2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="/template/js/jquery.min.js"></script>
        <script src="/template/js/bootstrap.bundle.min.js"></script>
        <script src="/template/js/sb-admin-2.min.js"></script>
      </head>
      <body className={nunito.className}>
        {children}
      </body>
    </html>
  );
}
