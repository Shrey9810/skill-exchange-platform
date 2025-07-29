import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = (id) => {
    // If we are not on the homepage, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Use a timeout to allow the page to navigate before scrolling
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // If already on the homepage, just scroll
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Copyright */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" onClick={scrollToTop} className="flex items-center space-x-2 mb-4">
              <svg className="h-8 w-8 text-indigo-600" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-2xl font-bold text-gray-800">SkillSwap</span>
            </Link>
            <p className="text-sm text-gray-500">
              &copy; {currentYear} SkillSwap. All Rights Reserved.
            </p>
          </div>
          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Navigation</h3>
            <ul className="mt-4 space-y-2">
              <li><button onClick={scrollToTop} className="text-base text-gray-500 hover:text-gray-900">Marketplace</button></li>
              <li><button onClick={() => handleScroll('about')} className="text-base text-gray-500 hover:text-gray-900">About Us</button></li>
              <li><button onClick={() => handleScroll('contact')} className="text-base text-gray-500 hover:text-gray-900">Contact</button></li>
            </ul>
          </div>
          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy Policy</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms of Service</a></li>
            </ul>
          </div>
          {/* Social Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Connect</h3>
            <div className="flex space-x-6 mt-4">
              <a href="https://github.com/Shrey9810" target="_blank" class="text-gray-400 hover:text-gray-500"><span class="sr-only">GitHub</span><svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg></a>
              <a href="https://www.linkedin.com/in/shreyash-chaudhary-8755632a6" target="_blank" class="text-gray-400 hover:text-gray-500"><span class="sr-only">LinkedIn</span><svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.75A1.75 1.75 0 118.25 5 1.75 1.75 0 016.5 6.75zM19 19h-3v-5.01c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94V19H10V8h3v1.7h.04c.46-.77 1.37-1.57 3.03-1.57 3.23 0 3.84 2.13 3.84 4.9V19z" clipRule="evenodd" /></svg></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
