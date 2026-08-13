import React, { useState } from 'react';
import {
  LayoutDashboard, LogOut, Wallet, Send, Download, Upload, Menu, X,
  User, ShieldCheck, Link as LinkIcon, History, Shield, Zap, Award, Lock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);

  const role     = localStorage.getItem('userRole') || '';
  const name     = localStorage.getItem('userName') || '';
  const email    = localStorage.getItem('userEmail') || '';
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : email[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    ['token','userEmail','userName','userRole','userId','accountId'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard' },
    { icon: Wallet,          label: 'Banking',         path: '/banking' },
    { icon: Send,            label: 'Transfer',        path: '/transfer' },
    { icon: Download,        label: 'Deposit',         path: '/deposit' },
    { icon: Upload,          label: 'Withdraw',        path: '/withdraw' },
    { icon: History,         label: 'Transactions',    path: '/transactions' },
    { icon: Zap,             label: 'Smart Transfers', path: '/smart-transfers' },
    { icon: Award,           label: 'Financial Score', path: '/financial-score' },
    { icon: Lock,            label: 'Security',        path: '/security' },
    { icon: LinkIcon,        label: 'Blockchain',      path: '/blockchain' },
    { icon: ShieldCheck,     label: 'KYC',             path: '/kyc' },
    { icon: User,            label: 'Profile',         path: '/profile' },
    ...(role === 'ROLE_ADMIN' ? [{ icon: Shield, label: 'Admin Panel', path: '/admin' }] : []),
  ];

  const NavButton = ({ item }) => (
    <button
      onClick={() => { navigate(item.path); setOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all group ${
        isActive(item.path)
          ? 'bg-[#0B0F14] text-[#00F0FF] border-l-2 border-[#00F0FF] pl-3.5 shadow-[inset_0px_0px_10px_rgba(0,240,255,0.08)]'
          : 'text-[#A0AEC0] hover:text-[#E8EEF7] hover:bg-[#252C3C]'
      } ${item.label === 'Admin Panel' ? '!text-[#FF006E] hover:!bg-[#FF006E]/10' : ''}`}
    >
      <item.icon className={`w-4 h-4 shrink-0 ${isActive(item.path) ? 'text-[#00F0FF] drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]' : ''} ${item.label === 'Admin Panel' ? '!text-[#FF006E]' : ''}`} />
      <span className="font-medium tracking-wide">{item.label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-[#1A1F2E] rounded-lg text-[#00F0FF] border border-[#00F0FF]/20"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#1A1F2E] to-[#0B0F14] border-r border-[#00F0FF]/10 flex flex-col z-40 transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-5 border-b border-[#00F0FF]/10 flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-[#00F0FF] to-[#00B8CC] rounded-xl flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <img src="/vaultchain-logo.svg" alt="VaultChain" className="w-9 h-9 brightness-0" onError={e => e.target.style.display='none'} />
            <Shield className="w-7 h-7 text-[#0B0F14] absolute" style={{display:'none'}} />
          </div>
          <h1 className="text-lg font-black tracking-[0.25em] text-[#00F0FF]">SOVEREIGN</h1>
          <p className="text-[10px] uppercase text-[#718096] tracking-widest mt-0.5">Banking Platform v2.0</p>
        </div>

        {/* User Badge */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 bg-[#0B0F14]/50 rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#FF006E] flex items-center justify-center text-[#0B0F14] font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[#E8EEF7] text-xs font-semibold truncate">{name || 'User'}</p>
              <p className="text-[#718096] text-[10px] truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(item => <NavButton key={item.path} item={item} />)}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-[#00F0FF]/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#A0AEC0] hover:text-[#FF006E] hover:bg-[#FF006E]/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={() => setOpen(false)} />}

      {/* Desktop spacer */}
      <div className="hidden md:block w-64 shrink-0" />
    </>
  );
}
