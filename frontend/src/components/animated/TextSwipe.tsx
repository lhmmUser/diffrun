'use client';

import { useEffect, useState } from 'react';

interface TextSwipeProps {
  name: string;
}

const TextSwipe = ({ name }: TextSwipeProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    `✨ ${name}'s magical story begins here...`,
    "You can make unlimited refinements",
    "A high quality print will be delivered to your doorstep",
    "One-of-a-kind gift they'll cherish forever ❤️",
    `Every page is crafted just for ${name}!`,
    "This preview is just the beginning..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <span className="overflow-hidden">
      <span className="relative h-6 sm:h-8 md:h-10 flex items-center justify-center">
        {slides.map((slide, index) => (
          <span
            key={index}
            className={`absolute text-xs sm:text-sm md:text-base font-poppins font-thin text-center transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {slide}
          </span>
        ))}
      </span>
    </span>
  );
};

export default TextSwipe;