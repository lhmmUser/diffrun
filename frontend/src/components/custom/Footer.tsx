import Link from 'next/link';
import { FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const exploreLinks = {
    Home: '/',
    'Books for Kids': '/books',
  };

  const legalLinks = {
    'Privacy Policy': '/privacy-policy',
    'Terms of Service': '/terms-of-service',
    FAQ: '/faq',
  };

  return (
    <footer
      className="bg-[#f4cfdf] text-gray-900 py-16 border-t border-gray-300"
      aria-labelledby="footer-heading"
    >
      <div className="container mx-auto px-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
       
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="flex" aria-label="Go to Diffrun homepage">
            <img src="/logo.png" alt="Diffrun personalized books - logo" width="160" height="40" className="w-32 h-auto object-contain" />
          </Link>
            <p className="text-gray-800">
              Creating magical stories for curious minds. Personalized books that grow with your child's imagination.
            </p>

            <div className="flex space-x-4" aria-label="Social media links">
              {[
                { icon: FaTwitter, label: 'Twitter', link: 'https://x.com/diffrun' },
                { icon: FaInstagram, label: 'Instagram', link: 'https://www.instagram.com/diffrun_/' },
              ].map(({ icon: Icon, label, link }, index) => (
                <Link
                  key={index}
                  href={link}
                  aria-label={`Follow us on ${label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon
                    className="w-6 h-6 text-gray-800 hover:text-gray-900 transition-colors duration-300"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Explore</h3>
            <nav className="space-y-2" aria-label="Explore site pages">
              {Object.entries(exploreLinks).map(([label, href], index) => (
                <Link key={index} href={href} aria-label={`Visit ${label} page`}>
                  <span className="block text-gray-700 hover:text-gray-800 transition-colors duration-300">
                    {label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="col-span-1 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Legal</h3>
            <nav className="space-y-2" aria-label="Legal pages">
              {Object.entries(legalLinks).map(([label, href], index) => (
                <Link key={index} href={href} aria-label={`Read our ${label}`}>
                  <span className="block text-gray-700 hover:text-gray-800 transition-colors duration-300">
                    {label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <hr />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-700">
          <p>© 2025 Lighthouse Multimedia Private Limited. All rights reserved.</p>
          <div className="flex gap-4" aria-label="Footer legal navigation">
            <Link
              href="/privacy-policy"
              className="hover:text-gray-800 transition-colors duration-300"
              aria-label="Privacy Policy"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-gray-800 transition-colors duration-300"
              aria-label="Terms of Service"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;