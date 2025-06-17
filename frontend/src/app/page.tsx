"use client";

import Link from "next/link";
import { Cards } from "@/data/data";
import FAQClient from "./faq/faq-client";
import { faqData } from '@/data/data'
import { steps } from "@/data/steps";

export default function Home() {
    return (
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
                            <button
                                className="flex items-center gap-2 bg-[#5784ba] text-white py-3 px-8 font-medium shadow-md transition-all duration-300 hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer"
                            >
                                Generate free preview
                            </button>
                        </Link>
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

            <div className="flex flex-col px-10 md:px-0 mt-20">
                <p className="w-full text-left text-lg sm:text-2xl lg:text-3xl text-gray-700 font-medium font-libre mb-5">
                    Choose your story and start personalizing
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full">
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
                                <h3 className="text-lg sm:text-xl font-medium font-libre text-gray-800">
                                    {card.title}
                                    <br />
                                    <span className="text-sm font-thin md:text-base text-gray-700">Age: {card.age} years</span>
                                </h3>

                                <div className="mt-auto">
                                    <Link href={`/child-details?job_type=story&book_id=${card.bookKey}`} className="block" aria-label={`Personalize ${card.title} story for ages ${card.age}`}>
                                        <button className="w-full bg-[#5784ba] text-gray-100 py-2.5 px-5 font-medium shadow-sm font-play transition-all duration-300 hover:bg-[hsl(213,55%,30%)] hover:text-white focus:outline-none cursor-pointer" aria-label={`Personalize the ${card.title} book`}>
                                            Personalize
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <section className="bg-[#f7f6cf] py-10 px-4 my-20">
                <div className="mx-auto text-center space-y-8">
                    <h2 className="text-2xl lg:text-3xl xl:text-4xl font-libre font-medium text-gray-900 leading-tight">
                        Meaningful gifts, made in minutes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center space-y-3">
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

            <div className="w-full my-20 px-10 md:px-0">
                <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
            </div>

            <div className="px-10 md:px-0">
                <FAQClient items={faqData} />
            </div>

        </main>
    );
}