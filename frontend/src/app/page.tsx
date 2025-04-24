"use client";
import Link from "next/link";
import AnimatedBackground from "@/components/animated/Particles";
import { Cards } from "@/data/data";

export default function Home() {
  return (
    <main className="w-full min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <img
        src="/bannner-2.jpg"
        alt="Large Banner Image"
        className="w-full object-cover hidden md:block"
        loading="lazy"
      />

      <img
        src="/small-banner.jpeg"
        alt="Small Banner Image"
        className="w-full object-cover block md:hidden"
        loading="lazy"
      />

      <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <section className="w-full max-w-4xl mx-auto mt-8 sm:mt-12 mb-16 sm:mb-24">
          <div className="border-4 border-gray-900 bg-white p-6 sm:p-10 shadow-[8px_8px_0px_rgba(0,0,0,0.9)]">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight text-center sm:text-left">
              The only storybooks <br className="hidden sm:block" /> where they are{" "}
              <br className="hidden sm:block" />
              <span className="font-serif italic text-3xl sm:text-6xl lg:text-7xl block mt-2">
                the hero
              </span>
            </h1>
            <p className="text-gray-700 text-base sm:text-lg lg:text-xl mb-8 mt-4 px-2 sm:px-0">
              We turn photos into amazing storybooks for kids using cutting-edge AI.
            </p>

            <div className="flex justify-center sm:justify-start mt-6">
              <Link href="/books">
                <button className="bg-[#FAB42A] text-white px-6 sm:px-8 py-3 sm:py-4 font-medium border-2 border-gray-900 
                  shadow-[4px_4px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 
                  hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900">
                  Create my child&apos;s book
                </button>
              </Link>
            </div>
          </div>
        </section>

        <div className="text-center mb-12 sm:mb-16">
          <p className="text-lg sm:text-2xl lg:text-3xl text-gray-700 font-medium tracking-wide px-4">
            Choose your story and start personalizing ✨
          </p>
        </div>

        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-20 w-full max-w-5xl p-12 [grid-auto-rows:1fr]">
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
                <div className="flex gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 text-xs sm:text-sm font-medium tracking-wide border border-gray-900 ${card.category === "story"
                      ? "bg-teal-100 text-teal-900"
                      : "bg-indigo-200 text-indigo-900"
                      }`}
                  >
                    {card.category.charAt(0).toUpperCase() + card.category.slice(1)}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {card.title}
                  <br />
                  <span className="text-sm font-thin md:text-lg text-gray-800">Age: {card.age} years</span>
                </h3>



                <div className="flex flex-col gap-4 mt-4">
                  <Link href={`/child-details?job_type=${card.category}&book_id=${card.bookKey}`} className="flex-1">
                    <button
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-2.5 px-5 font-medium border border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      Personalize this book
                    </button>
                  </Link>

                  {card.link && (
      <Link href={card.link} className="flex-1" target="_blank" rel="noopener noreferrer">
        <button
          className="w-full bg-white text-gray-900 py-2 px-4 font-medium border border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          View Sample
        </button>
      </Link>
    )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}