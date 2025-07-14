'use client';

import { useEffect, useState } from 'react';

const AnnouncementCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    "Generate free instant preview in minutes",
    "Printing and Delivery across Canada, India, UK and US",
    "Create magical stories with your child as the hero",
    "Perfect gift for birthdays and special occasions",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); 

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="bg-[#5784ba] text-white py-5 overflow-hidden">
      <div className="flex items-center justify-center">
        {slides.map((slide, index) => (
          <p 
            key={index}
            className={`text-xs sm:text-sm md:text-lg font-libre font-thin text-center absolute transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {slide}
          </p>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementCarousel;