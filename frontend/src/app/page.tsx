"use client";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { AnimatedTestimonialsDemo } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";


export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Navbar Section */}
      <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-15">
        <Navbar />
      </section>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-4 sm:px-10 md:px-20 mt-5 mb-15">

        <div className="lg:w-[50%] flex flex-col gap-7">
          <h1 className="font-poppins text-4xl md:text-5xl font-bold leading-tight">
            Unleash Innovation with{" "}
            <span className="relative inline-block">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
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
              <button className="hover:bg-yellow-300/60 bg-yellow-300/70 text-black font-semibold p-4 rounded-lg w-full cursor-pointer">
                🚀 Participate in Hackathons
              </button>
            </Link>
            <Link href="/host">
              <button className="bg-black hover:bg-gray-800 text-white font-semibold p-4 rounded-lg w-full cursor-pointer">
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

      {/* Featured Hackathons */}
      <section className="flex flex-col mt-16  gap-15 md:gap-20 px-4 sm:px-10 md:px-20 mb-15">
        <div className="text-2xl md:text-4xl font-poppins font-semibold">
          <h1>Hackathons For You</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6 font-outfit">

          <div className="border rounded-lg p-6 shadow hover:shadow-lg transition w-full md:w-1/4 flex flex-col gap-10">
            <h2 className="font-semibold text-lg">AI Innovators Hackathon</h2>
            <p className="text-gray-600 text-sm">Compete with the best minds in AI and win exciting prizes!</p>
            <Link href="/hackathons/ai-innovators" className="text-black hover:underline hover:underline-offset-4 hover:decoration-yellow-300 font-medium mt-auto">
              View Details →
            </Link>
          </div>

          <div className="border rounded-lg p-6 shadow hover:shadow-lg transition w-full md:w-1/4 flex flex-col gap-10">
            <h2 className="font-semibold text-lg">Web3 Revolution</h2>
            <p className="text-gray-600 text-sm">Dive into blockchain and decentralized apps. Rewards await!</p>
            <Link href="/hackathons/web3-revolution" className="text-black hover:underline hover:underline-offset-4 hover:decoration-yellow-300 font-medium mt-auto">
              View Details →
            </Link>
          </div>

          <div className="border rounded-lg p-6 shadow hover:shadow-lg transition w-full md:w-1/4 flex flex-col gap-10">
            <h2 className="font-semibold text-lg">Healthcare Hack 2.0</h2>
            <p className="text-gray-600 text-sm">Solve real-world healthcare problems and make an impact.</p>
            <Link href="/hackathons/healthcare-hack" className="text-black hover:underline hover:underline-offset-4 hover:decoration-yellow-300 font-medium mt-auto">
              View Details →
            </Link>
          </div>

          <div className="border rounded-lg p-6 shadow hover:shadow-lg transition w-full md:w-1/4 flex flex-col gap-10">
            <h2 className="font-semibold text-lg">EduTech Sprint</h2>
            <p className="text-gray-600 text-sm">Build tools that change how students learn and grow.</p>
            <Link href="/hackathons/edutech-sprint" className="text-black hover:underline hover:underline-offset-4 hover:decoration-yellow-300 font-medium mt-auto">
              View Details →
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/hackathons" className="text-white font-medium hover:bg-yellow-300/80 hover:text-black font-outfit p-5 bg-black rounded-lg duration-200">
            Browse All Hackathons →
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-yellow-300/70 text-black py-16 px-4 mt-5 sm:px-10 md:px-20 max-h-[150vh] md:max-h-[100vh]">
        <h2 className="text-3xl md:text-4xl font-poppins font-semibold mb-12">
          What Our Community Says
        </h2>
        <AnimatedTestimonialsDemo />
      </section>

      {/* Footer Section */}
      <section className="">
        <Footer />
      </section>

    </main>
  );
}
