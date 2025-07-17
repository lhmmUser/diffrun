"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cards } from "@/data/data";
import FAQClient from "./faq/faq-client";
import { faqData, step } from '@/data/data'
import { steps } from "@/data/steps";
import CookieConsent from "@/components/custom/CookieConsent";
import { motion } from 'framer-motion'

type CountryCode = 'US' | 'CA' | 'IN' | 'AU' | 'NZ' | 'GB' | string;

export default function Home() {

    const GEO = process.env.NEXT_PUBLIC_GEO;
    const [locale, setLocale] = useState<CountryCode>("");
    const [isLocaleLoading, setIsLocaleLoading] = useState(true);

    useEffect(() => {
        const determineLocale = async () => {
            setIsLocaleLoading(true);

            try {
                const ipapiRes = await fetch(`https://ipapi.co/json?token=${GEO || "tryit"}`);
                if (ipapiRes.ok) {
                    const ipapiData = await ipapiRes.json();

                    if (ipapiData.country && isValidCountryCode(ipapiData.country)) {
                        const normalized = normalizeCountryCode(ipapiData.country);
                        setLocale(normalized);
                        localStorage.setItem("userLocale", normalized);
                        return;
                    }
                }

                console.log("[Geo] Falling back to ip-api.com");
                const ipApiRes = await fetch('http://ip-api.com/json/?fields=countryCode');
                if (ipApiRes.ok) {
                    const ipApiData = await ipApiRes.json();


                    if (ipApiData.countryCode && isValidCountryCode(ipApiData.countryCode)) {
                        const normalized = normalizeCountryCode(ipApiData.countryCode);
                        setLocale(normalized);
                        localStorage.setItem("userLocale", normalized);
                        return;
                    }
                }

                console.log("[Geo] Falling back to browser language");
                const browserLang = navigator.language.split('-')[1];
                if (browserLang && isValidCountryCode(browserLang)) {
                    const normalized = normalizeCountryCode(browserLang);
                    setLocale(normalized);
                    localStorage.setItem("userLocale", normalized);
                    return;
                }

                throw new Error("All methods failed");

            } catch (error) {
                setLocale("IN");
                localStorage.setItem("userLocale", "IN");
            } finally {
                setIsLocaleLoading(false);
            }
        };

        determineLocale();
    }, [GEO]);

    const isValidCountryCode = (code: string): boolean => {
        const validCodes = ['US', 'CA', 'IN', 'AU', 'NZ', 'GB'];
        const isValid = validCodes.includes(code);
        return isValid;
    };

    const normalizeCountryCode = (code: string): CountryCode => {
        if (!code) return 'IN';
        const upperCode = code.toUpperCase();
        return upperCode;
    };

    const formatPrice = (card: typeof Cards[0], bookType: 'paperback' | 'hardcover') => {
        if (isLocaleLoading) {
            return <span className="h-4 w-20 bg-gray-200 animate-pulse rounded"></span>;
        }

        const countryKey = Object.keys(card.prices).find(
            key => key.toUpperCase() === locale.toUpperCase()
        ) as keyof typeof card.prices || 'IN';

        const countryPrices = card.prices[countryKey] || card.prices.IN;
        const priceData = countryPrices[bookType];

        const currencyMatch = priceData.price.match(/[A-Z]{2,3}$/);
        const currencyCode = currencyMatch ? currencyMatch[0] :
            countryKey === 'US' ? 'USD' :
                countryKey === 'GB' ? 'GBP' :
                    countryKey === 'CA' ? 'CAD' :
                        countryKey === 'AU' ? 'AUD' :
                            countryKey === 'NZ' ? 'NZD' : 'INR';

        return (
            <span>
                From {priceData.price.includes(currencyCode)
                    ? priceData.price
                    : `${priceData.price} ${currencyCode}`}
            </span>
        );
    };

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

    return (
        <>
            <CookieConsent />
            <main className="w-full min-h-screen relative overflow-hidden space-y-2 md:space-y-12 px-0 md:px-16 lg:px-40 xl:px-60">

                <section className="hidden md:flex w-full h-[400px]">
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
                                    <div className="absolute -top-5 -right-7">
                                        <div className="relative overflow-hidden bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shine">
                                            FREE
                                        </div>
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
                            src="/big-banner.avif"
                            alt="Diffrun personalized books - banner"
                            width="600"
                            height="400"
                            className="w-full h-full object-cover object-left"
                        />
                    </div>

                </section>

                <section className="block md:hidden w-full">
                    <img
                        src="/mobile-banner.avif"
                        alt="Diffrun personalized books - Mobile Banner Diffrun"
                        width="640"
                        height="640"
                        className="w-full object-cover"
                    />

                    <div className="bg-[#f7f6d0] w-full flex flex-col items-center text-center py-0 sm:py-6 px-0 sm:px-4">
                        <h2 className="text-lg xs:text-xl sm:text-3xl mb-2 font-libre text-gray-900 leading-tight">
                            Turn photos into storybooks, instantly!
                        </h2>
                        <div className="w-full flex flex-col justify-center mt-4">
                            <Link href="/books" aria-label="Go to Books page">
                                <div className="relative inline-block">
                                    <button className="flex items-center gap-2 bg-[#5784ba] rounded-xl text-white py-3 px-8 font-medium shadow-md transition-all duration-300 hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer">
                                        Generate instant preview
                                    </button>
                                    <div className="absolute -top-5 -right-7">
                                        <div className="relative overflow-hidden bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shine">
                                            FREE
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            <p className="text-sm sm:text-lg text-gray-800 font-poppins my-2 mb-4">
                                takes only 2 minutes
                            </p>
                        </div>
                    </div>
                </section>

                <section className="flex flex-col px-4 sm:px-6 md:px-0 mt-4 md:mt-10">
                    <p className="w-full text-left text-lg sm:text-2xl lg:text-3xl text-gray-700 font-medium font-libre mb-5">
                        Choose your story and start personalizing
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full">
                        {Cards.map((card, index) => (
                            <div
                                key={index}
                                className="flex flex-col bg-white shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
                            >
                                <Link
                                    href={`/child-details?job_type=story&book_id=${card.bookKey}`}
                                    aria-label={`Personalize ${card.title} story for ages ${card.age}`}
                                    className="flex flex-col h-full"
                                >
                                    <div className="relative w-full pt-[75%] overflow-hidden">

                                        <img
                                            src={card.imageSrc}
                                            alt={card.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 lg:group-hover:opacity-0 lg:opacity-100 hidden md:block"
                                            loading="lazy"
                                        />

                                        <img
                                            src={card.hoverImageSrc || card.imageSrc}
                                            alt={`${card.title} hover`}
                                            className="absolute inset-0 w-full h-full object-cover hidden md:block opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100"
                                            loading="lazy"
                                        />

                                        <img
                                            src={card.hoverImageSrc || card.imageSrc}
                                            alt={`${card.title} mobile`}
                                            className="absolute inset-0 w-full h-full object-cover md:hidden"
                                            loading="lazy"
                                        />
                                    </div>


                                    <div className="flex flex-col flex-1 p-4 md:p-6 space-y-3">
                                        <div className="flex justify-between items-center flex-wrap gap-y-1">
                                            <div className="flex flex-wrap gap-1">
                                                {Array.isArray(card.category) && card.category.length > 0 ? (
                                                    card.category.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className={`text-xs px-2 py-1 font-semibold rounded-full ${pastelTags[(index + i) % pastelTags.length]
                                                                } whitespace-nowrap`}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span
                                                        className={`text-xs px-2 py-1 font-semibold rounded-full ${pastelTags[index % pastelTags.length]
                                                            }`}
                                                    >
                                                        Storybook
                                                    </span>
                                                )}
                                            </div>

                                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                                Ages {card.age}
                                            </span>
                                        </div>

                                        <h3 className="text-lg sm:text-xl font-medium font-libre text-gray-900 mt-2">
                                            {card.title}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                            {card.description}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4">
                                            <span className="text-base md:text-lg font-medium text-gray-800">
                                                {formatPrice(card, 'paperback')}
                                            </span>

                                            <button
                                                className="bg-[#5784ba] hover:bg-[#406493] text-white py-2 px-4 sm:px-6 rounded-lg font-medium text-sm transition-colors duration-200"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    window.location.href = `/child-details?job_type=story&book_id=${card.bookKey}`;
                                                }}
                                            >
                                                Personalize
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full my-10 md:my-20 px-3 md:px-0">
                    <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
                </section>

                <section className="w-full my-10 md:my-20 px-3 md:px-0">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className=""
                    >
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-gray-900 font-libre">
                            How It Works
                        </h1>
                    </motion.div>
                    <div className="mt-4 md:mt-12 flex flex-col-reverse lg:flex-row gap-10 items-center">

                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="w-full lg:w-1/2"
                        >
                            <div className="flex flex-col gap-4">
                                {step.map((step, index) => (
                                    <motion.div
                                        key={step.number}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                                        className="relative pl-14"
                                    >
                                        <dt className="text-lg sm:text-xl font-medium font-libre text-gray-800">
                                            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#5784ba] text-white">
                                                {step.number}
                                            </div>
                                            {step.title}
                                        </dt>
                                        <dd className="text-sm sm:text-base font-poppins text-gray-600">
                                            {step.description}
                                        </dd>
                                    </motion.div>
                                ))}
                            </div>
                            <div className='p-4 mt-8 ml-8'>
                                <Link
                                    href="/books"
                                    className="px-8 py-2.5 rounded-xl bg-[#5784ba] text-sm sm:text-base font-medium text-white shadow-sm hover:bg-[#4a6f8f] transition-colors"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="w-full sm:max-w-mlg md:max-w-xl aspect-[1/1] rounded-xl overflow-hidden shadow-lg lg:w-1/2"
                        >
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube-nocookie.com/embed/eDfK4Xyl69A?si=-xBJa3z3DXsQ2_z3"
                                title="Diffrun | How It Works Guide Video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                                loading='lazy'
                            />
                        </motion.div>
                    </div>
                </section>

                <section className="bg-[#f7f6cf] py-10 px-4">
                    <div className="mx-auto ml-4 space-y-8 text-center">
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

            </main>

            <div className="px-4 md:px-16 lg:px-40 xl:px-60 mt-6 md:mt-0">
                <FAQClient items={faqData} />
            </div>
        </>
    );
}