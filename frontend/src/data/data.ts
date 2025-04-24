interface CardProps {
    imageSrc: string;
    shortImg: string;
    title: string;
    category: "story" | "comic";
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
      category: "story",
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
      category: "story",
      bookKey: "astronaut",
      age: "4 - 10",
      description:
      "Blast off on a galactic adventure! Follow a brave astronaut exploring distant planets, alien life, and the wonders of outer space.",
      link: "https://abcd-book-sample.tiiny.site"
    },
    {
      imageSrc: "/wigu-book.jpg",
      shortImg: "/short-aayat.png",
      title: "When I Grow Up",
      category: "story",
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