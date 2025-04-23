import Link from "next/link";

interface CardProps {
  imageSrc: string;
  title: string;
  description: string;
  category: "story" | "comic";
  bookKey: string;
}

const cards: CardProps[] = [
  {
    imageSrc: "/abcd-book.jpg",
    title: "ABCD",
    description:
      "An engaging and colorful storybook that introduces the alphabet through fun characters, vibrant illustrations, and playful rhymes that kids love.",
    category: "story",
    bookKey: "abcd",
  },
  {
    imageSrc: "/astronaut-book.jpg",
    title: "Astronaut in Space",
    description:
      "Blast off on a galactic adventure! Follow a brave astronaut exploring distant planets, alien life, and the wonders of outer space.",
    category: "story",
    bookKey: "astronaut",
  },
  {
    imageSrc: "/wigu-book.jpg",
    title: "When I Grow Up",
    description:
      "An inspiring journey through childhood dreams—join curious kids as they explore exciting careers, big dreams, and how imagination leads the way.",
    category: "story",
    bookKey: "wigu",
  },
  // {
  //   imageSrc: "/aerospace-comic.png",
  //   title: "Aerospace Comic",
  //   description:
  //     "A high-flying comic series that dives into the world of aerospace innovation—perfect for young engineers, dreamers, and thrill-seekers.",
  //   category: "comic",
  //   bookKey: "aerospace",
  // },
];

export default function Books() {
  return (
    <main className="w-full min-h-screen bg-gray-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <p className="text-2xl sm:text-3xl font-semibold text-gray-800">
          Start crafting your one-of-a-kind story ✨
        </p>
      </div>

      <div className="grid gap-10 max-w-4xl mx-auto">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white border border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,0.9)] rounded-none transition-transform duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-96 h-72 md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-gray-300">
                <img
                  src={card.imageSrc}
                  alt={card.title}
                  className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                />
              </div>

              <div className="flex flex-col justify-between flex-1 p-6 space-y-8">
                <div>
                  <span
                    className={`inline-block px-4 py-1 mb-2 md:mb-6 rounded-none text-sm font-medium tracking-wide border border-gray-900 ${
                      card.category === "story"
                        ? "bg-teal-100 text-teal-900"
                        : "bg-indigo-200 text-indigo-900"
                    }`}
                  >
                    {card.category.charAt(0).toUpperCase() + card.category.slice(1)}
                  </span>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-700 text-base leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6">
                  <Link
                    href={`/child-details?job_type=${card.category}&book_id=${card.bookKey}`}
                  >
                    <button
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-3 px-6 rounded-none font-medium border border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-950"
                    >
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