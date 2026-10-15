import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings, Shield, Lock, Bell, Sliders, Server, CheckCircle2, Save, Sparkles,
  Palette, RefreshCw, Type, Check, Eye, Sun, Moon
} from 'lucide-react';
import { useTheme, THEMES, FONTS } from '../../context/ThemeContext';

export default function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'appearance' ? 'appearance' : 'security';
  const [activeTab, setActiveTab] = useState(initialTab);

  const {
    adminTheme,
    setAdminTheme,
    adminFont,
    setAdminFont,
    resetDefaults
  } = useTheme();

  // Security parameters state
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(5);
  const [lockDuration, setLockDuration] = useState(15);
  const [sessionTimeout, setSessionTimeout] = useState(24);
  const [largeTxThreshold, setLargeTxThreshold] = useState(50000);
  const [requireOtpForAdmin, setRequireOtpForAdmin] = useState(true);
  const [autoFlagUnverified, setAutoFlagUnverified] = useState(true);
  const [savedSecurity, setSavedSecurity] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Local theme preview state before committing
  const [previewTheme, setPreviewTheme] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'appearance' || tabParam === 'security') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    setSavedSecurity(true);
    showToast('Security enforcement heuristics saved successfully.');
    setTimeout(() => setSavedSecurity(false), 3000);
  };

  const handleSelectAdminTheme = (themeId) => {
    setAdminTheme(themeId);
    setPreviewTheme(null);
    showToast(`Administrator theme updated to "${THEMES[themeId].name}"`);
  };

  const handleSelectAdminFont = (fontId) => {
    setAdminFont(fontId);
    showToast(`Administrator typography updated to "${FONTS[fontId].name}"`);
  };

  const handleResetAdminAppearance = () => {
    resetDefaults(true);
    setPreviewTheme(null);
    showToast('Administrator appearance reset to default (Neon Quantum + Inter)');
  };

  const activeThemeId = previewTheme || adminTheme;

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">System Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1">Admin Settings</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage admin security rules, risk thresholds, and control panel appearance</p>
          </div>
        </div>

        {/* Global Toast */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/35 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
          <button
            type="button"
            onClick={() => handleTabChange('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[var(--btn-primary-bg)] text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security & Heuristics
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('appearance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-[var(--btn-primary-bg)] text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            <Palette className="w-4 h-4" />
            Appearance & Themes
          </button>
        </div>

        {/* ── TAB 1: SECURITY SETTINGS ───────────────────────────── */}
        {activeTab === 'security' && (
          <form onSubmit={handleSaveSecurity} className="space-y-6">
            {savedSecurity && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Security configuration parameters updated successfully.
              </div>
            )}

            {/* Authentication & Lockout Security */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] space-y-4 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Authentication & Lockout Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Max Failed Login Attempts</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={maxFailedAttempts}
                    onChange={(e) => setMaxFailedAttempts(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Triggers automatic account lockout</p>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Lockout Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={lockDuration}
                    onChange={(e) => setLockDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Cooldown duration before retry is allowed</p>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">JWT Session Validity (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Stateless token TTL expiry</p>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Large Tx Anomaly Threshold (₹)</label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    value={largeTxThreshold}
                    onChange={(e) => setLargeTxThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Flagged automatically in suspicious activities</p>
                </div>
              </div>
            </div>

            {/* Behavioral Flags */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] space-y-4 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Administrative Enforcement Rules
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">Require Multi-Factor Authentication (OTP) for Admin Access</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Enforce email OTP verification upon administrator login</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireOtpForAdmin}
                    onChange={(e) => setRequireOtpForAdmin(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent-primary)]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] cursor-pointer">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">Auto-flag Unverified Accounts Performing Transactions</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Issue instant telemetry alert when unverified users transact</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoFlagUnverified}
                    onChange={(e) => setAutoFlagUnverified(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent-primary)]"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Security Configurations
              </button>
            </div>
          </form>
        )}

        {/* ── TAB 2: APPEARANCE & THEMES ─────────────────────────── */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header subtext */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--btn-secondary-bg)] text-[var(--accent-primary)] border border-[var(--border-color)]">
                    ADMIN PREFERENCES
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">Separate from User Preferences</span>
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Admin Panel Visual Themes</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Choose the active theme for the administrator interface. Your selection persists across admin sessions without altering regular users' chosen themes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAdminAppearance}
                className="btn-secondary-gradient flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Reset Admin Defaults
              </button>
            </div>

            {/* Themes Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  Select Administrator Theme
                </h3>
                <span className="text-xs text-[var(--text-muted)]">
                  Active: <strong className="text-[var(--accent-primary)]">{THEMES[adminTheme]?.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(THEMES).map((t) => {
                  const isSelected = adminTheme === t.id;
                  const isPreview = previewTheme === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectAdminTheme(t.id)}
                      className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md ${
                        isSelected
                          ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 bg-[var(--bg-elevated)]'
                          : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 bg-[var(--bg-card)]'
                      }`}
                    >
                      <div>
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                                style={{
                                  background: t.isDark ? '#0F172A' : '#EFF6FF',
                                  color: t.accent,
                                  border: `1px solid ${t.accent}40`
                                }}>
                            {t.tag}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> ACTIVE ADMIN
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">{t.name}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                          {t.description}
                        </p>
                      </div>

                      <div>
                        {/* Palette Previews */}
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] mb-3">
                          {t.previewColors.map((c, i) => (
                            <div
                              key={i}
                              className="flex-1 h-5 rounded-md border border-white/10 shadow-xs"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAdminTheme(t.id);
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'btn-primary-gradient text-white shadow-md'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Active Theme
                            </>
                          ) : (
                            'Apply to Admin Panel'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Typography Selector */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 font-mono">
                  <Type className="w-4 h-4 text-[var(--accent-primary)]" />
                  Admin Panel Typography
                </h3>
                <span className="text-xs text-[var(--text-muted)]">Active: <strong className="text-[var(--text-primary)]">{adminFont}</strong></span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.values(FONTS).map((f) => {
                  const isSelected = adminFont === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectAdminFont(f.id)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent-primary)]/40'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color)]/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{f.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mb-2">{f.description}</p>
                      <div className="text-[11px] font-mono text-[var(--accent-primary)] truncate" style={{ fontFamily: f.id }}>
                        {f.sample}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Component Preview */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 font-mono">
                <Eye className="w-4 h-4 text-[var(--accent-primary)]" />
                Live Preview in Active Theme
              </h3>
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)]">Admin Metric Sample</span>
                  <div className="text-2xl font-black text-[var(--text-primary)]">₹ 4,892,150.00</div>
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ECDSA Verification Synced
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-secondary-gradient px-4 py-2 rounded-xl text-xs font-bold">
                    Secondary
                  </button>
                  <button type="button" className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
                    Primary Action
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
