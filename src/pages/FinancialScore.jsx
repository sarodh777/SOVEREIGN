import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Award, Star,
  CheckCircle2, AlertTriangle, Info, BarChart2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';

const CATEGORY_CONFIG = {
  EXCELLENT:          { color: '#356BFF', label: 'Excellent',          range: '800–900', icon: '🏆' },
  GOOD:               { color: '#713BFF', label: 'Good',               range: '700–799', icon: '⭐' },
  FAIR:               { color: '#A855F7', label: 'Fair',               range: '600–699', icon: '📈' },
  NEEDS_IMPROVEMENT:  { color: '#EC4899', label: 'Needs Improvement',  range: '< 600',   icon: '⚠️' },
};

// Circular gauge component
function ScoreGauge({ score, category }) {
  const cfg    = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.FAIR;
  const pct    = Math.max(0, Math.min(1, (score - 300) / 600)); // 300=0%, 900=100%
  const radius = 90;
  const stroke = 12;
  const norm   = radius - stroke / 2;
  const circ   = Math.PI * norm; // half circle
  const dash   = circ * pct;

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 220 130">
        {/* Track */}
        <path
          d={`M ${stroke} 115 A ${norm} ${norm} 0 0 1 ${220 - stroke} 115`}
          fill="none" stroke="rgba(139,146,255,0.12)" strokeWidth={stroke} strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${stroke} 115 A ${norm} ${norm} 0 0 1 ${220 - stroke} 115`}
          fill="none" stroke={cfg.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 10px ${cfg.color}90)`, transition: 'stroke-dasharray 1.2s ease' }}
        />
        {/* Score text */}
        <text x="110" y="100" textAnchor="middle" fill="#F8FAFC" fontSize="40" fontWeight="900" fontFamily="monospace">
          {score}
        </text>
        <text x="110" y="125" textAnchor="middle" fill={cfg.color} fontSize="13" fontWeight="700" letterSpacing="2">
          {cfg.label.toUpperCase()}
        </text>
      </svg>
      <p className="text-[#B8C5F2] text-xs mt-1">out of 900 • Range: {cfg.range}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const plus = d.delta > 0;
  return (
    <div className="bg-[#0B1550] border border-[rgba(139,146,255,0.3)] rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-[#F8FAFC] font-bold">{d.scoreAfter} pts</p>
      <p className={plus ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{plus ? '+' : ''}{d.delta}</p>
      <p className="text-[#B8C5F2] mt-0.5 max-w-[160px] truncate">{d.reason}</p>
    </div>
  );
};

export default function FinancialScore() {
  const [scoreData, setScoreData] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        api.get('/api/financial-score'),
        api.get('/api/financial-score/history'),
      ]);
      setScoreData(sRes.data);
      // Reverse so chart goes oldest → newest
      setHistory([...(hRes.data.history || [])].reverse());
    } catch { /* show empty state */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchScore = async () => {
      try {
        const [sRes, hRes] = await Promise.all([
          api.get('/api/financial-score'),
          api.get('/api/financial-score/history'),
        ]);
        if (!ignore) {
          setScoreData(sRes.data);
          setHistory([...(hRes.data.history || [])].reverse());
        }
      } catch {
        /* show empty state */
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    fetchScore();
    return () => { ignore = true; };
  }, []);

  const handleRefresh = () => { setRefreshing(true); load(); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#713BFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cfg = CATEGORY_CONFIG[scoreData?.category] || CATEGORY_CONFIG.FAIR;
  const chartData = history.map((h, i) => ({ ...h, index: i + 1 }));

  // Score table: scoring rules explained
  const scoringRules = [
    { event: 'Successful Transfer',        delta: '+5',  color: '#10B981' },
    { event: 'Successful Smart Transfer',  delta: '+10', color: '#10B981' },
    { event: 'Deposit',                    delta: '+3',  color: '#10B981' },
    { event: 'KYC Verified',              delta: '+30', color: '#10B981' },
    { event: 'Failed Transaction',        delta: '−15', color: '#EF4444' },
    { event: 'Failed Smart Transfer',     delta: '−20', color: '#EF4444' },
  ];

  return (
    <div className="page-root">
      <div className="page-content">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md"
            style={{ background: cfg.color + '20', borderColor: cfg.color + '50' }}>
            <Award className="w-6 h-6" style={{ color: cfg.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#F8FAFC]">VaultChain Financial Score</h1>
            <p className="text-[#B8C5F2] text-sm">Your internal financial reputation &amp; credit metrics</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-xl text-[#B8C5F2] text-sm hover:text-[#F8FAFC] hover:border-[#713BFF] transition disabled:opacity-50 cursor-pointer shadow-md">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!scoreData ? (
        <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-12 text-center shadow-xl">
          <p className="text-[#F8FAFC] font-bold mb-2">Score not available yet</p>
          <p className="text-[#B8C5F2] text-sm">Start transacting to build your VaultChain financial score</p>
        </div>
      ) : (
        <>
          {/* Score Gauge + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl"
              style={{ borderColor: cfg.color + '50' }}>
              <ScoreGauge score={scoreData.score} category={scoreData.category} />
              <p className="text-[#B8C5F2] text-xs mt-3">Updated: {new Date(scoreData.updatedAt).toLocaleString('en-IN')}</p>
            </div>

            {/* Category Breakdown */}
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 shadow-xl">
              <h2 className="text-[#F8FAFC] font-bold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#A855F7]" /> Score Ranges
              </h2>
              <div className="space-y-2.5">
                {Object.entries(CATEGORY_CONFIG).map(([key, c]) => (
                  <div key={key} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${scoreData.category === key ? 'ring-1 ring-opacity-60 border' : 'opacity-70'}`}
                    style={{ background: c.color + '15', borderColor: c.color + '40', ringColor: c.color }}>
                    <span className="text-lg">{c.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</p>
                      <p className="text-xs text-[#B8C5F2]">{c.range} points</p>
                    </div>
                    {scoreData.category === key && <CheckCircle2 className="w-4 h-4" style={{ color: c.color }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Transfers',        val: scoreData.stats?.successfulTransactions, color: '#356BFF' },
              { label: 'Smart Transfers',  val: scoreData.stats?.smartTransferSuccesses, color: '#713BFF' },
              { label: 'Deposits',         val: scoreData.stats?.depositCount,           color: '#A855F7' },
              { label: 'Failed Tx',        val: scoreData.stats?.failedTransactions,     color: '#EC4899' },
              { label: 'Failed Smart',     val: scoreData.stats?.smartTransferFailures,  color: '#EC4899' },
            ].map(s => (
              <div key={s.label} className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-xl p-3.5 text-center shadow-lg">
                <p className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.val ?? 0}</p>
                <p className="text-[#B8C5F2] text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Score Factors */}
          <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 mb-6 shadow-xl">
            <h2 className="text-[#F8FAFC] font-bold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#356BFF]" /> Score Factors
            </h2>
            <div className="space-y-2">
              {(scoreData.factors || []).map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[rgba(139,146,255,0.1)] last:border-0">
                  <span className="text-base">{f.icon}</span>
                  <p className={`text-sm flex-1 ${f.type === 'positive' ? 'text-emerald-400' : f.type === 'negative' ? 'text-red-400' : 'text-[#B8C5F2]'}`}>
                    {f.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Score History Chart */}
          {chartData.length > 1 && (
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 mb-6 shadow-xl">
              <h2 className="text-[#F8FAFC] font-bold mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#A855F7]" /> Score History
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cfg.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,146,255,0.12)" />
                    <XAxis dataKey="index" tick={{ fill: '#B8C5F2', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[300, 900]} tick={{ fill: '#B8C5F2', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="scoreAfter" stroke={cfg.color} strokeWidth={2.5}
                      fill="url(#scoreGrad)" dot={{ fill: cfg.color, r: 3.5 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Scoring Algorithm — Transparency */}
          <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 shadow-xl">
            <h2 className="text-[#F8FAFC] font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#356BFF]" /> How Your Score Is Calculated
            </h2>
            <p className="text-[#B8C5F2] text-sm mb-4 leading-relaxed">
              VaultChain Financial Score is an <strong className="text-[#F8FAFC]">internal platform score</strong> based on your financial behavior within VaultChain.
              It is <strong className="text-[#F8FAFC]">NOT</strong> an official CIBIL or external credit bureau score.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(139,146,255,0.18)]">
                    <th className="text-left text-[#B8C5F2] pb-2 font-semibold">Event</th>
                    <th className="text-right text-[#B8C5F2] pb-2 font-semibold">Score Change</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringRules.map(r => (
                    <tr key={r.event} className="border-b border-[rgba(139,146,255,0.1)] last:border-0">
                      <td className="py-2.5 text-[#F8FAFC]">{r.event}</td>
                      <td className="py-2.5 text-right font-bold font-mono" style={{ color: r.color }}>{r.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[#B8C5F2]/70 text-xs mt-4">Score range: 300 (minimum) → 900 (maximum). Starting score: 500.</p>
          </div>

          {/* Recent History List */}
          {history.length > 0 && (
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 mt-6 shadow-xl">
              <h2 className="text-[#F8FAFC] font-bold mb-4">Recent Score Events</h2>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {[...history].reverse().map(h => (
                  <div key={h.id} className="flex items-center gap-3 bg-[#050B2E]/60 rounded-xl px-4 py-2.5 border border-[rgba(139,146,255,0.15)]">
                    {h.delta > 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F8FAFC] text-sm font-medium truncate">{h.reason}</p>
                      <p className="text-[#B8C5F2] text-xs">{h.scoreBefore} → {h.scoreAfter}</p>
                    </div>
                    <span className={`font-bold font-mono text-sm shrink-0 ${h.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.delta > 0 ? '+' : ''}{h.delta}
                    </span>
                    <span className="text-[#B8C5F2]/60 text-xs shrink-0 ml-2">
                      {new Date(h.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
