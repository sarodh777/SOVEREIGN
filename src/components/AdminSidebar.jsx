import React, { useState } from 'react';
import {
  LayoutDashboard, Users, ShieldAlert, FileCheck2, Activity,
  Database, AlertTriangle, ClipboardList, UserCog, Settings,
  LogOut, Menu, X, ChevronRight, Cpu, Fingerprint, Palette
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const role = localStorage.getItem('userRole') || 'ROLE_ADMIN';
  const name = localStorage.getItem('userName') || 'Administrator';
  const email = localStorage.getItem('userEmail') || 'admin@vaultchain.bank';
  const isSuperAdmin = role === 'ROLE_SUPER_ADMIN';

  const handleLogout = () => {
    ['token', 'userEmail', 'userName', 'userRole', 'userId', 'accountId'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const isActive = (path) => {
    if (path.includes('?tab=')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path) && !location.search);
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Admin Dashboard',        path: '/admin/dashboard' },
    { icon: Users,           label: 'User Management',        path: '/admin/users' },
    { icon: FileCheck2,      label: 'KYC Verification',       path: '/admin/kyc' },
    { icon: Activity,        label: 'Transaction Monitoring', path: '/admin/transactions' },
    { icon: Cpu,             label: 'AI Fraud Detection',     path: '/admin/fraud-detection' },
    { icon: Fingerprint,     label: 'Digital Signatures',     path: '/admin/digital-signatures' },
    { icon: ShieldAlert,     label: 'Security Monitoring',    path: '/admin/security' },
    { icon: Database,        label: 'Blockchain Records',     path: '/admin/blockchain' },
    { icon: AlertTriangle,   label: 'Suspicious Activity',    path: '/admin/suspicious-activity' },
    { icon: ClipboardList,   label: 'Audit Logs',             path: '/admin/audit-logs' },
    { icon: UserCog,         label: 'Admin Management',       path: '/admin/admin-management' },
    { icon: Palette,         label: 'Appearance',             path: '/admin/settings?tab=appearance' },
    { icon: Settings,        label: 'Settings',               path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
        className="fixed top-4 left-4 z-50 md:hidden p-2.5 bg-[#0C1342]/95 backdrop-blur-md rounded-xl text-[#A855F7] border border-[#7C3AED]/40 shadow-[0_0_15px_rgba(124,58,237,0.35)] hover:bg-[#111B57] transition-colors cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] border-r flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-2xl ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Brand Header */}
        <div className="p-5 border-b flex flex-col items-center relative overflow-hidden shrink-0"
             style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-xl border flex items-center justify-center p-2 shadow-md shrink-0"
                 style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
              <img src="/vaultchain-logo.svg" alt="VaultChain Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-wider flex items-center gap-1.5 truncate"
                  style={{ color: 'var(--text-primary)' }}>
                VAULT<span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--btn-primary-bg)' }}>CHAIN</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border truncate"
                      style={{ background: 'var(--btn-secondary-bg)', color: 'var(--accent-primary)', borderColor: 'var(--border-color)' }}>
                  {isSuperAdmin ? 'Super Admin' : 'Admin Control'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-mono font-bold"
               style={{ color: 'var(--text-muted)' }}>
            Core Administration
          </div>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer border-l-[3px] ${
                  active ? 'shadow-md' : 'border-transparent hover:opacity-90'
                }`}
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
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                        style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <span className="tracking-wide truncate">{item.label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />}
              </button>
            );
          })}
        </div>

        {/* Footer Admin Identity & Sign Out */}
        <div className="p-4 border-t shrink-0 mt-auto"
             style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl border shadow-sm"
               style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                 style={{ background: 'var(--btn-primary-bg)' }}>
              {email[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{name || 'Administrator'}</p>
              <p className="text-[10px] truncate font-mono" style={{ color: 'var(--text-muted)' }}>{email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/25 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className="hidden md:block w-[280px] shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
}
