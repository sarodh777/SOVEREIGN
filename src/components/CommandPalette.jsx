import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, LayoutDashboard, Landmark, Send, ArrowDownLeft,
  History, ShieldCheck, Cpu, Database, Award, User, Lock, Eye, EyeOff,
  Bell, FileText, CheckCircle2, ChevronRight, X, ShieldAlert, Sparkles, Globe
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onToggleBalanceVisibility, isBalanceHidden }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('userRole') === 'ROLE_ADMIN' || localStorage.getItem('userRole') === 'ROLE_SUPER_ADMIN';

  const userActions = [
    { id: 'dash', title: 'Dashboard', category: 'Navigation', icon: LayoutDashboard, route: '/dashboard', keywords: 'home overview balance metrics' },
    { id: 'bank', title: 'Banking & Accounts', category: 'Navigation', icon: Landmark, route: '/banking', keywords: 'accounts cards statement' },
    { id: 'transfer', title: 'Send Money (Transfer)', category: 'Actions', icon: Send, route: '/transfer', keywords: 'pay transfer send money recipient wire' },
    { id: 'intl', title: 'International Wire Transfer', category: 'Actions', icon: Globe, route: '/international', keywords: 'international cross border wire swift forex currency exchange remittance usd eur gbp aed sgd' },
    { id: 'deposit', title: 'Deposit Funds', category: 'Actions', icon: ArrowDownLeft, route: '/deposit', keywords: 'add money deposit funds topup' },
    { id: 'history', title: 'Transaction History', category: 'Navigation', icon: History, route: '/transactions', keywords: 'logs transactions past activity' },
    { id: 'blockchain', title: 'Blockchain Explorer', category: 'Blockchain', icon: Database, route: '/blockchain', keywords: 'ledger smart contract blocks hash hardhat' },
    { id: 'smart', title: 'AI Smart Transfers', category: 'AI Automation', icon: Cpu, route: '/smart-transfers', keywords: 'automation recurring rules agent payments' },
    { id: 'score', title: 'Financial Credit Score', category: 'Analytics', icon: Award, route: '/financial-score', keywords: 'rating credit score health insights' },
    { id: 'sec', title: 'Security & 2FA', category: 'Security', icon: Lock, route: '/security', keywords: 'password otp 2fa devices digital signature' },
    { id: 'kyc', title: 'Identity Verification (KYC)', category: 'Security', icon: ShieldCheck, route: '/kyc', keywords: 'kyc document verify passport id' },
    { id: 'profile', title: 'User Profile', category: 'Settings', icon: User, route: '/profile', keywords: 'profile email avatar account details' },
    {
      id: 'toggle-bal',
      title: isBalanceHidden ? 'Show Account Balance' : 'Hide Account Balance',
      category: 'Privacy',
      icon: isBalanceHidden ? Eye : EyeOff,
      action: () => {
        if (onToggleBalanceVisibility) onToggleBalanceVisibility();
        onClose();
      },
      keywords: 'hide show privacy balance eye obfuscate'
    }
  ];

  const adminActions = [
    { id: 'adm-dash', title: 'Admin Dashboard', category: 'Admin', icon: LayoutDashboard, route: '/admin/dashboard', keywords: 'admin overview metrics control' },
    { id: 'adm-users', title: 'User Management', category: 'Admin', icon: User, route: '/admin/users', keywords: 'customers accounts freeze unfreeze' },
    { id: 'adm-kyc', title: 'KYC Document Approval', category: 'Admin', icon: ShieldCheck, route: '/admin/kyc', keywords: 'verify approve reject kyc' },
    { id: 'adm-txs', title: 'Transaction Monitoring', category: 'Admin', icon: History, route: '/admin/transactions', keywords: 'monitor audit transactions' },
    { id: 'adm-fraud', title: 'AI Fraud Detection Center', category: 'Admin AI', icon: ShieldAlert, route: '/admin/fraud-detection', keywords: 'fraud risk alerts ai defense anomalies' },
    { id: 'adm-sigs', title: 'Digital Signature Records', category: 'Admin Security', icon: Lock, route: '/admin/digital-signatures', keywords: 'ecdsa p256 signatures cryptographic proof' },
    { id: 'adm-sec', title: 'Security Monitoring', category: 'Admin Security', icon: Lock, route: '/admin/security', keywords: 'attacks attempts logins ip rate limit' },
    { id: 'adm-chain', title: 'Blockchain Records', category: 'Admin Blockchain', icon: Database, route: '/admin/blockchain', keywords: 'ledger smart contract blocks logs' },
    { id: 'adm-audit', title: 'Audit Trail Logs', category: 'Admin Audit', icon: FileText, route: '/admin/audit-logs', keywords: 'compliance trail audit logs' }
  ];

  const allActions = isAdmin ? [...userActions, ...adminActions] : userActions;

  const filtered = allActions.filter(item => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (window.__openCommandPalette) window.__openCommandPalette();
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeAction(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  const executeAction = (item) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050720]/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0C1342] border border-[#7C3AED]/40 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.35)] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#8B92FF]/20 bg-[#10164A]/60">
          <Search className="w-5 h-5 text-[#A855F7] mr-3 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page name, or financial action..."
            className="flex-1 bg-transparent text-white placeholder-[#7E8DC4] text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1.5 ml-3">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#172368] text-[#B8C5F2] border border-[#8B92FF]/20">
              ESC
            </span>
            <button 
              onClick={onClose}
              className="p-1 text-[#7E8DC4] hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#7E8DC4] text-xs">
              No actions match "<span className="text-white font-medium">{query}</span>"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeAction(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#4169FF]/30 to-[#7C3AED]/35 border border-[#7C3AED]/50 text-white shadow-md'
                      : 'text-[#B8C5F2] hover:bg-[#10164A]/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-[#172368] text-[#A855F7]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-[10px] text-[#7E8DC4]">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="text-[10px] font-mono text-[#A855F7] flex items-center gap-1">
                        Select <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-[#080C2E] border-t border-[#8B92FF]/15 flex items-center justify-between text-[11px] text-[#7E8DC4]">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-[#10164A] text-white font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[#10164A] text-white font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[#10164A] text-white font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <div className="flex items-center gap-1 text-[#A855F7] font-medium">
            <Sparkles className="w-3 h-3" /> VAULTCHAIN 3.0 Command
          </div>
        </div>
      </div>
    </div>
  );
}
