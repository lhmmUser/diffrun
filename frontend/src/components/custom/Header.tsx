"use client";

import Link from "next/link";
import { useState } from "react";

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Books for Kids", href: "/books" },
    { label: "FAQ", href: "/faq"}
  ];

  return (
    <>
      <header className="w-full bg-gray-100 shadow-md border-b border-gray-300 z-20">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <Link href="/" className="flex justify-center items-center">
          <img src="/gradient.png" alt="logo" className="w-40 h-auto object-contain" />
          </Link>

          <nav className="hidden md:flex gap-8 text-lg font-medium">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="relative group text-gray-600 font-serif hover:text-indigo-500 transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300 ${
                    index % 2 === 0 ? "bg-indigo-500" : "bg-purple-500"
                  }`}
                ></span>
              </Link>
            ))}
          </nav>

          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-400 focus:outline-none p-2 rounded-lg hover:bg-gray-200"
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
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </header>

      <aside
        className={`fixed top-0 right-0 z-50 w-64 h-screen bg-white shadow-lg transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out border-l border-gray-200`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={toggleSidebar}
            className="text-gray-800 focus:outline-none p-2 rounded-lg hover:bg-gray-200"
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
                className="w-full text-lg font-medium text-center text-gray-700 hover:text-indigo-500 transition-colors duration-300 py-3 rounded-lg hover:bg-gray-100"
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
