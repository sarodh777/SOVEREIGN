import React from 'react';
import { ShoppingCart, Search, Menu } from 'lucide-react';

const Navbar = ({ cartItemCount, onCartClick }) => {
  return (
    <nav className="sticky top-0 z-40 w-full bg-[#0A192F] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6 sm:hidden cursor-pointer" />
            <h1 className="text-2xl font-bold tracking-wider text-[#00F0FF]">SUPER APP</h1>
          </div>
          
          <div className="flex-1 max-w-xl px-4 hidden sm:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full leading-5 bg-[#112240] text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:text-gray-900 sm:text-sm transition-colors duration-300"
                placeholder="Search products, services..."
              />
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={onCartClick}
              className="relative p-2 rounded-full hover:bg-[#112240] transition-colors duration-200"
            >
              <ShoppingCart className="h-6 w-6 text-white" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
