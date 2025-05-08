import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandDiscord,
} from "@tabler/icons-react";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="bg-black text-white ">
      <div className="mx-auto max-w-7xl py-12">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          
          <div className="flex items-center space-x-2">
            <Image
              src={"/logo-white.svg"}
              alt="Main Logo"
              height={200}
              width={200}
              className="h-auto w-auto select-none"
              draggable={false}
              priority
            />
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="#" className="hover:text-gray-400 transition">
              Home
            </a>
            <a href="#" className="hover:text-gray-400 transition">
              About
            </a>
            <a href="#" className="hover:text-gray-400 transition">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-gray-400 transition">
              <IconBrandGithub size={20} />
            </a>
            <a href="#" className="hover:text-gray-400 transition">
              <IconBrandTwitter size={20} />
            </a>
            <a href="#" className="hover:text-gray-400 transition">
              <IconBrandDiscord size={20} />
            </a>
            <a href="#" className="hover:text-gray-400 transition">
              <IconBrandInstagram size={20} />
            </a>
            <a href="#" className="hover:text-gray-400 transition">
              <IconBrandLinkedin size={20} />
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Hackaholics. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
