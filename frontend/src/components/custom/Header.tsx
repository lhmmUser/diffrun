"use client";

import Link from "next/link";
import { useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "All Books", href: "/books" },
    { label: "FAQ", href: "/faq" },
    { label: "About Us", href: "/team" }
  ];

  return (
    <>
      <header className="w-full z-20">
        <div className="py-4 px-4 md:px-30 lg:px-50 flex justify-between items-center">
          <Link href="/" className="flex justify-center items-center" aria-label="Go to Diffrun homepage">
            <img src="/logo.png" alt="Diffrun personalized books - logo" width="160" height="40" className="w-32 h-auto object-contain ml-2 md:ml-10" />
          </Link>

          <nav className="hidden md:flex gap-8 text-lg font-poppins mr-2 md:mr-10" role="navigation" aria-label="Main navigation">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="relative group text-gray-700 hover:text-indigo-500 transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300 ${index % 2 === 0 ? "bg-indigo-500" : "bg-purple-500"
                    }`}
                ></span>
              </Link>
            ))}
          </nav>

          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 text-xl focus:outline-none rounded-lg hover:bg-gray-200"
            aria-label="Open main menu"
          >
            <RxHamburgerMenu />
          </button>
        </div>
      </header>

      <aside
        className={`fixed top-0 right-0 z-50 w-64 h-screen bg-white shadow-lg transform ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 ease-in-out border-l border-gray-200`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={toggleSidebar}
            className="text-gray-800 focus:outline-none p-2 rounded-lg hover:bg-gray-200"
            aria-label="Close main menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="mt-6 flex flex-col space-y-4 px-6 text-center">
          {menuItems.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              {index > 0 && <hr className="w-full border-t border-gray-300 my-2" />}
              <Link
                href={item.href}
                onClick={toggleSidebar}
                className="w-full text-lg font-poppins text-center text-gray-700 hover:text-indigo-500 transition-colors duration-300 py-3 rounded-lg hover:bg-gray-100"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-opacity-50"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Header;