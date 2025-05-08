import type { Metadata } from "next";
import { Inter, Outfit, Poppins,Nanum_Myeongjo } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const inter = Nanum_Myeongjo({
  weight: ["400","700", "800"],
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-outfit",
});

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});


export const metadata: Metadata = {
  title: "Hackaholics - A Hackathon Management Platform",
  description: "Hackaholics is a full-stack hackathon management platform that simplifies organizing, participating, and managing hackathons effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} ${poppins.variable} antialiased`}
      >

        {children}

      </body>
    </html>
  );
}
