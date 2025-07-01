interface CardProps {
  imageSrc: string;
  title: string;
  bookKey: string;
  age: string;
  description?: string;
  price?: string
}

export const Cards: CardProps[] = [
  {
    imageSrc: "/abcd-book.avif",
    title: "Max meets ABC",
    bookKey: "abcd",
    age: "2 - 4",
    description:
      "A joyful introduction to the alphabet through playful rhymes, colorful characters, and interactive storytelling that makes learning fun and memorable.",
  },
  {
    imageSrc: "/astronaut-book.avif",
    title: "Zoey's Space Adventure",
    bookKey: "astro",
    age: "4 - 10",
    description:
      "Blast off into space as the hero of your own mission. Discover distant planets, meet alien friends, and explore the wonders of the galaxy.",
  },
  {
    imageSrc: "/wigu-book.avif",
    title: "When Sara Grows Up",
    bookKey: "wigu",
    age: "3 - 7",
    description:
      "Imagine all the amazing things you can grow up to be. From firefighter to inventor, this story inspires big dreams and bold adventures.",
  },
  {
    imageSrc: "/dream-book.png",
    title: "Many Dreams of Zohaan",
    bookKey: "dream",
    age: "2 - 6",
    description:
      "A magical journey through imagination—soar above clouds, tame dragons, and conquer wild quests in a world where every dream feels real.",
  },
];

export const faqData = [
  {
    "id": "size-quality",
    "question": "📏 Size & Quality",
    "answer": "Crafted with premium thick paper and superior-quality binding, available in both Hardcover and Paperback formats. Book size: 8\" x 8\""
  },
  {
    "id": "cancellation-policy",
    "question": "💸 Cancellation & Refund Policy",
    "answer": "If your order arrives in a damaged state, you are eligible for a free replacement or a full refund. Refunds are typically processed within 7 working days. Please be advised that some banks or payment providers may require additional time for the funds to appear in your account. If the refund is not received within 14 working days, do not hesitate to contact us at support@diffrun.com."
  },
  {
    "id": "delivery-timeline",
    "question": "🚚 Delivery Timeline",
    "answer": "Our custom-made books require 8–10 days for printing and delivery, as each one is created especially for you."
  },
  {
    "id": "price-books",
    "question": "💰 Price of the Books",
    "answer": "🇮🇳 India • Paperback – ₹1,450 📄 • Hardcover – ₹1,950 📘 Shipping included 🎯 | 🇺🇸 United States • Paperback – $19.32 📖 • Hardcover – $26.33 📘 Shipping: $7.99 🚚 | 🇬🇧 United Kingdom • Paperback – £14.27 📖 • Hardcover – £19.46 📘 Shipping: £4.99 🚚"
  },
  {
    "id": "ordering-multiple",
    "question": "📦 Ordering Multiple Books",
    "answer": "Currently, our system allows you to create and order one book per transaction. If you'd like to order more than one, kindly place separate orders for each book."
  }
]

export const bookDetails: Record<string, { title: string; description: string }> = {
  astro: {
    title: "Zoey's Space Adventure",
    description:
      "Blast off into the stars in this exciting space mission! A beautifully illustrated story that celebrates curiosity, courage, and imagination.",
  },
  wigu: {
    title: "When Sara Grows Up",
    description:
      "Explore exciting careers and dream big! This personalized story inspires your child to imagine a bright future full of possibilities.",
  },
  abcd: {
    title: "Max meets ABC",
    description:
      "From A to Z, every letter comes alive with color and rhythm. A joyful journey through the alphabet that sparks early learning and fun.",
  },
  dream: {
    title: "Many Dreams of Zohaan",
    description:
      "A magical journey through imagination—soar above clouds, tame dragons, and dive into a world where anything is possible and every dream feels real.",
  }
};

export const CardsLP3: CardProps[] = [
  {
    imageSrc: "/abcd-book.avif",
    title: "Max meets ABC",
    bookKey: "abcd",
    age: "2 - 4",
    description:
      "A joyful introduction to the alphabet through playful rhymes, colorful characters, and interactive storytelling that makes learning fun and memorable.",
    price:"₹1250"
  },
  {
    imageSrc: "/astronaut-book.avif",
    title: "Zoey's Space Adventure",
    bookKey: "astro",
    age: "4 - 10",
    description:
      "Blast off into space as the hero of your own mission. Discover distant planets, meet alien friends, and explore the wonders of the galaxy.",
      price:"₹1450"
  },
  {
    imageSrc: "/wigu-book.avif",
    title: "When Sara Grows Up",
    bookKey: "wigu",
    age: "3 - 7",
    description:
      "Imagine all the amazing things you can grow up to be. From firefighter to inventor, this story inspires big dreams and bold adventures.",
      price:"₹1650"
  },
  {
    imageSrc: "/dream-book.png",
    title: "Many Dreams of Zohaan",
    bookKey: "dream",
    age: "2 - 6",
    description:
      "A magical journey through imagination—soar above clouds, tame dragons, and conquer wild quests in a world where every dream feels real.",
      price:"₹1850"
  },
];