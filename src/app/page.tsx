import Image from "next/image";
import { FaInstagram, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";

export default function Home() {
  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen p-8">
      <main className="flex flex-col gap-8 items-center text-center">
        
        {/* DMG Logo */}
        <div className="mb-8">
          <Image
            src="/dmg-logo.webp"
            alt="DMG Logo"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>
        

        <p className="text-xl text-gray-600 dark:text-gray-300 italic">"Where Developers Become Together"</p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://lodos.sh/gdX2622AtC"
            target="_blank"
            rel="noopener noreferrer"
          >
            Modern iOS Bootcamp
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://etkinlik.devmultigroup.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Etkinlikler
          </a>
        </div>
        
        {/* Social Media Links */}
        <div className="flex gap-6 items-center justify-center mt-8">
          <a
            href="https://www.instagram.com/devmultigroup/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors duration-200 transform hover:scale-110"
            aria-label="Follow us on Instagram"
          >
            <FaInstagram size={24} />
          </a>
          <a
            href="https://twitter.com/devmultigroup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-400 transition-colors duration-200 transform hover:scale-110"
            aria-label="Follow us on Twitter"
          >
            <FaTwitter size={24} />
          </a>
          <a
            href="https://www.linkedin.com/company/developermultigroup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors duration-200 transform hover:scale-110"
            aria-label="Connect with us on LinkedIn"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://www.youtube.com/@devmultigroup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors duration-200 transform hover:scale-110"
            aria-label="Subscribe to our YouTube channel"
          >
            <FaYoutube size={24} />
          </a>
        </div>
      </main>
    </div>
  );
}
