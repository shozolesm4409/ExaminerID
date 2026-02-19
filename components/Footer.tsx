import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Exam Scripts Portal</h3>
          <p className="text-gray-400 text-sm">Managing examination processes efficiently.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#/notice" className="hover:text-white">Notices</a></li>
            <li><a href="#/faq" className="hover:text-white">FAQ</a></li>
            <li><a href="#/campus" className="hover:text-white">Campuses</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <p className="text-sm text-gray-400">Email: support@examportal.com</p>
          <p className="text-sm text-gray-400">Helpline: +880 1234 567890</p>
        </div>
      </div>
      <div className="text-center text-gray-500 text-xs mt-8 border-t border-gray-700 pt-4">
        &copy; {new Date().getFullYear()} Exam Scripts Portal. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;