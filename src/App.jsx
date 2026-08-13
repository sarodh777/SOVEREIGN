import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Auth pages (no sidebar)
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import OTPVerification from './pages/OTPVerification';
import ForgotPassword  from './pages/ForgotPassword';

// Authenticated pages (with sidebar)
import Dashboard         from './pages/Dashboard';
import BankingDashboard  from './pages/BankingDashboard';
import Transfer          from './pages/Transfer';
import Deposit           from './pages/Deposit';
import Withdraw          from './pages/Withdraw';
import TransactionHistory from './pages/TransactionHistory';
import Profile           from './pages/Profile';
import KYC               from './pages/KYC';
import BlockchainExplorer from './pages/BlockchainExplorer';
import AdminPanel        from './pages/AdminPanel';
import SmartTransfers    from './pages/SmartTransfers';
import FinancialScore    from './pages/FinancialScore';
import SecuritySettings  from './pages/SecuritySettings';

import './App.css';

// ── Private Route Guard ─────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// ── Admin Route Guard ────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('userRole');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'ROLE_ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Auth pages (full screen, no sidebar) ─────────────────────────────────────
const PUBLIC_PATHS = ['/', '/login', '/signup', '/otp', '/forgot-password'];

function AppLayout() {
  const location = useLocation();
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  return (
    <div className="app-container">
      {!isPublic && (
        <PrivateRoute>
          <Sidebar />
        </PrivateRoute>
      )}
      <main className={`main-content ${!isPublic ? 'with-sidebar' : ''}`}>
        <Routes>
          {/* Public */}
          <Route path="/"               element={<Login />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/otp"            element={<OTPVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected — User */}
          <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/banking"          element={<PrivateRoute><BankingDashboard /></PrivateRoute>} />
          <Route path="/transfer"         element={<PrivateRoute><Transfer /></PrivateRoute>} />
          <Route path="/deposit"          element={<PrivateRoute><Deposit /></PrivateRoute>} />
          <Route path="/withdraw"         element={<PrivateRoute><Withdraw /></PrivateRoute>} />
          <Route path="/transactions"     element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
          <Route path="/profile"          element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/kyc"              element={<PrivateRoute><KYC /></PrivateRoute>} />
          <Route path="/blockchain"       element={<PrivateRoute><BlockchainExplorer /></PrivateRoute>} />
          <Route path="/smart-transfers"  element={<PrivateRoute><SmartTransfers /></PrivateRoute>} />
          <Route path="/financial-score"  element={<PrivateRoute><FinancialScore /></PrivateRoute>} />
          <Route path="/security"         element={<PrivateRoute><SecuritySettings /></PrivateRoute>} />

          {/* Protected — Admin only */}
          <Route path="/admin"        element={<AdminRoute><AdminPanel /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
