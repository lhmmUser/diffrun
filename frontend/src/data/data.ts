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
    bookKey: "bloom",
    title: "Robin is growing up fast",
    imageSrc: "/books/bloom/IN/bloom-book.avif",
    hoverImageSrc: "/books/bloom/IN/bloom-book-1.avif",
    age: "1 - 4",
    description: "A heartwarming personalized book that celebrates your child's milestones. Perfect gift for birthdays and milestone celebrations. Make them feel extra special on their favourite day of the year",
    category: ["Celebration", "Milestone", "Growth"],
    prices: {
      US: {
        paperback: { price: "$29.99", shipping: "$0", taxes: "0" },
        hardcover: { price: "$44.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£22.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£29.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$49.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,499", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,999", shipping: "0", taxes: "0" },
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
    bookKey: "wigu",
    title: "When Sara Grows Up",
    imageSrc: "/books/wigu/IN/wigu-book.avif",
    hoverImageSrc: "/books/wigu/IN/wigu-book-1.avif",
    age: "3 - 7",
    description:
      "All the amazing things a child can grow up to be. This book inspires big dreams.",
    category: ["Inspiration", "Confidence"],
    prices: {
      US: {
        paperback: { price: "$34.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$44.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£24.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£34.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$49.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$64.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,499", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,999", shipping: "0", taxes: "0" },
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
    title: "The Many Dreams of Zohaan",
    imageSrc: "/books/dream/IN/dream-book.avif",
    hoverImageSrc: "/books/dream/IN/dream-book-1.avif",
    age: "2 - 6",
    description:
      "A magical journey through imagination—soar above clouds, tame dragons, and conquer wild quests.",
    category: ["Fantasy", "Imagination"],
    prices: {
      US: {
        paperback: { price: "$29.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$44.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£22.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£29.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$49.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,499", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,999", shipping: "0", taxes: "0" },
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
    imageSrc: "/books/astro/IN/astro-book.avif",
    hoverImageSrc: "/books/astro/IN/astro-book-1.avif",
    age: "4 - 10",
    description:
      "The Child blasts off into space as the hero of their own mission, exploring the wonders of the galaxy.",
    category: ["Adventure", "Sci-Fi"],
    prices: {
      US: {
        paperback: { price: "$34.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$49.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£24.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£34.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$54.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$69.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,599", shipping: "0", taxes: "0" },
        hardcover: { price: "₹2,099", shipping: "0", taxes: "0" },
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
    imageSrc: "/books/abcd/IN/abcd-book.avif",
    hoverImageSrc: "/books/abcd/IN/abcd-book-1.avif",
    age: "2 - 4",
    description:
      "Introduction to the alphabet through playful rhymes, colorful characters that makes learning fun and memorable.",
    category: ["Early Learning", "Alphabet"],
    prices: {
      US: {
        paperback: { price: "$29.99", shipping: "$7.99", taxes: "0" },
        hardcover: { price: "$44.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£24.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£34.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$49.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,499", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,999", shipping: "0", taxes: "0" },
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
    title: "Game On Amaira",
    imageSrc: "/books/sports/IN/sports-book.avif",
    hoverImageSrc: "/books/sports/IN/sports-book-1.avif",
    age: "4 - 10",
    description:
      "A thrilling book that inspires and boosts confidence. Perfect for active kids chasing big dreams.",
    category: ["Motivation", "Sports"],
    prices: {
      US: {
        paperback: { price: "$29.99", shipping: "$0", taxes: "0" },
        hardcover: { price: "$44.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£22.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£29.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$49.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,499", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,999", shipping: "0", taxes: "0" },
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
    bookKey: "sports_us",
    title: "Game On Sophia",
    imageSrc: "/books/sports_us/US/sports_us-book.avif",
    hoverImageSrc: "/books/sports_us/US/sports_us-book-1.avif",
    age: "4 - 10",
    description:
      "A thrilling book that inspires and boosts confidence. Perfect for active kids chasing big dreams.",
    category: ["Motivation", "Sports"],
    prices: {
      US: {
        paperback: { price: "$29.99", shipping: "$0", taxes: "0" },
        hardcover: { price: "$44.99", shipping: "$7.99", taxes: "0" },
      },
      GB: {
        paperback: { price: "£22.99", shipping: "£4.99", taxes: "0" },
        hardcover: { price: "£29.99", shipping: "£4.99", taxes: "0" },
      },
      CA: {
        paperback: { price: "$49.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
        hardcover: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
      },
      IN: {
        paperback: { price: "₹1,499", shipping: "0", taxes: "0" },
        hardcover: { price: "₹1,999", shipping: "0", taxes: "0" },
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
  }
];

export const categoryColorMap: Record<string, string> = {
  
  "Celebration": "bg-rose-100 text-rose-800",      
  "Milestone": "bg-indigo-100 text-indigo-800",   
  "Growth": "bg-green-200 text-green-950",   

  "Inspiration": "bg-sky-100 text-sky-800",     
  "Confidence": "bg-teal-100 text-teal-800",      

  "Fantasy": "bg-purple-100 text-purple-800",    
  "Imagination": "bg-lime-100 text-lime-800",       

  "Adventure": "bg-orange-100 text-orange-800",     
  "Sci-Fi": "bg-pink-100 text-pink-800",         

  "Early Learning": "bg-yellow-100 text-yellow-800", 
  "Alphabet": "bg-red-100 text-red-800",            

  "Sports": "bg-green-100 text-green-800",           
  "Motivation": "bg-cyan-100 text-cyan-800",      
};


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
    "answer": `Each of our books is uniquely crafted to order, which requires a little extra time for printing and delivery. Here are the timelines:<br><br>
        <ul class="list-disc pl-6 space-y-1">
          <li>US – 12 to 16 days</li>
          <li>UK – 8 to 12 days</li>
          <li>Canada – 14 to 18 days</li>
          <li>India – 6 to 10 days</li>
        </ul>`
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