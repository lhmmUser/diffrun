"use client";
import Link from "next/link";
import { Cards } from "@/data/data";
import FAQClient from "./faq/faq-client";
import { faqData } from '@/data/data'

export default function Home() {
  return (
    <main className="w-full min-h-screen relative overflow-hidden sm:px-0 md:px-20 lg:px-40 xl:px-60">
      <div className="relative w-full hidden md:block">
        <img
          src="/web-banner-640.jpg"
          srcSet="
    /web-banner-640.jpg 640w,
    /web-banner-1280.jpg 1280w,
    /web-banner-1920.jpg 1920w
  "
          sizes="100vw"
          width="1920"
          height="833"
          alt="Large Banner Image"
          className="w-full object-cover"
        />

        <div className="absolute top-0 w-full flex flex-col items-center text-center md:mt-5 lg:mt-10 px-4 md:px-8 lg:px-12">
          <h1 className="sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-libre font-bold text-white drop-shadow-md leading-tight">
            Turn photos into storybooks, instantly!
          </h1>
          <div className="flex justify-center items-center w-full py-4">
            <Link href="/books">
              <button
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-3 px-10 font-medium border border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900 rounded-lg sm:text-sm"
                aria-label="Shop Now"
              >
                Generate free preview
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative w-full block md:hidden">
        <img
          src="/banner_mobile1-640.jpg"
          srcSet="
            /banner_mobile1-320.jpg 320w,
            /banner_mobile1-640.jpg 640w,
            /banner_mobile1-960.jpg 960w
          "
          sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, 960px"
          alt="Small Banner Image"
          className="w-full object-cover"
        />
        <div className="absolute top-0 w-full flex flex-col items-center text-center mt-2 px-2">
          <h1 className="text-lg xs:text-xl sm:text-3xl font-libre text-white drop-shadow-md leading-tight">
            Turn photos into storybooks, instantly!
          </h1>
          <div className="w-full flex justify-center py-3">
            <Link href="/books" aria-label="Go to Books page">
              <button
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-2 px-6 font-medium border border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-gray-900 rounded text-sm"
                aria-label="Shop Now"
              >
                Generate free preview
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="my-10">
        <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
      </div>

      <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="text-center">
          <p className="text-lg sm:text-2xl lg:text-3xl text-gray-700 font-medium">
            Choose your story and start personalizing ✨
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full max-w-7xl p-2 md:p-4">
          {Cards.map((card, index) => (
            <div
              key={index}
              className="flex flex-col h-full transition-transform duration-300 overflow-hidden"
            >
              <div className="relative w-full pt-[100%] sm:pt-[90%] md:pt-[80%] lg:pt-[75%]">
                <img
                  src={card.imageSrc}
                  alt={card.title}
                  className="absolute inset-0 object-cover w-full h-full"
                />
              </div>

              <div className="flex flex-col flex-1 mt-2 space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold font-libre text-gray-800">
                  {card.title}
                  <br />
                  <span className="text-sm font-medium md:text-base text-gray-700">Age: {card.age} years</span>
                </h3>

                <div className="mt-auto">
                  <Link href={`/child-details?job_type=story&book_id=${card.bookKey}`} className="block" aria-label={`Personalize ${card.title} story for ages ${card.age}`}>
                    <button className="w-full bg-[#5784ba] text-gray-100 py-2.5 px-5 font-medium shadow-sm font-play transition-all duration-300 hover:bg-black hover:text-white focus:outline-none" aria-label={`Personalize the ${card.title} book`}>
                      Personalize
                    </button>
                  </Link>
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