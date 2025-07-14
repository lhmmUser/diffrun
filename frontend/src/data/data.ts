export interface CardProps {
  bookKey: string;
  title: string;
  imageSrc: string;
  hoverImageSrc?: string;
  age?: string;
  description?: string;
  category?: string[];
  pages?: number;
  features?: string[];
  prices: {
    [countryCode: string]: {
      hardcover: { price: string; shipping: string; taxes: string };
      paperback: { price: string; shipping: string; taxes: string };
    };
  };
}

export const Cards: CardProps[] = [
  {
    bookKey: "wigu",
    title: "When Sara Grows Up",
    imageSrc: "/wigu-book.avif",
    hoverImageSrc: "/wigu-book-1.avif",
    age: "3 - 7",
    description:
      "All the amazing things a child can grow up to be. This book inspires big dreams.",
    category: ["Inspiration", "Confidence"],
    prices: {
      US: {
        paperback: { price: "$39.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$54.99", shipping: "$7.99", taxes: "0" },
      },
      UK: {
        paperback: { price: "£29.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£39.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,450", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,950", shipping: "0", taxes: "0" },
      },
      AU: {
        paperback: { price: "$1.00 AUD", shipping: "$0 AUD", taxes: "0" },
        hardcover: { price: "$1.00 AUD", shipping: "$0 AUD", taxes: "0" },
      },
      NZ: {
        paperback: { price: "$59.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
        hardcover: { price: "$79.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
      },
    },
  },
  {
    bookKey: "dream",
    title: "Many Dreams of Zohaan",
    imageSrc: "/dream-book.png",
    hoverImageSrc: "/dream-book-5.avif",
    age: "2 - 6",
    description:
      "A magical journey through imagination—soar above clouds, tame dragons, and conquer wild quests.",
    category: ["Fantasy", "Imagination"],
    prices: {
      US: {
        paperback: { price: "$39.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$54.99", shipping: "$7.99", taxes: "0" },
      },
      UK: {
        paperback: { price: "£29.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£39.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,450", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,950", shipping: "0", taxes: "0" },
      },
      AU: {
        paperback: { price: "$50.00 AUD", shipping: "$0.5 AUD", taxes: "0" },
        hardcover: { price: "$50.00 AUD", shipping: "$0.5 AUD", taxes: "0" },
      },
      NZ: {
        paperback: { price: "$59.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
        hardcover: { price: "$79.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
      },
    },
  },
  {
    bookKey: "astro",
    title: "Zoey's Space Adventure",
    imageSrc: "/astronaut-book.avif",
    hoverImageSrc: "/astro-book-1.avif",
    age: "4 - 10",
    description:
      "The Child blasts off into space as the hero of their own mission, exploring the wonders of the galaxy.",
    category: ["Adventure", "Sci-Fi"],
    prices: {
      US: {
        paperback: { price: "$39.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$54.99", shipping: "$7.99", taxes: "0" },
      },
      UK: {
        paperback: { price: "£29.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£39.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,450", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,950", shipping: "0", taxes: "0" },
      },
      AU: {
        paperback: { price: "$1.00 AUD", shipping: "$0 AUD", taxes: "0" },
        hardcover: { price: "$1.00 AUD", shipping: "$0 AUD", taxes: "0" },
      },
      NZ: {
        paperback: { price: "$59.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
        hardcover: { price: "$79.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
      },
    },
  },
  {
    bookKey: "abcd",
    title: "Max meets ABC",
    imageSrc: "/abcd-book.avif",
    hoverImageSrc: "/abcd-book-1.avif",
    age: "2 - 4",
    description:
      "Introduction to the alphabet through playful rhymes, colorful characters that makes learning fun and memorable.",
    category: ["Early Learning", "Alphabet"],
    prices: {
      US: {
        paperback: { price: "$39.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$54.99", shipping: "$7.99", taxes: "0" },
      },
      UK: {
        paperback: { price: "£29.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£39.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,450", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,950", shipping: "0", taxes: "0" },
      },
      AU: {
        paperback: { price: "$1.00 AUD", shipping: "$0 AUD", taxes: "0" },
        hardcover: { price: "$1.00 AUD", shipping: "$0 AUD", taxes: "0" },
      },
      NZ: {
        paperback: { price: "$59.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
        hardcover: { price: "$79.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
      },
    },
  },
  {
     bookKey: "sports",
    title: "Amaira is a born Sportstar",
    imageSrc: "/sports-book.avif",
    hoverImageSrc: "sports-book-5.avif",
    age: "4 - 10",
    description:
     "A thrilling book that inspires and boosts confidence. Perfect for active kids chasing big dreams.",
    category: ["Motivation", "Sports"],
    prices: {
      US: {
        paperback: { price: "$39.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$54.99", shipping: "$7.99", taxes: "0" },
      },
      UK: {
        paperback: { price: "£29.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£39.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,450", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,950", shipping: "0", taxes: "0" },
      },
      AU: {
        paperback: { price: "$50.00 AUD", shipping: "$0.5 AUD", taxes: "0" },
        hardcover: { price: "$50.00 AUD", shipping: "$0.5 AUD", taxes: "0" },
      },
      NZ: {
        paperback: { price: "$59.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
        hardcover: { price: "$79.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
      },
    },
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

export const step = [
        {
            number: 1,
            title: 'Tell us about your child',
            description: 'Share their name, gender, and a few clear photos to get started.',
        },
        {
            number: 2,
            title: 'Smart face recreation',
            description: ' We use advanced AI to create vector embeddings of their face and recreate it on each story page with realistic context.',
        },
        {
            number: 3,
            title: 'Instant sample preview',
            description: 'Get a free preview of the first 10 pages to see how well the personalization works.',
        },
        {
            number: 4,
            title: 'Unlock and refine',
            description: 'Once you make a purchase, the full book is unlocked. You can also fine-tune any face generations as needed.',
        },
        {
            number: 5,
            title: 'Approve for print',
            description: 'Review the complete book and approve it when you’re fully satisfied.',
        },
        {
            number: 6,
            title: 'Delivered to your door',
            description: 'Your storybook is printed on premium 200GSM glossy paper and shipped to your doorstep in about 7 days.',
        }
    ];