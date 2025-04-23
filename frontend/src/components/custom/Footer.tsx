import Link from 'next/link';
import { FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {

  const exploreLinks = {
    Home: '/',
    'Books for Kids': '/books',
    'About Us': '/about',
    'Contact Us': '/contact',
  };

  const legalLinks = {
    'Privacy Policy': '/privacy-policy',
    'Terms of Service': '/terms-of-service',
  };

  return (
    <footer className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-gray-900 py-16 border-t border-gray-300">
      <div className="container mx-auto px-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient">
              DIFFRUN
            </h2>
            <p className="text-gray-800">
              Creating magical stories for curious minds. Personalized books that grow with your child&apos;s imagination.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: FaTwitter, link: 'https://x.com/diffrun' },
                { icon: FaInstagram, link: 'https://www.instagram.com/diffrun_/' },
              ].map(({ icon: Icon, link }, index) => (
                <Link key={index} href={link} target="_blank" rel="noopener noreferrer">
                  <Icon
                    className="w-6 h-6 text-gray-800 hover:text-indigo-700 transition-colors duration-300"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Explore</h3>
            <nav className="space-y-2">
              {Object.entries(exploreLinks).map(([item, href], index) => (
                <Link key={index} href={href}>
                  <span className="block text-gray-700 hover:text-indigo-700 transition-colors duration-300">
                    {item}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="col-span-1 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Legal</h3>
            <nav className="space-y-2">
              {Object.entries(legalLinks).map(([item, href], index) => (
                <Link key={index} href={href}>
                  <span className="block text-gray-700 hover:text-purple-700 transition-colors duration-300">
                    {item}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <hr />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600">
          <p>© 2025 Diffrun. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-indigo-700 transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-purple-700 transition-colors duration-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;