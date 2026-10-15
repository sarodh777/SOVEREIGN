import React, { useState } from 'react';
import {
  Palette, Type, Check, Sparkles, RefreshCw, Sun, Moon,
  Shield, CheckCircle2, ChevronRight, Eye, Monitor, Smartphone
} from 'lucide-react';
import { useTheme, THEMES, FONTS } from '../context/ThemeContext';

export default function AppearanceSettings() {
  const { theme, font, setTheme, setFont, resetDefaults } = useTheme();
  const [successToast, setSuccessToast] = useState('');
  const [previewTheme, setPreviewTheme] = useState(null);

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleSelectTheme = (themeId) => {
    setTheme(themeId);
    setPreviewTheme(null);
    showNotification(`Theme updated to "${THEMES[themeId].name}"`);
  };

  const handleSelectFont = (fontId) => {
    setFont(fontId);
    showNotification(`Typography updated to "${FONTS[fontId].name}"`);
  };

  const handleReset = () => {
    resetDefaults();
    setPreviewTheme(null);
    showNotification('Preferences restored to default (Neon Quantum + Inter)');
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* ── Section Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--btn-secondary-bg)] text-[var(--accent-primary)] border border-[var(--border-color)]">
              USER CUSTOMIZATION
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">Theme Engine v3.0</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-[var(--accent-primary)]" />
            Appearance & Personalization
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Select your preferred visual atmosphere, color tokens, and corporate typography. Preferences persist across all sessions.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn-secondary-gradient flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold self-start sm:self-auto cursor-pointer"
          title="Restore factory default appearance"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          Reset to Default
        </button>
      </div>

      {/* ── Theme Selection Cards Grid ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 font-mono">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            Select System Theme ({Object.keys(THEMES).length})
          </h3>
          <span className="text-xs text-[var(--text-muted)]">Active: <strong className="text-[var(--text-primary)]">{THEMES[theme]?.shortName}</strong></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.values(THEMES).map((t) => {
            const isSelected = theme === t.id;
            const isPreviewing = previewTheme === t.id;

            return (
              <div
                key={t.id}
                className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'border-[var(--accent-primary)] shadow-2xl ring-2 ring-[var(--accent-primary)]/40 bg-[var(--bg-card)]'
                    : 'border-[var(--border-color)] hover:border-[var(--border-luminous)] bg-[var(--bg-card)]'
                }`}
                style={{
                  background: isSelected ? 'var(--bg-card)' : undefined
                }}
                onClick={() => handleSelectTheme(t.id)}
              >
                {/* Active Indicator Badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" /> Active
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                      {t.tag}
                    </span>
                    <h4 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                      {t.shortName}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                  </div>

                  {/* Visual Palette Preview Dots */}
                  <div className="flex items-center gap-2 my-4 p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono mr-1">Palette:</span>
                    {t.previewColors.map((hex, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>

                  {/* Mini Mockup Card Preview */}
                  <div
                    className="rounded-xl p-3 border mb-4 text-xs font-mono select-none"
                    style={{
                      backgroundColor: t.bg,
                      borderColor: t.accent + '40',
                      color: t.isDark ? '#F8FAFC' : '#0F172A'
                    }}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: t.accent + '30' }}>
                      <span className="text-[10px] font-bold" style={{ color: t.accent }}>VAULTCHAIN UI</span>
                      <span className="text-[9px] opacity-75">100% Synced</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] opacity-70">Balance:</span>
                      <span className="font-bold text-xs" style={{ color: t.isDark ? '#34D399' : '#1D4ED8' }}>₹ 1,240,500</span>
                    </div>
                    <div
                      className="mt-2 text-[10px] py-1 text-center font-bold rounded-lg text-white"
                      style={{ background: t.accent }}
                    >
                      Instant Transfer
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTheme(t.id);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--btn-secondary-bg)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                      : 'btn-primary-gradient'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Applied
                    </>
                  ) : (
                    <>
                      Select {t.shortName}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Font Personalization Section ──────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 font-mono">
            <Type className="w-4 h-4 text-[var(--accent-primary)]" />
            Select Typography ({Object.keys(FONTS).length})
          </h3>
          <span className="text-xs text-[var(--text-muted)]">Active Font: <strong className="text-[var(--text-primary)]">{font}</strong></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.values(FONTS).map((f) => {
            const isFontActive = font === f.id;

            return (
              <div
                key={f.id}
                onClick={() => handleSelectFont(f.id)}
                className={`glass-card rounded-2xl p-5 flex flex-col justify-between border cursor-pointer transition-all ${
                  isFontActive
                    ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 shadow-xl'
                    : 'border-[var(--border-color)] hover:border-[var(--border-luminous)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: f.name }}>
                      {f.name}
                    </h4>
                    {isFontActive && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    {f.description}
                  </p>

                  {/* Typography Specimen Preview */}
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1.5 mb-4" style={{ fontFamily: f.name }}>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Specimen Preview:</div>
                    <div className="text-base font-extrabold text-[var(--text-primary)] leading-tight">
                      The Quick Brown Fox Jumps Over The Lazy Dog
                    </div>
                    <div className="text-sm font-bold text-[var(--accent-primary)] font-mono">
                      {f.sample}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Instant ECDSA non-custodial cryptographic verification across blockchain blocks.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFont(f.id);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFontActive
                      ? 'bg-[var(--btn-secondary-bg)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                      : 'btn-primary-gradient'
                  }`}
                >
                  {isFontActive ? 'Active Font' : `Use ${f.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
