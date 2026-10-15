import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare, X, Minus, Sparkles, Send, ArrowRight,
  Shield, HelpCircle, RefreshCw, ExternalLink, Zap,
  CheckCircle2, AlertCircle, ChevronRight, Lock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Suggested Quick Actions
const QUICK_ACTIONS = [
  { label: 'Open Dashboard', path: '/dashboard', icon: '📊', desc: 'Overview of accounts & telemetry' },
  { label: 'Make a Transfer', path: '/transfer', icon: '💸', desc: 'Initiate a secure verified transfer' },
  { label: 'International Wire', path: '/international', icon: '🌐', desc: 'Simulated cross-border SWIFT wire' },
  { label: 'View Transactions', path: '/transactions', icon: '🧾', desc: 'Browse immutable transaction history' },
  { label: 'Deposit Funds', path: '/deposit', icon: '💳', desc: 'Add capital into verified accounts' },
  { label: 'Smart Transfers', path: '/smart-transfers', icon: '⚡', desc: 'Deploy automated payment rules' },
  { label: 'Check Blockchain', path: '/blockchain', icon: '🔗', desc: 'Audit decentralized EVM blocks' },
  { label: 'Security & 2FA', path: '/security', icon: '🛡️', desc: 'Manage PIN, password, & sessions' },
  { label: 'Change Appearance', path: '/settings?tab=appearance', icon: '🎨', desc: 'Select themes and typography' },
];

// Page Context Hints
const PAGE_HINTS = {
  '/dashboard': "You're viewing your primary financial dashboard. Check balances, quick metrics, and recent ledger activity here.",
  '/banking': "Manage all your verified accounts, view account numbers, and generate new account cards.",
  '/transfer': "Need help with transfers? Enter the recipient email, choose an amount, verify with your PIN and OTP. I cannot initiate payments directly for safety.",
  '/international': "Prepare simulated cross-border wire transfers with live demo FX quotes (USD, EUR, GBP, AED, SGD), ECDSA digital signatures, and PDF wire advice receipts.",
  '/deposit': "Add money via verified mock payment gateways. Funds settle directly into your chosen account.",
  '/transactions': "Every transaction here is sealed with SHA-256 and recorded into the decentralized blockchain ledger.",
  '/blockchain': "Audit mined blocks, block hashes, nonce values, and timestamp chains directly in this explorer.",
  '/smart-transfers': "Deploy autonomous recurring rules or conditional balance triggers to execute automated payments safely.",
  '/financial-score': "Your score increases with successful transfers, smart rules, and completed KYC verification.",
  '/security': "Set or update your 4-15 digit Transaction PIN, change passwords, and configure account safety.",
  '/settings': "Choose between Neon Quantum, Clean Minimal, and Cyber Emerald themes or switch typography.",
  '/admin/dashboard': "Welcome to the Admin Control Center. Monitor live metrics, system users, and high-velocity transfers.",
  '/admin/settings': "Customize admin appearance themes separately or configure system security heuristics."
};

// Knowledge Base Rules
const FAQ_KNOWLEDGE = [
  {
    keywords: ['international', 'wire', 'foreign', 'cross border', 'swift', 'remittance', 'forex', 'exchange rate', 'usd', 'eur', 'gbp', 'aed', 'sgd'],
    answer: "You can send cross-border international wire transfers via our simulated settlement engine. Select your destination country and currency (USD, EUR, GBP, AED, SGD), receive decimal-safe FX quotes, and authorize with client-side ECDSA digital signatures and PIN.",
    action: { label: 'Go to International Transfers', path: '/international' }
  },
  {
    keywords: ['transfer', 'send', 'pay', 'send money'],
    answer: "To make a transfer securely, navigate to the Transfer page. You'll enter the recipient's email, your amount, and authorize the payment with your Transaction PIN and OTP. For safety, I guide you to the secure form rather than initiating transactions directly.",
    action: { label: 'Go to Transfer Form', path: '/transfer' }
  },
  {
    keywords: ['smart transfer', 'automation', 'agent', 'rule', 'recurring', 'cadence'],
    answer: "Smart Transfers let you deploy autonomous rules for monthly scheduled transfers or conditional threshold triggers (e.g., when balance exceeds ₹50,000). All rules are verified against non-custodial balance limits.",
    action: { label: 'Open Smart Transfers', path: '/smart-transfers' }
  },
  {
    keywords: ['deposit', 'add money', 'add funds', 'fund'],
    answer: "You can deposit funds directly through our instant mock payment gateways on the Deposit page. Funds reflect immediately on your balance and on-chain ledger.",
    action: { label: 'Go to Deposit', path: '/deposit' }
  },
  {
    keywords: ['blockchain', 'hash', 'ledger', 'block', 'mine'],
    answer: "VaultChain integrates a decentralized cryptographic ledger. Every committed transaction is anchored into an EVM-compatible block using SHA-256 and client-side ECDSA P-256 digital signatures.",
    action: { label: 'Audit Blockchain', path: '/blockchain' }
  },
  {
    keywords: ['pin', 'otp', 'password', '2fa', 'security', 'auth'],
    answer: "Your security is paramount. VaultChain uses 2-factor authorization: your personal numeric Transaction PIN (4–15 digits) plus a one-time Email OTP for all financial debits.",
    action: { label: 'Security Settings', path: '/security' }
  },
  {
    keywords: ['theme', 'appearance', 'dark', 'light', 'clean minimal', 'neon', 'emerald', 'font'],
    answer: "VaultChain offers 3 curated themes: Neon Quantum (futuristic blue & purple), Clean Minimal (crisp white & royal blue), and Cyber Emerald (stealth dark teal). You can also switch between Inter, Poppins, and Roboto typography.",
    action: { label: 'Customize Appearance', path: '/settings?tab=appearance' }
  },
  {
    keywords: ['score', 'credit', 'financial score'],
    answer: "Your VaultChain Financial Score reflects account reliability, successful transfer velocity, autonomous rule deployments, and completed KYC verifications.",
    action: { label: 'Check Financial Score', path: '/financial-score' }
  },
  {
    keywords: ['kyc', 'verification', 'verify identity'],
    answer: "Submit your government ID and address verification on the KYC page. Verified accounts benefit from higher transaction limits and reduced risk heuristic flags.",
    action: { label: 'Open KYC Portal', path: '/kyc' }
  },
  {
    keywords: ['admin', 'panel', 'management'],
    answer: "If you have administrative credentials, you can access user management, live transaction monitoring, AI fraud detection, audit logs, and independent admin appearance settings.",
    action: { label: 'Admin Dashboard', path: '/admin/dashboard' }
  }
];

export default function VaultyAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Assistant UI States
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('vc_vaulty_minimized') === 'true';
  });
  const [showGreetingBubble, setShowGreetingBubble] = useState(true);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'vaulty',
      text: "Hey! I'm Vaulty, your VAULTCHAIN navigation companion. What would you like to explore today?",
      quickActions: QUICK_ACTIONS
    }
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Persist minimized state
  useEffect(() => {
    localStorage.setItem('vc_vaulty_minimized', String(isMinimized));
  }, [isMinimized]);

  // Don't render on public auth pages
  const isAuthPage = ['/', '/login', '/signup', '/otp', '/forgot-password', '/oauth2-success'].includes(location.pathname);
  if (isAuthPage) return null;

  // Mascot Theme Color Palette
  const getThemePalette = () => {
    switch (theme) {
      case 'clean-minimal':
        return {
          body: '#FFFFFF',
          bodyBorder: '#2563EB',
          accent: '#2563EB',
          glow: 'rgba(37, 99, 235, 0.25)',
          visor: '#0F172A',
          eyes: '#38BDF8',
          labelBg: '#EFF6FF',
          labelBorder: '#BFDBFE',
          labelText: '#1D4ED8'
        };
      case 'cyber-emerald':
        return {
          body: '#08181C',
          bodyBorder: '#10B981',
          accent: '#10B981',
          glow: 'rgba(16, 185, 129, 0.35)',
          visor: '#030A0D',
          eyes: '#10B981',
          labelBg: '#062822',
          labelBorder: '#059669',
          labelText: '#34D399'
        };
      case 'neon-quantum':
      default:
        return {
          body: '#10164A',
          bodyBorder: '#7C3AED',
          accent: '#A855F7',
          glow: 'rgba(124, 58, 237, 0.4)',
          visor: '#050720',
          eyes: '#00F0FF',
          labelBg: '#1C1547',
          labelBorder: '#7C3AED',
          labelText: '#D8B4FE'
        };
    }
  };

  const palette = getThemePalette();

  const handleActionClick = (path) => {
    navigate(path);
    // Add assistant acknowledgment
    const targetAction = QUICK_ACTIONS.find(a => a.path === path);
    setMessages(prev => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        sender: 'user',
        text: `Open ${targetAction ? targetAction.label : path}`
      },
      {
        id: 'bot-' + Date.now(),
        sender: 'vaulty',
        text: `Navigating to ${targetAction ? targetAction.label : path}... Let me know if you need any guidance once there!`
      }
    ]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    const userMsg = { id: 'user-' + Date.now(), sender: 'user', text: query };
    setInputValue('');

    // Process rule-based response
    const lower = query.toLowerCase();

    // Check FAQ keywords
    let match = FAQ_KNOWLEDGE.find(item =>
      item.keywords.some(k => lower.includes(k))
    );

    let botResponse;
    if (match) {
      botResponse = {
        id: 'bot-' + Date.now(),
        sender: 'vaulty',
        text: match.answer,
        action: match.action
      };
    } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      botResponse = {
        id: 'bot-' + Date.now(),
        sender: 'vaulty',
        text: "Hi there! I'm Vaulty. You can ask me how to navigate the platform, transfer money, check blockchain transactions, or change your appearance.",
        quickActions: QUICK_ACTIONS.slice(0, 4)
      };
    } else if (lower.includes('help') || lower.includes('what can you do')) {
      botResponse = {
        id: 'bot-' + Date.now(),
        sender: 'vaulty',
        text: "I can help you explore VAULTCHAIN! I answer questions on security, transaction statuses, and smart rules, and guide you directly to pages across the app.",
        quickActions: QUICK_ACTIONS
      };
    } else {
      botResponse = {
        id: 'bot-' + Date.now(),
        sender: 'vaulty',
        text: "I might not know all the details about that yet, but I can guide you to any page in VAULTCHAIN! Try one of the quick actions below:",
        quickActions: QUICK_ACTIONS.slice(0, 4)
      };
    }

    setMessages(prev => [...prev, userMsg, botResponse]);
  };

  const handleToggleOpen = () => {
    setIsOpen(prev => !prev);
    setShowGreetingBubble(false);
  };

  const currentHint = PAGE_HINTS[location.pathname];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* ── Greeting Tooltip Bubble ──────────────────────────────── */}
      {!isOpen && showGreetingBubble && !bubbleDismissed && !isMinimized && (
        <div
          className="pointer-events-auto mb-3 max-w-xs p-3 rounded-2xl border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-start gap-2.5"
          style={{
            background: 'var(--bg-card)',
            borderColor: palette.bodyBorder,
            boxShadow: `0 8px 24px ${palette.glow}`
          }}
        >
          <div className="flex-1 cursor-pointer" onClick={handleToggleOpen}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: palette.accent }} />
              <strong className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Vaulty</strong>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ background: palette.labelBg, color: palette.labelText }}>AI Companion</span>
            </div>
            <p className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
              Hi! Need help navigating your VAULTCHAIN banking?
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setBubbleDismissed(true); }}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            title="Dismiss greeting"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Open Interactive Chat Window ─────────────────────────── */}
      {isOpen && (
        <div
          className="pointer-events-auto mb-3 w-[92vw] sm:w-[380px] h-[520px] max-h-[82vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-200"
          style={{
            background: 'var(--bg-card)',
            borderColor: palette.bodyBorder,
            boxShadow: `0 16px 48px ${palette.glow}, 0 4px 16px rgba(0,0,0,0.4)`
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 border-b flex items-center justify-between shrink-0"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs"
                style={{
                  background: palette.body,
                  borderColor: palette.bodyBorder
                }}
              >
                <MascotSvg palette={palette} size={22} isAnimated={false} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold leading-none" style={{ color: 'var(--text-primary)' }}>Vaulty AI Assistant</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">VAULTCHAIN Guide • Non-Custodial</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setIsOpen(false); setIsMinimized(true); }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition cursor-pointer"
                title="Minimize assistant"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition cursor-pointer"
                title="Close chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Current Page Context Hint Banner */}
          {currentHint && (
            <div
              className="px-3.5 py-2 text-[11px] border-b flex items-start gap-2 shrink-0"
              style={{
                background: palette.labelBg,
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: palette.accent }} />
              <p className="line-clamp-2 leading-tight">{currentHint}</p>
            </div>
          )}

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'btn-primary-gradient text-white rounded-br-xs'
                      : 'border rounded-bl-xs'
                  }`}
                  style={m.sender !== 'user' ? {
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  } : {}}
                >
                  <p>{m.text}</p>
                </div>

                {/* Direct Action Link if provided in response */}
                {m.action && (
                  <button
                    type="button"
                    onClick={() => handleActionClick(m.action.path)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    style={{
                      background: palette.labelBg,
                      borderColor: palette.bodyBorder,
                      color: palette.labelText,
                      borderWidth: '1px'
                    }}
                  >
                    <span>{m.action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {/* Quick Action Suggestion Buttons */}
                {m.quickActions && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 w-full">
                    {m.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleActionClick(qa.path)}
                        className="p-2 rounded-xl text-left border transition hover:border-[var(--accent-primary)] group flex items-center justify-between cursor-pointer"
                        style={{
                          background: 'var(--bg-elevated)',
                          borderColor: 'var(--border-color)'
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm shrink-0">{qa.icon}</span>
                          <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                            {qa.label}
                          </span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] shrink-0 transition" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Safety Footnote */}
          <div
            className="px-3.5 py-1.5 border-t text-[10px] text-center flex items-center justify-center gap-1.5 shrink-0"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Vaulty never asks for secrets or executes unauthorized payments.</span>
          </div>

          {/* User Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 border-t flex items-center gap-2 shrink-0"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Vaulty anything about banking..."
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 rounded-xl btn-primary-gradient text-white transition disabled:opacity-40 cursor-pointer shadow-sm"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Mascot Robot / Minimize Button ───────────────── */}
      <div className="pointer-events-auto flex items-center gap-2">
        {isMinimized ? (
          <button
            type="button"
            onClick={() => { setIsMinimized(false); setIsOpen(true); }}
            className="px-3.5 py-2 rounded-full border shadow-xl flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              borderColor: palette.bodyBorder,
              color: 'var(--text-primary)',
              boxShadow: `0 4px 16px ${palette.glow}`
            }}
            title="Expand Vaulty Assistant"
          >
            <MascotSvg palette={palette} size={22} isAnimated={false} />
            <span className="text-xs font-bold">Vaulty AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleOpen}
            aria-label="Open Vaulty Banking Assistant"
            className="relative group p-2.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              borderColor: palette.bodyBorder,
              boxShadow: `0 8px 24px ${palette.glow}, 0 2px 8px rgba(0,0,0,0.3)`
            }}
            title="Chat with Vaulty AI Assistant"
          >
            {/* Soft Ambient Radial Glow */}
            <div
              className="absolute inset-0 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition pointer-events-none"
              style={{ background: palette.glow }}
            />

            {/* Mascot Robot */}
            <div className="relative z-10">
              <MascotSvg palette={palette} size={42} isAnimated={true} />
            </div>

            {/* Status Ping Dot */}
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center z-20"
              style={{ backgroundColor: palette.accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Cute Theme-Adaptive Mascot Robot SVG ────────────────────────
function MascotSvg({ palette, size = 36, isAnimated = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isAnimated ? "vaulty-float-anim" : ""}
      style={{
        filter: `drop-shadow(0 2px 4px ${palette.glow})`
      }}
    >
      <defs>
        {/* Antenna Pulsing Gradient */}
        <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={palette.accent} />
        </radialGradient>
      </defs>

      {/* Antenna Pole & Bulb */}
      <line x1="32" y1="14" x2="32" y2="6" stroke={palette.bodyBorder} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5" r="4.5" fill="url(#antennaGlow)" stroke={palette.bodyBorder} strokeWidth="1.5" />

      {/* Robot Ears / Headsets */}
      <rect x="8" y="24" width="5" height="12" rx="2.5" fill={palette.accent} stroke={palette.bodyBorder} strokeWidth="1.5" />
      <rect x="51" y="24" width="5" height="12" rx="2.5" fill={palette.accent} stroke={palette.bodyBorder} strokeWidth="1.5" />

      {/* Main Robot Head */}
      <rect
        x="12"
        y="14"
        width="40"
        height="34"
        rx="14"
        fill={palette.body}
        stroke={palette.bodyBorder}
        strokeWidth="2.5"
      />

      {/* Glossy Visor Screen */}
      <rect
        x="18"
        y="21"
        width="28"
        height="18"
        rx="8"
        fill={palette.visor}
        stroke={palette.bodyBorder}
        strokeWidth="1.2"
      />

      {/* Visor Glare / Reflection */}
      <path
        d="M22 23 Q32 21 42 23"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Cute Digital Eyes */}
      <circle cx="26" cy="30" r="3.2" fill={palette.eyes} className={isAnimated ? "vaulty-eye-blink" : ""}>
        <animate attributeName="opacity" values="1;1;0.1;1" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="30" r="3.2" fill={palette.eyes} className={isAnimated ? "vaulty-eye-blink" : ""}>
        <animate attributeName="opacity" values="1;1;0.1;1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Happy Digital Smile */}
      <path
        d="M29 34 Q32 36.5 35 34"
        stroke={palette.eyes}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Subtle Robot Cheeks Blush */}
      <circle cx="21" cy="33" r="1.8" fill="rgba(244, 114, 182, 0.45)" />
      <circle cx="43" cy="33" r="1.8" fill="rgba(244, 114, 182, 0.45)" />

      {/* Bottom Floating Body / Thruster */}
      <path
        d="M24 49 C24 54, 40 54, 40 49 Z"
        fill={palette.accent}
        stroke={palette.bodyBorder}
        strokeWidth="1.5"
      />
      <ellipse cx="32" cy="54" rx="3.5" ry="1.5" fill={palette.eyes} opacity="0.8">
        <animate attributeName="rx" values="3.5;4.5;3.5" dur="1.5s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}
