import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Eye, EyeOff, ShieldCheck, Cpu, Database,
  CheckCircle2, AlertTriangle, X, ExternalLink, Sparkles, User, RefreshCw, Palette
} from 'lucide-react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

export default function TopBar({
  onOpenCommandPalette,
  isBalanceHidden,
  onToggleBalanceVisibility,
  onToggleMobileMenu
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(2);
  const userEmail = localStorage.getItem('userEmail') || 'user@vaultchain.com';
  const userName = localStorage.getItem('userName') || userEmail.split('@')[0];
  const userRole = localStorage.getItem('userRole') || 'ROLE_USER';

  // Load real user activity for the notification center
  useEffect(() => {
    const fetchRecentAlerts = async () => {
      try {
        const accountId = localStorage.getItem('accountId');
        const notifs = [
          {
            id: 'n1',
            title: 'ECDSA P-256 Engine Ready',
            desc: 'Client-side cryptographic keypair generated and validated.',
            time: '2m ago',
            type: 'security',
            unread: true
          },
          {
            id: 'n2',
            title: 'Hardhat EVM Node Active',
            desc: 'Local consensus engine synced with BankLedger contract.',
            time: '5m ago',
            type: 'blockchain',
            unread: true
          }
        ];

        if (accountId) {
          const res = await api.get(`/api/banking/transactions/${accountId}`);
          if (res.data?.success && res.data.transactions?.length > 0) {
            const latestTx = res.data.transactions[0];
            notifs.unshift({
              id: `tx-${latestTx.id}`,
              title: `${latestTx.direction === 'IN' ? 'Funds Received' : 'Transfer Processed'}`,
              desc: `₹${Number(latestTx.amount).toLocaleString('en-IN')} — ${latestTx.reference || 'Standard Transfer'}`,
              time: new Date(latestTx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'transaction',
              unread: false
            });
          }
        }
        setNotifications(notifs);
      } catch (err) {
        // Fallback default notifications
      }
    };
    fetchRecentAlerts();
  }, []);

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 w-full h-16 backdrop-blur-xl border-b px-4 sm:px-6 flex items-center justify-between transition-all"
            style={{ background: 'var(--topbar-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
      {/* Left Search / Command Palette Trigger */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <span className="sr-only">Open menu</span>
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-current rounded" />
              <span className="w-full h-0.5 bg-current rounded" />
              <span className="w-full h-0.5 bg-current rounded" />
            </div>
          </button>
        )}

        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition shadow-sm cursor-pointer group"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <Search className="w-3.5 h-3.5 text-[var(--accent-primary)] group-hover:scale-110 transition" />
          <span className="hidden sm:inline">Search transactions, pages, commands...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border"
               style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Quick Shortcut Pill */}
        <button
          onClick={() => {
            const isAdmin = location.pathname.startsWith('/admin');
            navigate(isAdmin ? '/admin/settings?tab=appearance' : '/settings');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold hover:opacity-90"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          title="Customize Theme & Fonts"
        >
          <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="hidden md:inline capitalize">{theme.replace('-', ' ')}</span>
        </button>

        {/* Blockchain Status Indicator Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border"
             style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>EVM Ledger Synced</span>
        </div>

        {/* Balance Visibility Toggle */}
        <button
          onClick={onToggleBalanceVisibility}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-xs font-medium"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title={isBalanceHidden ? "Show financial balances" : "Hide sensitive financial balances"}
        >
          {isBalanceHidden ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden md:inline text-[11px]">Hidden</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden md:inline text-[11px]">Visible</span>
            </>
          )}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(prev => !prev)}
            className="relative p-2 rounded-xl border transition cursor-pointer"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-highlight)] ring-2 ring-[var(--bg-primary)] animate-pulse" />
            )}
          </button>

          {/* Notifications Flyout Drawer */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-card border shadow-2xl p-4 z-50 animate-in fade-in duration-150"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between border-b pb-3 mb-3"
                   style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Fintech Activity Center</h4>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl border text-xs transition"
                    style={{
                      background: notif.unread ? 'var(--bg-elevated)' : 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        {notif.type === 'security' && <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                        {notif.type === 'blockchain' && <Database className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                        {notif.type === 'transaction' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">{notif.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Profile Avatar Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
               style={{ background: 'var(--btn-primary-bg)' }}>
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{userName}</div>
            <div className="text-[10px] font-mono leading-tight" style={{ color: 'var(--accent-primary)' }}>
              {userRole === 'ROLE_ADMIN' ? 'SUPERVISOR' : 'VERIFIED ACC'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
