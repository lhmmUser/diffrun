import Link from "next/link";
import { Cards } from "@/data/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Books | Diffrun",
  description: "Explore all available storybooks on Diffrun. Discover, customize, and create personalized books where your child becomes the hero of the story.",
};

export default function Books() {
  return (
    <main className="w-full min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      

      <div className="grid gap-8 max-w-4xl mx-auto">
        <div className="text-left mb-3 sm:mb-6">
        <p className="text-xl sm:text-2xl md:text-3xl font-libre font-medium text-gray-800">
          Start crafting your one-of-a-kind story ✨
        </p>
      </div>
        {Cards.map((card, index) => (
          <div
            key={index}
            className="bg-white shadow-md"
          >
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full h-0 pb-[100%] overflow-hidden md:w-64 md:h-auto md:pb-0 border-b md:border-b-0 md:border-r border-gray-300">
                <img
                  src={card.imageSrc}
                  alt={card.title}
                  className="absolute inset-0 object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                />
              </div>

              <div className="flex flex-col justify-evenly flex-1 p-6 space-y-6">
                <div>
                  <h3 className="sm:text-lg md:text-xl lg:text-2xl font-medium font-libre text-gray-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-700 text-sm sm:text-base font-poppins leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div>
                  <Link href={`/child-details?job_type=story&book_id=${card.bookKey}`}>
                    <button className="flex items-center gap-2 bg-[#5784ba] text-white py-3 px-8 font-medium shadow-md transition-all duration-300 hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer">
                      Personalize your book
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}