import React, { useState, useEffect } from 'react';
import {
  Zap, Plus, Play, Pause, Trash2, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, CalendarClock, TrendingDown, TrendingUp
} from 'lucide-react';
import api from '../api';

const FREQUENCIES = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'];
const CONDITION_TYPES = ['NONE', 'BALANCE_ABOVE', 'BALANCE_BELOW'];
const TRANSFER_TYPES = ['SCHEDULED', 'CONDITIONAL', 'SCHEDULED_CONDITIONAL'];

const conditionLabel = { NONE: 'No condition', BALANCE_ABOVE: 'If balance > amount', BALANCE_BELOW: 'If balance < amount' };
const statusColors = {
  ACTIVE: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
  PAUSED: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  COMPLETED: 'text-[#A0AEC0] bg-white/5 border-white/10',
  CANCELLED: 'text-[#FF006E] bg-[#FF006E]/10 border-[#FF006E]/30',
};
const execStatusIcon = { SUCCESS: <CheckCircle2 className="w-4 h-4 text-[#10B981]"/>, FAILED: <XCircle className="w-4 h-4 text-[#FF006E]"/>, SKIPPED: <AlertTriangle className="w-4 h-4 text-[#F59E0B]"/> };

function fmt(v) { return '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
function fmtDate(d) { return d ? new Date(d).toLocaleString('en-IN') : '—'; }

export default function SmartTransfers() {
  const [rules, setRules]         = useState([]);
  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [execHistory, setExecHistory] = useState({});
  const [msg, setMsg]             = useState({ text: '', type: 'success' });

  const [form, setForm] = useState({
    ruleName: '', amount: '', transferType: 'SCHEDULED', conditionType: 'NONE',
    conditionValue: '', frequency: 'MONTHLY', scheduleDay: '1',
    startDate: '', fromAccountId: '', toAccountId: '', description: ''
  });

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/smart-transfers'),
      api.get('/api/banking/accounts')
    ]).then(([rRules, rAccounts]) => {
      setRules(rRules.data.rules || []);
      const accs = rAccounts.data.accounts || [];
      setAccounts(accs);
      if (accs.length) setForm(f => ({ ...f, fromAccountId: String(accs[0].id) }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const refreshRules = () =>
    api.get('/api/smart-transfers').then(r => setRules(r.data.rules || []));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/smart-transfers', {
        ...form,
        amount: parseFloat(form.amount),
        conditionValue: form.conditionValue ? parseFloat(form.conditionValue) : null,
        scheduleDay: parseInt(form.scheduleDay) || null,
        fromAccountId: parseInt(form.fromAccountId),
        toAccountId: parseInt(form.toAccountId),
      });
      notify('Smart transfer rule created!');
      setShowForm(false);
      setForm(f => ({ ...f, ruleName: '', amount: '', description: '', conditionValue: '' }));
      refreshRules();
    } catch (e) { notify(e.response?.data?.message || 'Failed to create rule', 'error'); }
  };

  const handlePause = async (id) => {
    try { await api.patch(`/api/smart-transfers/${id}/pause`); notify('Rule paused'); refreshRules(); }
    catch (e) { notify(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleResume = async (id) => {
    try { await api.patch(`/api/smart-transfers/${id}/resume`); notify('Rule resumed'); refreshRules(); }
    catch (e) { notify(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this smart transfer rule?')) return;
    try { await api.delete(`/api/smart-transfers/${id}`); notify('Rule deleted'); refreshRules(); }
    catch (e) { notify(e.response?.data?.message || 'Error', 'error'); }
  };

  const loadHistory = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!execHistory[id]) {
      const r = await api.get(`/api/smart-transfers/${id}/executions`).catch(() => ({ data: { executions: [] } }));
      setExecHistory(h => ({ ...h, [id]: r.data.executions || [] }));
    }
  };

  const inputCls = "w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-2.5 text-[#E8EEF7] text-sm focus:outline-none focus:border-[#00F0FF] transition";
  const labelCls = "block text-[#A0AEC0] text-xs font-semibold uppercase tracking-wider mb-1.5";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF006E]/20 to-[#FF006E]/5 rounded-xl flex items-center justify-center border border-[#FF006E]/20">
            <Zap className="w-6 h-6 text-[#FF006E]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#E8EEF7]">Smart Transfers</h1>
            <p className="text-[#A0AEC0] text-sm">Programmable conditional &amp; scheduled money rules</p>
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF006E] to-[#D0005A] text-white font-bold rounded-xl hover:opacity-90 transition text-sm">
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {msg.text && (
        <div className={`mb-5 p-3 rounded-xl border text-sm font-medium ${msg.type === 'error' ? 'bg-[#FF006E]/10 border-[#FF006E]/30 text-[#FF006E]' : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'}`}>
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#FF006E]/20 rounded-2xl p-6 mb-6">
          <h2 className="text-[#E8EEF7] font-bold mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#FF006E]" /> Create Smart Transfer Rule
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2"><label className={labelCls}>Rule Name *</label>
              <input className={inputCls} value={form.ruleName} onChange={e=>setForm(f=>({...f,ruleName:e.target.value}))} placeholder="e.g. Monthly Savings" required />
            </div>

            <div><label className={labelCls}>Transfer Type *</label>
              <select className={inputCls} value={form.transferType} onChange={e=>setForm(f=>({...f,transferType:e.target.value}))}>
                {TRANSFER_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>

            <div><label className={labelCls}>Amount (₹) *</label>
              <input type="number" min="1" className={inputCls} value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="5000" required />
            </div>

            <div><label className={labelCls}>From Account *</label>
              <select className={inputCls} value={form.fromAccountId} onChange={e=>setForm(f=>({...f,fromAccountId:e.target.value}))} required>
                <option value="">Select account</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.accountNumber} ({fmt(a.balance)})</option>)}
              </select>
            </div>

            <div><label className={labelCls}>To Account ID *</label>
              <select className={inputCls} value={form.toAccountId} onChange={e=>setForm(f=>({...f,toAccountId:e.target.value}))} required>
                <option value="">Select recipient account</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType}</option>)}
              </select>
              <p className="text-[#4A5568] text-xs mt-1">For self-transfer between your accounts</p>
            </div>

            {(form.transferType === 'SCHEDULED' || form.transferType === 'SCHEDULED_CONDITIONAL') && (
              <>
                <div><label className={labelCls}>Frequency *</label>
                  <select className={inputCls} value={form.frequency} onChange={e=>setForm(f=>({...f,frequency:e.target.value}))}>
                    {FREQUENCIES.map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                {form.frequency === 'MONTHLY' && (
                  <div><label className={labelCls}>Day of Month (1–28)</label>
                    <input type="number" min="1" max="28" className={inputCls} value={form.scheduleDay} onChange={e=>setForm(f=>({...f,scheduleDay:e.target.value}))} />
                  </div>
                )}
                {form.frequency === 'ONCE' && (
                  <div><label className={labelCls}>Execution Date *</label>
                    <input type="date" className={inputCls} value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} />
                  </div>
                )}
              </>
            )}

            {(form.transferType === 'CONDITIONAL' || form.transferType === 'SCHEDULED_CONDITIONAL') && (
              <>
                <div><label className={labelCls}>Condition Type</label>
                  <select className={inputCls} value={form.conditionType} onChange={e=>setForm(f=>({...f,conditionType:e.target.value}))}>
                    {CONDITION_TYPES.map(c=><option key={c} value={c}>{conditionLabel[c]}</option>)}
                  </select>
                </div>
                {form.conditionType !== 'NONE' && (
                  <div><label className={labelCls}>Threshold Amount (₹)</label>
                    <input type="number" className={inputCls} value={form.conditionValue} onChange={e=>setForm(f=>({...f,conditionValue:e.target.value}))} placeholder="20000" />
                  </div>
                )}
              </>
            )}

            <div className="md:col-span-2"><label className={labelCls}>Description</label>
              <input className={inputCls} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional note..." />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-[#252C3C] text-[#A0AEC0] rounded-xl font-semibold text-sm">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#FF006E] to-[#D0005A] text-white font-bold rounded-xl text-sm hover:opacity-90 transition">Create Rule</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-12 text-center">
          <Zap className="w-12 h-12 text-[#252C3C] mx-auto mb-4" />
          <p className="text-[#E8EEF7] font-bold mb-1">No Smart Transfer Rules</p>
          <p className="text-[#718096] text-sm">Create your first rule to automate money transfers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      rule.status === 'ACTIVE' ? 'bg-[#10B981]/10' : 'bg-[#F59E0B]/10'
                    }`}>
                      {rule.status === 'ACTIVE' ? <TrendingUp className="w-4 h-4 text-[#10B981]"/> : <TrendingDown className="w-4 h-4 text-[#F59E0B]"/>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[#E8EEF7] font-bold">{rule.ruleName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusColors[rule.status] || 'text-[#A0AEC0]'}`}>
                          {rule.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <span className="text-[#00F0FF] font-bold text-sm">{fmt(rule.amount)}</span>
                        <span className="text-[#A0AEC0] text-xs">{rule.frequency} {rule.scheduleDay ? `• Day ${rule.scheduleDay}` : ''}</span>
                        {rule.conditionType !== 'NONE' && (
                          <span className="text-[#F59E0B] text-xs">{conditionLabel[rule.conditionType]} {rule.conditionValue ? fmt(rule.conditionValue) : ''}</span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[#718096] text-xs">From: <span className="text-[#A0AEC0] font-mono">{rule.fromAccountNumber}</span></span>
                        <span className="text-[#718096] text-xs">→ To: <span className="text-[#A0AEC0] font-mono">{rule.toAccountNumber}</span></span>
                      </div>
                      {rule.nextExecution && (
                        <p className="text-[#718096] text-xs mt-1 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" /> Next: {fmtDate(rule.nextExecution)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {rule.status === 'ACTIVE'
                      ? <button onClick={() => handlePause(rule.id)} title="Pause" className="p-2 hover:bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg transition"><Pause className="w-4 h-4"/></button>
                      : rule.status === 'PAUSED'
                        ? <button onClick={() => handleResume(rule.id)} title="Resume" className="p-2 hover:bg-[#10B981]/10 text-[#10B981] rounded-lg transition"><Play className="w-4 h-4"/></button>
                        : null
                    }
                    <button onClick={() => handleDelete(rule.id)} title="Delete" className="p-2 hover:bg-[#FF006E]/10 text-[#FF006E] rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                    <button onClick={() => loadHistory(rule.id)} className="p-2 hover:bg-white/5 text-[#A0AEC0] rounded-lg transition">
                      {expandedId === rule.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution History */}
              {expandedId === rule.id && (
                <div className="border-t border-white/5 px-5 py-4">
                  <p className="text-[#A0AEC0] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Execution History
                  </p>
                  {(execHistory[rule.id] || []).length === 0 ? (
                    <p className="text-[#718096] text-sm">No executions yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(execHistory[rule.id] || []).map(ex => (
                        <div key={ex.id} className="flex items-center gap-3 bg-[#0B0F14]/50 rounded-lg px-3 py-2">
                          {execStatusIcon[ex.status] || <Clock className="w-4 h-4 text-[#718096]"/>}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#E8EEF7] font-medium">{ex.status} {ex.amount ? `• ${fmt(ex.amount)}` : ''}</p>
                            {ex.failureReason && <p className="text-xs text-[#FF006E]">{ex.failureReason}</p>}
                            {ex.transactionLogId && <p className="text-xs text-[#718096] font-mono">{ex.transactionLogId}</p>}
                          </div>
                          <span className="text-[#718096] text-xs shrink-0">{fmtDate(ex.executedAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
