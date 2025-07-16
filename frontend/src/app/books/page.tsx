"use client";

import Link from "next/link";
import { Cards } from "@/data/data";
import { useEffect, useState } from "react";

type CountryCode = 'US' | 'CA' | 'IN' | 'AU' | 'NZ' | 'GB' | string;

export default function Books() {

    const [locale, setLocale] = useState<CountryCode>("IN");
    const [isLocaleLoading, setIsLocaleLoading] = useState(true);

    useEffect(() => {
        const determineLocale = async () => {
            setIsLocaleLoading(true);
            
            const cachedLocale = localStorage.getItem("userLocale");
            if (cachedLocale && isValidCountryCode(cachedLocale)) {
                setLocale(normalizeCountryCode(cachedLocale));
                setIsLocaleLoading(false);
                return;
            }

            try {
                const countryCode = await getClientSideCountry();
                const normalized = normalizeCountryCode(countryCode);
                
                setLocale(normalized);
                localStorage.setItem("userLocale", normalized);
            } catch (error) {
                console.error("Geolocation failed, using default", error);
                setLocale("IN");
            } finally {
                setIsLocaleLoading(false);
            }
        };

        determineLocale();
    }, []);

    const isValidCountryCode = (code: string): boolean => {
        return ['US', 'CA', 'IN', 'AU', 'NZ', 'GB'].includes(code);
    };

    const normalizeCountryCode = (code: string): CountryCode => {
        if (!code) return 'IN';
        const upperCode = code.toUpperCase();
        return upperCode;
    };

    const getClientSideCountry = async (): Promise<string> => {
        const apis = [
            () => fetch('https://api.country.is').then(res => res.json()),
            () => fetch('https://geolocation-db.com/json/').then(res => res.json()),
            () => fetch('https://ipapi.co/json').then(res => res.json())
        ];

        for (const api of apis) {
            try {
                const response = await api();
                return response.country || response.country_code;
            } catch (e) {
                continue;
            }
        }
        throw new Error("All geolocation APIs failed");
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
        <main className="w-full min-h-screen bg-white px-4 md:px-16 lg:px-40 xl:px-60 py-4">

            <section className="flex flex-col">

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

            <div className="w-full my-20">
                <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
            </div>
        </main>
    );
}