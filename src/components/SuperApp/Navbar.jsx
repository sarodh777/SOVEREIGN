import React from 'react';
import { ShoppingCart, Search, Menu, Sparkles } from 'lucide-react';

const Navbar = ({ cartItemCount, onCartClick }) => {
  return (
    <nav className="sticky top-0 z-40 w-full bg-[#0B1550]/95 backdrop-blur-md text-[#F8FAFC] border-b border-[#8B92FF]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Menu className="h-6 w-6 sm:hidden cursor-pointer text-[#356BFF]" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#713BFF]" />
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-[#356BFF] via-[#713BFF] to-[#EC4899] bg-clip-text text-transparent">
                SUPER APP
              </h1>
            </div>
          </div>
          
          <div className="flex-1 max-w-xl px-4 hidden sm:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#8B92FF]/60" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2 border border-[#8B92FF]/25 rounded-xl leading-5 bg-[#050B2E] text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] sm:text-xs transition-colors duration-200"
                placeholder="Search products, services, utilities..."
              />
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={onCartClick}
              className="relative p-2.5 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 border border-[#8B92FF]/25 text-[#F8FAFC] transition cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5 text-[#356BFF]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-gradient-to-r from-[#EC4899] to-[#713BFF] rounded-full shadow-md">
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
