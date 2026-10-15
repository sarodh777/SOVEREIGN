import React, { useState } from 'react';
import {
  LayoutDashboard, LogOut, Wallet, Send, Download, Menu, X,
  User, ShieldCheck, Link as LinkIcon, History, Shield, Zap, Award, Lock, Sparkles, Globe
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
    { icon: Globe,           label: 'International',   path: '/international' },
    { icon: Download,        label: 'Deposit',         path: '/deposit' },
    { icon: History,         label: 'Transactions',    path: '/transactions' },
    { icon: Zap,             label: 'Smart Transfers', path: '/smart-transfers' },
    { icon: Award,           label: 'Financial Score', path: '/financial-score' },
    { icon: Lock,            label: 'Security & 2FA',  path: '/security' },
    { icon: Sparkles,        label: 'Appearance',      path: '/settings' },
    { icon: LinkIcon,        label: 'Blockchain',      path: '/blockchain' },
    { icon: ShieldCheck,     label: 'KYC Verification',path: '/kyc' },
    { icon: User,            label: 'Profile',         path: '/profile' },
    ...(role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN' ? [{ icon: Shield, label: 'Admin Portal', path: '/admin/dashboard' }] : []),
  ];

  const NavButton = ({ item }) => {
    const active = isActive(item.path);
    return (
      <button
        onClick={() => { navigate(item.path); setOpen(false); }}
        className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all group border-l-[3px] cursor-pointer ${
          active
            ? 'shadow-md'
            : 'border-transparent hover:opacity-90'
        } ${item.label === 'Admin Portal' ? '!text-[var(--accent-primary)]' : ''}`}
        style={
          active
            ? {
                background: 'var(--nav-active-bg)',
                borderColor: 'var(--nav-active-border)',
                color: 'var(--nav-active-text)',
              }
            : {
                color: 'var(--text-secondary)',
              }
        }
      >
        <item.icon className="w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110"
                   style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
        <span className="tracking-wide truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl border shadow-lg cursor-pointer"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--accent-primary)',
          borderColor: 'var(--border-color)',
        }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-[280px] border-r flex flex-col z-40 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Logo */}
        <div className="p-5 border-b flex flex-col items-center"
             style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-13 h-13 rounded-2xl border p-2 flex items-center justify-center mb-2.5 shadow-md"
               style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <img src="/vaultchain-logo.svg" alt="VaultChain Logo" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-lg font-black tracking-[0.22em] leading-tight flex items-center"
              style={{ color: 'var(--text-primary)' }}>
            VAULT<span className="text-transparent bg-clip-text"
                        style={{ backgroundImage: 'var(--btn-primary-bg)' }}>CHAIN</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em]"
                  style={{ color: 'var(--accent-primary)' }}>FINTECH 3.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* User Badge */}
        <div className="px-3.5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border shadow-sm"
               style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm"
                 style={{ background: 'var(--btn-primary-bg)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{name || 'User'}</p>
              <p className="text-[10px] truncate mt-0.5 leading-tight font-mono" style={{ color: 'var(--text-muted)' }}>{email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
          {navItems.map(item => <NavButton key={item.path} item={item} />)}
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/70 md:hidden z-30 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Desktop spacer */}
      <div className="hidden md:block w-[280px] shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
}
