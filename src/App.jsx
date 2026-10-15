import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import VaultyAssistant from './components/VaultyAssistant';

// Auth pages (no sidebar)
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import OTPVerification from './pages/OTPVerification';
import ForgotPassword  from './pages/ForgotPassword';
import OAuth2Success from './pages/OAuth2Success';

// Authenticated pages — User Operations
import Dashboard         from './pages/Dashboard';
import BankingDashboard  from './pages/BankingDashboard';
import Transfer          from './pages/Transfer';
import InternationalTransfer from './pages/InternationalTransfer';
import Deposit           from './pages/Deposit';
import TransactionHistory from './pages/TransactionHistory';
import Profile           from './pages/Profile';
import KYC               from './pages/KYC';
import BlockchainExplorer from './pages/BlockchainExplorer';
import SmartTransfers    from './pages/SmartTransfers';
import FinancialScore    from './pages/FinancialScore';
import SecuritySettings  from './pages/SecuritySettings';

// Authenticated pages — Separated Admin Panel
import AdminDashboard         from './pages/admin/AdminDashboard';
import UserManagement         from './pages/admin/UserManagement';
import UserDetails            from './pages/admin/UserDetails';
import KycVerification        from './pages/admin/KycVerification';
import TransactionMonitoring  from './pages/admin/TransactionMonitoring';
import SecurityMonitoring     from './pages/admin/SecurityMonitoring';
import BlockchainRecords      from './pages/admin/BlockchainRecords';
import SuspiciousActivity     from './pages/admin/SuspiciousActivity';
import AuditLogs              from './pages/admin/AuditLogs';
import AdminManagement        from './pages/admin/AdminManagement';
import AdminSettings          from './pages/admin/AdminSettings';
import FraudDetection         from './pages/admin/FraudDetection';
import DigitalSignatureRecords from './pages/admin/DigitalSignatureRecords';

import './App.css';
import { ThemeProvider } from './context/ThemeContext';

// ── Private Route Guard ──────────────────────────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// ── Admin Route Guard (Strict Role Check) ────────────────────
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('userRole');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'ROLE_ADMIN' && role !== 'ROLE_SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// ── Auth pages (full screen, no sidebar) ─────────────────────
const PUBLIC_PATHS = ['/', '/login', '/signup', '/otp', '/forgot-password', '/oauth2-success'];

function AppLayout() {
  const location = useLocation();
  const isPublic = PUBLIC_PATHS.includes(location.pathname);
  const isAdmin = location.pathname.startsWith('/admin');

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(() => {
    return localStorage.getItem('vc_hide_balance') === 'true';
  });

  const handleToggleBalance = () => {
    setIsBalanceHidden(prev => {
      const next = !prev;
      localStorage.setItem('vc_hide_balance', String(next));
      window.dispatchEvent(new CustomEvent('vaultchain-balance-visibility', { detail: { hidden: next } }));
      return next;
    });
  };

  useEffect(() => {
    window.__openCommandPalette = () => setIsCommandPaletteOpen(true);
    return () => {
      delete window.__openCommandPalette;
    };
  }, []);

  return (
    <div className="app-container">
      {!isPublic && (
        isAdmin ? (
          <AdminRoute>
            <AdminSidebar />
          </AdminRoute>
        ) : (
          <PrivateRoute>
            <Sidebar />
          </PrivateRoute>
        )
      )}
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {!isPublic && (
          <TopBar
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            isBalanceHidden={isBalanceHidden}
            onToggleBalanceVisibility={handleToggleBalance}
          />
        )}

        <main className={`main-content ${!isPublic ? 'with-sidebar' : ''}`}>
          <Routes>
            {/* Public Authentication Flow */}
            <Route path="/"               element={<Login />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/signup"         element={<Signup />} />
            <Route path="/otp"            element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected — Normal User Banking Operations */}
            <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/banking"          element={<PrivateRoute><BankingDashboard /></PrivateRoute>} />
            <Route path="/transfer"         element={<PrivateRoute><Transfer /></PrivateRoute>} />
            <Route path="/international"    element={<PrivateRoute><InternationalTransfer /></PrivateRoute>} />
            <Route path="/deposit"          element={<PrivateRoute><Deposit /></PrivateRoute>} />
            <Route path="/transactions"     element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
            <Route path="/profile"          element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/kyc"              element={<PrivateRoute><KYC /></PrivateRoute>} />
            <Route path="/blockchain"       element={<PrivateRoute><BlockchainExplorer /></PrivateRoute>} />
            <Route path="/smart-transfers"  element={<PrivateRoute><SmartTransfers /></PrivateRoute>} />
            <Route path="/financial-score"  element={<PrivateRoute><FinancialScore /></PrivateRoute>} />
            <Route path="/security"         element={<PrivateRoute><SecuritySettings defaultTab="security" /></PrivateRoute>} />
            <Route path="/settings"         element={<PrivateRoute><SecuritySettings defaultTab="appearance" /></PrivateRoute>} />

            {/* Protected — Completely Separated Admin Panel (NO Banking Operations) */}
            <Route path="/admin"                     element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users"               element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/admin/users/:id"           element={<AdminRoute><UserDetails /></AdminRoute>} />
            <Route path="/admin/kyc"                 element={<AdminRoute><KycVerification /></AdminRoute>} />
            <Route path="/admin/transactions"        element={<AdminRoute><TransactionMonitoring /></AdminRoute>} />
            <Route path="/admin/fraud-detection"     element={<AdminRoute><FraudDetection /></AdminRoute>} />
            <Route path="/admin/digital-signatures"  element={<AdminRoute><DigitalSignatureRecords /></AdminRoute>} />
            <Route path="/admin/security"            element={<AdminRoute><SecurityMonitoring /></AdminRoute>} />
            <Route path="/admin/blockchain"          element={<AdminRoute><BlockchainRecords /></AdminRoute>} />
            <Route path="/admin/suspicious-activity" element={<AdminRoute><SuspiciousActivity /></AdminRoute>} />
            <Route path="/admin/audit-logs"          element={<AdminRoute><AuditLogs /></AdminRoute>} />
            <Route path="/admin/admin-management"    element={<AdminRoute><AdminManagement /></AdminRoute>} />
            <Route path="/admin/settings"            element={<AdminRoute><AdminSettings /></AdminRoute>} />
            {/* OAuth2 Google Login Success Handler */}
            <Route path="/oauth2-success" element={<OAuth2Success />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToggleBalanceVisibility={handleToggleBalance}
        isBalanceHidden={isBalanceHidden}
      />

      {/* Floating AI Navigation Assistant */}
      <VaultyAssistant />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
