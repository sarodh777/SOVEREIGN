import React from 'react';
import { 
  LayoutDashboard, LogOut, Wallet, Send, Download, Upload, Menu, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', active: isActive('/dashboard') },
    { icon: Wallet, label: 'Banking', path: '/banking', active: isActive('/banking') },
    { icon: Send, label: 'Transfer', path: '/transfer', active: isActive('/transfer') },
    { icon: Download, label: 'Deposit', path: '/deposit', active: isActive('/deposit') },
    { icon: Upload, label: 'Withdraw', path: '/withdraw', active: isActive('/withdraw') },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-[#1A1F2E] rounded-lg text-[#00F0FF] border border-[#00F0FF]/20"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#1A1F2E] to-[#0B0F14] border-r border-[#00F0FF]/10 flex flex-col transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo Area */}
        <div className="p-6 border-b border-[#00F0FF]/10">
          <h1 className="text-xl font-bold tracking-[0.2em] text-[#00F0FF]">SOVEREIGN</h1>
          <p className="text-[10px] uppercase text-[#718096] tracking-widest mt-1">Banking Platform v1.0</p>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-2 px-3">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group ${
                  item.active 
                    ? 'bg-[#0B0F14] text-[#00F0FF] border-l-2 border-[#00F0FF] shadow-[inset_0px_0px_10px_rgba(0,240,255,0.1)]' 
                    : 'text-[#A0AEC0] hover:text-[#E8EEF7] hover:bg-[#252C3C]'
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? 'text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
                <span className="font-medium tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-[#00F0FF]/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#A0AEC0] hover:text-[#FF006E] hover:bg-[#FF006E]/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium tracking-wide">Log Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spacer for desktop */}
      <div className="hidden md:block w-64" />
    </>
  );
}
