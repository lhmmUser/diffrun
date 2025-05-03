"use client";
import Link from "next/link";
import AnimatedBackground from "@/components/animated/Particles";
import { Cards } from "@/data/data";
import FAQClient from "./faq/faq-client";
import { faqData } from '@/data/data'

export default function Home() {
  return (
    <main className="w-full min-h-screen relative overflow-hidden">
      {/* <AnimatedBackground /> */}
      <div className="relative w-full">
    
        <img
          src="/web-banner.jpg"
          alt="Large Banner Image"
          className="w-full object-cover hidden md:block"
          loading="lazy"
        />

        <img
          src="/banner_mobile.jpg"
          alt="Small Banner Image"
          className="w-full object-cover block md:hidden"
          loading="lazy"
        />

        <div className="absolute top-0 w-full flex flex-col items-center text-center mt-6 sm:mt-10 lg:mt-20 px-4 sm:px-6">
          <h1 className="w-full text-white font-serif font-bold drop-shadow-md text-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            Turn photos into storybooks
          </h1>
          <p className="mt-2 text-white font-light drop-shadow-md max-w-3xl text-base sm:text-lg md:text-xl lg:text-2xl">
            Personalized books where they are the hero
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="text-center mb-0 sm:mb-16">
          <p className="text-lg sm:text-2xl lg:text-3xl text-gray-700 font-medium">
            Choose your story and start personalizing ✨
          </p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16 lg:gap-20 w-full max-w-7xl p-12 [grid-auto-rows:1fr]">
          {Cards.map((card, index) => (
            <div
              key={index}
              className="flex flex-col h-full bg-white border border-gray-900 shadow-[6px_6px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]"
            >
              <div className="relative h-auto w-full">
                <img
                  src={card.imageSrc}
                  alt={card.title}
                  className="object-contain w-full h-full"
                />
              </div>

              <div className="p-4 sm:p-6 space-y-4 flex-1">

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {card.title}
                  <br />
                  <span className="text-sm font-medium md:text-lg text-gray-800">Age: {card.age} years</span>
                </h3>

                <div className="flex flex-col gap-4 mt-4">
                  <Link href={`/child-details?job_type=story&book_id=${card.bookKey}`} className="flex-1">
                    <button
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-2.5 px-5 font-medium border border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      Personalize this book
                    </button>
                  </Link>

                  {/* {card.link && (
                    <Link href={card.link} className="flex-1" target="_blank" rel="noopener noreferrer">
                      <button
                        className="w-full bg-white text-gray-900 py-2 px-4 font-medium border border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        View Sample
                      </button>
                    </Link>
                  )} */}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <FAQClient items={faqData} />
      </div>
    </main>
  );
}