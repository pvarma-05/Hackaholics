"use client";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="flex flex-col gap-15">
      <section className="flex">
        <Navbar />
      </section>

      <section className="flex flex-col md:flex-row items-center justify-between">
        {/* Left Side */}
        <div className="lg:w-[50%] flex flex-col gap-7">
          <h1 className="font-poppins text-4xl md:text-5xl font-bold leading-tight">
            Unleash Innovation with{" "}
            <span className="relative inline-block">

              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute left-0 top-0 h-full bg-yellow-300/70 z-[-1] rounded-md"
              />
              Hackaholics 🚀
            </span>
          </h1>

          <p className="font-outfit text-gray-600 text-lg">
            Join a growing community where students build, compete, and learn — while experts host impactful hackathons that shape the future.
          </p>

          <div className="flex flex-col gap-4 font-outfit lg:flex-row">
            <Link href="/register">
              <button className="hover:bg-yellow-300/60 bg-yellow-300/70 text-black font-semibold py-3 px-4 rounded-lg w-full cursor-pointer">
                🚀 Participate in Hackathons
              </button>
            </Link>
            <Link href="/host">
              <button className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg w-full cursor-pointer">
                🎯 Host Your Hackathon
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-10 md:mt-0 hidden lg:block">
          <Image
            src="/hero-svg.svg"
            alt="Hackathon Illustration"
            width={650}
            height={650}
            draggable={false}
            className="select-none h-auto w-auto"
            priority
          />
        </div>
      </section>
    </main>
  );
}
