import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "MoodMusica",
  description: "This is a AI based mood music provider.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="p-4 bg-blue-500 text-white">
          <h1>MoodMusica</h1>
        </header>
        <main className="p-4">{children}</main>
        <footer className="p-4 bg-blue-500 text-white text-center">&copy; 2024 MoodMusica</footer>
      </body>
    </html>
  );
}
