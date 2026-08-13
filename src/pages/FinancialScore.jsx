import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Award, Star,
  CheckCircle2, AlertTriangle, Info, BarChart2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';

const CATEGORY_CONFIG = {
  EXCELLENT:          { color: '#10B981', label: 'Excellent',          range: '800–900', icon: '🏆' },
  GOOD:               { color: '#00F0FF', label: 'Good',               range: '700–799', icon: '⭐' },
  FAIR:               { color: '#F59E0B', label: 'Fair',               range: '600–699', icon: '📈' },
  NEEDS_IMPROVEMENT:  { color: '#FF006E', label: 'Needs Improvement',  range: '< 600',   icon: '⚠️' },
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
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${stroke} 115 A ${norm} ${norm} 0 0 1 ${220 - stroke} 115`}
          fill="none" stroke={cfg.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 8px ${cfg.color}80)`, transition: 'stroke-dasharray 1.2s ease' }}
        />
        {/* Score text */}
        <text x="110" y="100" textAnchor="middle" fill="#E8EEF7" fontSize="40" fontWeight="900" fontFamily="monospace">
          {score}
        </text>
        <text x="110" y="125" textAnchor="middle" fill={cfg.color} fontSize="13" fontWeight="700" letterSpacing="2">
          {cfg.label.toUpperCase()}
        </text>
      </svg>
      <p className="text-[#718096] text-xs mt-1">out of 900 • Range: {cfg.range}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const plus = d.delta > 0;
  return (
    <div className="bg-[#1A1F2E] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#E8EEF7] font-bold">{d.scoreAfter} pts</p>
      <p className={plus ? 'text-[#10B981]' : 'text-[#FF006E]'}>{plus ? '+' : ''}{d.delta}</p>
      <p className="text-[#718096] mt-0.5 max-w-[160px] truncate">{d.reason}</p>
    </div>
  );
};

export default function FinancialScore() {
  const [scoreData, setScoreData] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        api.get('/api/financial-score'),
        api.get('/api/financial-score/history'),
      ]);
      setScoreData(sRes.data);
      // Reverse so chart goes oldest → newest
      setHistory([...(hRes.data.history || [])].reverse());
    } catch (e) { /* show empty state */ }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => { setRefreshing(true); load(); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cfg = CATEGORY_CONFIG[scoreData?.category] || CATEGORY_CONFIG.FAIR;
  const chartData = history.map((h, i) => ({ ...h, index: i + 1 }));

  // Score table: scoring rules explained
  const scoringRules = [
    { event: 'Successful Transfer',        delta: '+5',  color: '#10B981' },
    { event: 'Successful Smart Transfer',  delta: '+10', color: '#10B981' },
    { event: 'Deposit',                    delta: '+3',  color: '#10B981' },
    { event: 'Withdrawal',                 delta: '+2',  color: '#10B981' },
    { event: 'KYC Verified',              delta: '+30', color: '#10B981' },
    { event: 'Failed Transaction',        delta: '−15', color: '#FF006E' },
    { event: 'Failed Smart Transfer',     delta: '−20', color: '#FF006E' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
            style={{ background: cfg.color + '18', borderColor: cfg.color + '40' }}>
            <Award className="w-6 h-6" style={{ color: cfg.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#E8EEF7]">VaultChain Financial Score</h1>
            <p className="text-[#A0AEC0] text-sm">Your internal financial reputation score</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#252C3C] border border-white/10 rounded-xl text-[#A0AEC0] text-sm hover:text-[#E8EEF7] transition disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!scoreData ? (
        <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-[#E8EEF7] font-bold mb-2">Score not available yet</p>
          <p className="text-[#718096] text-sm">Start transacting to build your VaultChain financial score</p>
        </div>
      ) : (
        <>
          {/* Score Gauge + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border rounded-2xl p-6 flex flex-col items-center justify-center"
              style={{ borderColor: cfg.color + '40' }}>
              <ScoreGauge score={scoreData.score} category={scoreData.category} />
              <p className="text-[#718096] text-xs mt-3">Updated: {new Date(scoreData.updatedAt).toLocaleString('en-IN')}</p>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6">
              <h2 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#00F0FF]" /> Score Ranges
              </h2>
              <div className="space-y-2.5">
                {Object.entries(CATEGORY_CONFIG).map(([key, c]) => (
                  <div key={key} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${scoreData.category === key ? 'ring-1 ring-opacity-50' : 'opacity-60'}`}
                    style={{ background: c.color + '10', ringColor: c.color }}>
                    <span className="text-lg">{c.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</p>
                      <p className="text-xs text-[#718096]">{c.range} points</p>
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
              { label: 'Transfers',        val: scoreData.stats?.successfulTransactions, color: '#10B981' },
              { label: 'Smart Transfers',  val: scoreData.stats?.smartTransferSuccesses, color: '#00F0FF' },
              { label: 'Deposits',         val: scoreData.stats?.depositCount,           color: '#F59E0B' },
              { label: 'Failed Tx',        val: scoreData.stats?.failedTransactions,     color: '#FF006E' },
              { label: 'Failed Smart',     val: scoreData.stats?.smartTransferFailures,  color: '#FF006E' },
            ].map(s => (
              <div key={s.label} className="bg-[#1A1F2E] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.val ?? 0}</p>
                <p className="text-[#718096] text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Score Factors */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6 mb-6">
            <h2 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#00F0FF]" /> Score Factors
            </h2>
            <div className="space-y-2">
              {(scoreData.factors || []).map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-base">{f.icon}</span>
                  <p className={`text-sm flex-1 ${f.type === 'positive' ? 'text-[#10B981]' : f.type === 'negative' ? 'text-[#FF006E]' : 'text-[#A0AEC0]'}`}>
                    {f.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Score History Chart */}
          {chartData.length > 1 && (
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6 mb-6">
              <h2 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#00F0FF]" /> Score History
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="index" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[300, 900]} tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="scoreAfter" stroke={cfg.color} strokeWidth={2}
                      fill="url(#scoreGrad)" dot={{ fill: cfg.color, r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Scoring Algorithm — Transparency */}
          <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6">
            <h2 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#10B981]" /> How Your Score Is Calculated
            </h2>
            <p className="text-[#718096] text-sm mb-4">
              VaultChain Financial Score is an <strong className="text-[#A0AEC0]">internal platform score</strong> based on your financial behavior within VaultChain.
              It is <strong className="text-[#A0AEC0]">NOT</strong> an official CIBIL or credit bureau score.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-[#718096] pb-2 font-semibold">Event</th>
                    <th className="text-right text-[#718096] pb-2 font-semibold">Score Change</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringRules.map(r => (
                    <tr key={r.event} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 text-[#A0AEC0]">{r.event}</td>
                      <td className="py-2.5 text-right font-bold font-mono" style={{ color: r.color }}>{r.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[#718096] text-xs mt-4">Score range: 300 (minimum) → 900 (maximum). Starting score: 500.</p>
          </div>

          {/* Recent History List */}
          {history.length > 0 && (
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6 mt-6">
              <h2 className="text-[#E8EEF7] font-bold mb-4">Recent Score Events</h2>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {[...history].reverse().map(h => (
                  <div key={h.id} className="flex items-center gap-3 bg-[#0B0F14]/40 rounded-xl px-4 py-2.5">
                    {h.delta > 0
                      ? <TrendingUp className="w-4 h-4 text-[#10B981] shrink-0" />
                      : <TrendingDown className="w-4 h-4 text-[#FF006E] shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E8EEF7] text-sm font-medium truncate">{h.reason}</p>
                      <p className="text-[#718096] text-xs">{h.scoreBefore} → {h.scoreAfter}</p>
                    </div>
                    <span className={`font-bold font-mono text-sm shrink-0 ${h.delta > 0 ? 'text-[#10B981]' : 'text-[#FF006E]'}`}>
                      {h.delta > 0 ? '+' : ''}{h.delta}
                    </span>
                    <span className="text-[#718096] text-xs shrink-0 ml-2">
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
  );
}
