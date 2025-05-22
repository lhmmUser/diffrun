interface CardProps {
  imageSrc: string;
  shortImg: string;
  title: string;
  bookKey: string;
  age: string;
  description?: string;
  link?: string;
}

export const Cards: CardProps[] = [
  {
    imageSrc: "/abcd-book.jpg",
    shortImg: "/short-aayat.png",
    title: "My A to Z Quest",
    bookKey: "abcd",
    age: "2 - 4",
    description:
      "An engaging and colorful storybook that introduces the alphabet through fun characters, vibrant illustrations, and playful rhymes that kids love.",
    link: "https://diffrunassets.s3.ap-south-1.amazonaws.com/ABCD_Book.pdf"
  },
  {
    imageSrc: "/astronaut-book.jpg",
    shortImg: "/short-kush.png",
    title: "Astronaut in Space",
    bookKey: "astro",
    age: "4 - 10",
    description:
      "Blast off on a galactic adventure! Follow a brave astronaut exploring distant planets, alien life, and the wonders of outer space.",
    link: "https://diffrunassets.s3.ap-south-1.amazonaws.com/astronaut_book.pdf"
  },
  {
    imageSrc: "/wigu-book.png",
    shortImg: "/short-aayat.png",
    title: "When I Grow Up",
    bookKey: "wigu",
    age: "3 - 7",
    description:
      "An inspiring journey through childhood dreams—join curious kids as they explore exciting careers, big dreams, and how imagination leads the way.",
    link: "https://abcd-book-sample.tiiny.site"
  },
  // {
  //   imageSrc: "/White.jpg",
  //   shortImg: "/short-kush.png",
  //   title: "Test Book",
  //   category: "story",
  //   bookKey: "test",
  //   age: "2 - 10",
  //   description: "Test Book"
  // },
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
    "answer": "🇮🇳 India • Paperback – ₹1,500 📄 • Hardcover – ₹2,000 📘 Shipping included 🎯 | 🇺🇸 United States • Paperback – $39.99 📖 • Hardcover – $54.99 📘 Shipping: $7.99 🚚 | 🇬🇧 United Kingdom • Paperback – £29.77 📖 • Hardcover – £39.99 📘 Shipping: £4.99 🚚"
  },
  {
    "id": "ordering-multiple",
    "question": "📦 Ordering Multiple Books",
    "answer": "Currently, our system allows you to create and order one book per transaction. If you'd like to order more than one, kindly place separate orders for each book."
  }
]