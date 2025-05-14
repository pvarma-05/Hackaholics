"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full font-outfit">
      <div className="flex justify-between items-center py-2">
        <Link href="/" className="flex items-center w-auto h-auto">
          <div className="relative">
            {/* Small Screens Logo */}
            <Image
              src="/Group.svg"
              alt="Hackaholics Logo Small"
              height={200}
              width={200}
              className="object-contain h-auto w-auto block md:hidden select-none"
              draggable={false}
              priority
            />

            {/* Medium & Large Screens Logo */}
            <Image
              src="/Group-old.svg"
              alt="Hackaholics Logo Large"
              height={200}
              width={200}
              className="object-contain h-auto w-auto hidden md:block select-none"
              draggable={false}
              priority
            />
          </div>

        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-5">
          <Link className="bg-gray-200/50 hover:bg-gray-200  py-2 px-3 rounded-md font-medium" href="/register">
            Register
          </Link>
          <Link className="hover:bg-yellow-300/60 py-2 px-3 bg-yellow-300/70 rounded-md font-medium" href="/login">
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex">
          <button onClick={() => setMenuOpen(!menuOpen)} className="focus:outline-none">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 p-4">
          <Link className="bg-gray-300 hover:bg-gray-300/50 py-2 px-3 rounded-md" href="/register" onClick={() => setMenuOpen(false)}>
            Register
          </Link>
          <Link className="hover:bg-yellow-300/60 py-2 px-3 bg-yellow-300/70 rounded-md" href="/login" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
