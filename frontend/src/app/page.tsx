"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cards } from "@/data/data";
import FAQClient from "./faq/faq-client";
import { faqData } from '@/data/data'
import { steps } from "@/data/steps";
import CookieConsent from "@/components/custom/CookieConsent";

export default function Home() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [locale, setLocale] = useState<string>("");

  useEffect(() => {
  const fetchCountry = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const userLocale = data.country || "";

      localStorage.setItem("userLocale", userLocale);
      setLocale(userLocale);

      await fetch(`${apiBaseUrl}/update-country`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: userLocale }),
      });
    } catch (err) {
      console.error("🌐 Failed to fetch locale:", err);
    }
  };

  fetchCountry();
}, []);

const pastelTags = [
        "bg-pink-100 text-pink-700",
        "bg-green-100 text-green-700",
        "bg-blue-100 text-blue-700",
        "bg-yellow-100 text-yellow-700",
        "bg-purple-100 text-purple-700",
        "bg-orange-100 text-orange-700",
        "bg-rose-100 text-rose-700",
        "bg-lime-100 text-lime-700",
    ];

    const getRandomPastel = () => {
        const index = Math.floor(Math.random() * pastelTags.length);
        return pastelTags[index];
    };

    return (
        <>
        <CookieConsent />
        <main className="w-full min-h-screen relative overflow-hidden space-y-12 px-0 md:px-16 lg:px-40 xl:px-60">

            <div className="hidden md:flex w-full h-[400px]">
                <div className="w-1/2 bg-[#f7f6cf] flex items-center justify-start px-8">
                    <div className="max-w-sm space-y-6 text-left px-6 md:px-12">
                        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-libre font-medium text-gray-900 leading-tight">
                            Turn photos into
                            <br />
                            storybooks, instantly!
                        </h2>
                        <p className="text-gray-800 font-poppins text-lg leading-tight">
                            Personalized Storybooks for kids
                            <br />
                            that say "You are the Hero."
                        </p>
                        <Link href="/books" aria-label="Go to Books page">
                            <div className="relative inline-block">
                                <button className="flex items-center gap-2 bg-[#5784ba] rounded-xl text-white py-3 px-8 font-medium shadow-md transition-all duration-300 hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer">
                                    Generate instant preview
                                </button>
                                <div className="absolute -top-5 -right-7 bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg ">
                                    FREE
                                </div>
                            </div>
                        </Link>
                        <p className="text-sm md:text-base text-gray-800 font-poppins my-2">
                            takes only 2 minutes
                        </p>
                    </div>
                </div>

                <div className="w-1/2 h-full">
                    <img
                        src="/banner-gif.avif"
                        alt="Diffrun personalized books - banner"
                        width="600"
                        height="400"
                        className="w-full h-full object-cover object-left"
                    />
                </div>
            </div>

            <div className="block md:hidden w-full">
                <img
                    src="/mobile-banner.avif"
                    alt="Diffrun personalized books - Mobile Banner Diffrun"
                    width="640"
                    height="640"
                    className="w-full object-cover"
                />

                <div className="bg-[#f7f6d0] w-full flex flex-col items-center text-center py-6 px-4">
                    <h2 className="text-lg xs:text-xl sm:text-3xl font-libre text-gray-900 leading-tight">
                        Turn photos into storybooks, instantly!
                    </h2>
                    <div className="w-full flex justify-center mt-4">
                        <Link href="/books" aria-label="Go to Books page">
                            <button
                                className="flex items-center gap-2 bg-[#5784ba] text-white py-3 px-8 font-medium shadow-md transition-all duration-300 hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer"
                            >
                                Generate free preview
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex flex-col px-10 md:px-0 mt-10">
                <p className="w-full text-left text-lg sm:text-2xl lg:text-3xl text-gray-700 font-medium font-libre mb-5">
                    Choose your story and start personalizing
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full">
                    {Cards.map((card, index) => (
                        <div
                            key={index}
                            className="flex flex-col bg-white shadow-md overflow-hidden transition-transform duration-300"
                        >
                          
                            <div className="relative w-full pt-[75%]">
                                <img
                                    src={card.imageSrc}
                                    alt={card.title}
                                    className="absolute inset-0 object-cover w-full h-full"
                                />
                            </div>

                            <div className="flex flex-col flex-1 px-6 p-4 space-y-2">
                           
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs px-4 py-1 font-semibold rounded-full ${getRandomPastel()}`}>
                                        {card.category || "Storybook"}
                                    </span>
                                    <span className="text-sm text-gray-600 font-medium">Ages {card.age}</span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg sm:text-xl font-medium font-libre text-gray-900">
                                    {card.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-700">{card.description}</p>

                                <div className="flex items-center justify-between mt-4">

                                {/* Price */}
                                <span className="text-lg font-semibold text-gray-800">
                                    From {card.price}
                                </span>

                                {/* Button */}
                                <Link
                                    href={`/child-details?job_type=story&book_id=${card.bookKey}`}
                                    className="block"
                                    aria-label={`Personalize ${card.title} story for ages ${card.age}`}
                                >
                                    <button className="w-full bg-[#5784ba] text-white py-2.5 px-5 rounded-xl font-medium font-play hover:bg-[#406493] transition hover:cursor-pointer">
                                        Personalize
                                    </button>
                                </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full my-20 px-10 md:px-0">
                <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
            </div>

            <section className="bg-[#f7f6cf] py-10 px-4 my-20">
                <div className="mx-auto text-center space-y-8">
                    <h2 className="text-2xl lg:text-3xl xl:text-4xl font-libre font-medium text-gray-900 leading-tight">
                        Meaningful gifts, made in minutes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center space-y-1">
                                <div className="bg-[#5784ba] p-4 rounded-2xl w-12 h-12 flex items-center justify-center">
                                    {step.icon}
                                </div>
                                <p className="text-xl font-medium font-libre text-gray-800">{step.title}</p>
                                <p className="text-sm text-gray-800 font-poppins">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="px-10 md:px-0">
                <FAQClient items={faqData} />
            </div>

        </main>
        </>
    );
}