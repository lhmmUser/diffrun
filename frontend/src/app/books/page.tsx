import Link from "next/link";
import { Cards } from "@/data/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Books | Diffrun",
  description: "Explore all available storybooks on Diffrun. Discover, customize, and create personalized books where your child becomes the hero of the story.",
};

export default function Books() {

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
    <main className="w-full min-h-screen bg-white px-6 md:px-16 lg:px-40 xl:px-60 py-12">

        <div className="flex flex-col">
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

            <div className="w-full my-20">
                <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
            </div>

    </main>
  );
}