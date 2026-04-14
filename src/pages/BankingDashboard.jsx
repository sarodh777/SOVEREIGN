import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Plus, Building, Send, Download, Minus, FileText, Activity, 
  CreditCard, Search, Shield, Lock, Wallet, ArrowRight, RefreshCcw, 
  ShieldAlert, Fingerprint, User, Link as LinkIcon, PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function BankingDashboard() {
  const email = localStorage.getItem('userEmail') || 'operator@institution.com';
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Hardcoded for presentation / demo purposes logic as backend routes may not have all fields yet
  const accountOverview = {
    currentBalance: 125000.50,
    savingsBalance: 550000.00,
    lastTx: "-₹ 5000.00 (Merchant)",
    accountNumber: "ACC-49F1-A89",
    ifsc: "SOVL0001429",
    walletAddress: "0x71C...9B23",
  };

  const analyticsData = [
    { name: 'Income', value: 85000, color: '#10B981' },
    { name: 'Expense', value: 32000, color: '#FF006E' },
  ];

  // Using specific presentation data overriding plain state for Hackathon demo
  const mockTransactions = [
    { id: '1', date: '14 Apr', type: 'Credit', amount: '5000.00', status: 'Success', ref: 'Client Payment' },
    { id: '2', date: '13 Apr', type: 'Debit', amount: '2000.00', status: 'Pending', ref: 'Cloud Hosting' },
    { id: '3', date: '11 Apr', type: 'Debit', amount: '1250.00', status: 'Success', ref: 'Utility Bill' },
    { id: '4', date: '10 Apr', type: 'Credit', amount: '18000.00', status: 'Success', ref: 'Staking Reward' },
    { id: '5', date: '08 Apr', type: 'Debit', amount: '450.00', status: 'Failed', ref: 'Grocery' },
  ];

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = (tx.ref.toLowerCase() || '').includes(searchTerm.toLowerCase()) || tx.amount.includes(searchTerm);
    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status) => {
    if (status === 'Success') return <span className="bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded text-xs font-bold border border-[#10B981]/20">✅ Success</span>;
    if (status === 'Pending') return <span className="bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-1 rounded text-xs font-bold border border-[#F59E0B]/20">⏳ Pending</span>;
    return <span className="bg-[#FF006E]/10 text-[#FF006E] px-2 py-1 rounded text-xs font-bold border border-[#FF006E]/20">❌ Failed</span>;
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-[#00F0FF]/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#E8EEF7] tracking-tight flex items-center gap-2">
              <Building className="w-8 h-8 text-[#00F0FF]" />
              Core Banking
            </h1>
            <p className="text-[#A0AEC0] mt-1">Manage accounts, transfers, and ledger security.</p>
          </div>
          
          {/* Quick Banking Actions (Float Right Desktop) */}
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <Link to="/deposit" className="flex items-center gap-2 bg-[#00F0FF]/10 border border-[#00F0FF]/20 hover:bg-[#00F0FF]/20 text-[#00F0FF] px-4 py-2 rounded-lg transition text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add Money
            </Link>
            <Link to="/transfer" className="flex items-center gap-2 bg-[#0B0F14] border border-white/10 hover:border-[#F59E0B]/50 text-[#A0AEC0] hover:text-[#F59E0B] px-4 py-2 rounded-lg transition text-sm font-semibold">
              <Send className="w-4 h-4" /> Send Money
            </Link>
            <button className="flex items-center gap-2 bg-[#0B0F14] border border-white/10 hover:border-[#10B981]/50 text-[#A0AEC0] hover:text-[#10B981] px-4 py-2 rounded-lg transition text-sm font-semibold">
              <Download className="w-4 h-4" /> Request Money
            </button>
            <button className="flex items-center gap-2 bg-[#0B0F14] border border-white/10 hover:border-[#FF006E]/50 text-[#A0AEC0] hover:text-[#FF006E] px-4 py-2 rounded-lg transition text-sm font-semibold">
              <RefreshCcw className="w-4 h-4" /> Transfer Built-in
            </button>
          </div>
        </div>

        {/* TOP LAYER: Overview Cards (4 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-xl p-6 shadow-lg shadow-[#00F0FF]/5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#00F0FF]/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
            <p className="text-[#A0AEC0] text-sm font-semibold mb-1 uppercase tracking-wider">Current Balance</p>
            <h2 className="text-3xl font-bold text-[#E8EEF7]">₹ 1,25,000</h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#10B981] bg-[#10B981]/10 w-max px-2 py-1 rounded">
              <span>Checking Account</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/20 rounded-xl p-6 shadow-lg shadow-[#10B981]/5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#10B981]/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
            <p className="text-[#A0AEC0] text-sm font-semibold mb-1 uppercase tracking-wider">Savings Account</p>
            <h2 className="text-3xl font-bold text-[#E8EEF7]">₹ 5,50,000</h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#00F0FF] bg-[#00F0FF]/10 w-max px-2 py-1 rounded">
              <span>High-Yield</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-xl p-6 shadow-lg">
            <p className="text-[#A0AEC0] text-sm font-semibold mb-1 uppercase tracking-wider">Last Transaction</p>
            <h2 className="text-xl font-bold text-[#FF006E]">{accountOverview.lastTx}</h2>
            <p className="text-[#718096] text-xs mt-2">Just now</p>
          </div>

          <div className="bg-gradient-to-br from-[#0B0F14] to-[#1A1F2E] border-2 border-[#10B981]/30 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center text-center relative">
            <Shield className="w-8 h-8 text-[#10B981] mb-2" />
            <h2 className="text-lg font-bold text-[#10B981] uppercase tracking-widest">Active & Secure</h2>
            <div className="absolute top-4 right-4 w-3 h-3 bg-[#10B981] rounded-full animate-ping"></div>
            <div className="absolute top-4 right-4 w-3 h-3 bg-[#10B981] rounded-full"></div>
          </div>
        </div>

        {/* MIDDLE LAYER (3 columns) -> Identity | Mini Analytics | Blockchain */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Identity & Account Details (Col 1) */}
          <div className="bg-[#1A1F2E] border border-white/5 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="text-lg font-bold text-[#E8EEF7] mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#00F0FF]" /> Account Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#A0AEC0] uppercase tracking-wider mb-1">Account Number</p>
                <p className="font-mono text-[#E8EEF7] font-semibold text-lg bg-[#0B0F14] border border-white/5 px-3 py-1.5 rounded">{accountOverview.accountNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[#A0AEC0] uppercase tracking-wider mb-1">IFSC Code</p>
                <p className="font-mono text-[#10B981] font-semibold text-lg bg-[#0B0F14] border border-[#10B981]/20 px-3 py-1.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">{accountOverview.ifsc}</p>
              </div>
              <div>
                <p className="text-xs text-[#A0AEC0] uppercase tracking-wider mb-1">Web3 Wallet (Linked)</p>
                <div className="flex items-center gap-2 bg-[#0B0F14] px-3 py-1.5 rounded border border-[#00F0FF]/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                  <Wallet className="w-4 h-4 text-[#00F0FF]" />
                  <p className="font-mono text-[#E8EEF7] font-semibold">{accountOverview.walletAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Analytics (Col 2) */}
          <div className="bg-[#1A1F2E] border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
            <h3 className="text-lg font-bold text-[#E8EEF7] mb-2 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#F59E0B]" /> Mini Analytics
            </h3>
            <p className="text-xs text-[#A0AEC0] mb-4 border-b border-white/10 pb-3">Spending this week (Income vs Expense)</p>
            <div className="flex-1 w-full h-[200px] min-h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analyticsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {analyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#E8EEF7' }}
                    formatter={(value) => `₹ ${value}`}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blockchain & Alerts Stack (Col 3) */}
          <div className="flex flex-col gap-6">
            
            {/* Blockchain Transaction Info */}
            <div className="bg-gradient-to-b from-[#0B0F14] to-[#1A1F2E] border border-[#10B981]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-sm">
              <h3 className="text-[#10B981] font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <LinkIcon className="w-4 h-4" /> Blockchain Details
              </h3>
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[#718096]">Tx Hash</span>
                  <span className="text-[#00F0FF] cursor-help border-b border-dashed border-[#00F0FF]" title="0x8a7f92bA3B2c4F5E6D7E8F9A0B1C2D3E4F5A6B7C">0x8a7f...92b</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[#718096]">Block</span>
                  <span className="text-[#E8EEF7]">#45231</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[#718096]">Timestamp</span>
                  <span className="text-[#E8EEF7]">14 Apr, 10:42AM</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#718096]">Status</span>
                  <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded font-bold">Verified ✅</span>
                </div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="flex-1 bg-[#1A1F2E] border border-white/5 rounded-xl p-5 shadow-lg">
              <h3 className="text-[#FF006E] font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                <ShieldAlert className="w-4 h-4" /> Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2 items-start opacity-80">
                  <Fingerprint className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#E8EEF7]">"New login detected"</p>
                </div>
                <div className="flex gap-2 items-start opacity-80">
                  <LinkIcon className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#E8EEF7]">"Transaction verified on blockchain"</p>
                </div>
                <div className="flex gap-2 items-start opacity-100 bg-[#FF006E]/10 p-2 rounded border border-[#FF006E]/20">
                  <ShieldAlert className="w-4 h-4 text-[#FF006E] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#FF006E] font-semibold">"Suspicious activity alert deflected by logic gates."</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM LAYER: Full Filterable Transaction Table */}
        <div className="bg-[#1A1F2E] border border-white/5 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-[#E8EEF7]">Recent Transactions</h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                <input 
                  type="text" 
                  placeholder="Search ref or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition"
                />
              </div>
              
              <div className="bg-[#0B0F14] border border-white/10 rounded-lg p-1 flex">
                {['All', 'Credit', 'Debit'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${typeFilter === type ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-[#A0AEC0] hover:text-[#E8EEF7]'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[#A0AEC0] text-sm tracking-wider border-b border-white/5">
                  <th className="px-4 py-3 font-semibold uppercase">Date</th>
                  <th className="px-4 py-3 font-semibold uppercase">Type</th>
                  <th className="px-4 py-3 font-semibold uppercase">Amount</th>
                  <th className="px-4 py-3 font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 font-semibold uppercase text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="text-[#E8EEF7]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-[#0B0F14]/50 transition cursor-default">
                    <td className="px-4 py-4 text-sm text-[#A0AEC0] whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-4">
                      {tx.type === 'Credit' ? (
                        <span className="text-[#10B981] font-bold text-sm bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">Credit</span>
                      ) : (
                        <span className="text-[#FF006E] font-bold text-sm bg-[#FF006E]/10 px-2 py-0.5 rounded border border-[#FF006E]/20">Debit</span>
                      )}
                    </td>
                    <td className={`px-4 py-4 font-mono font-bold ${tx.type === 'Credit' ? 'text-[#10B981]' : 'text-[#E8EEF7]'}`}>
                      {tx.type === 'Credit' ? '+' : '-'}₹ {tx.amount}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-4 py-4 font-medium text-right text-sm text-[#A0AEC0]">{tx.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-10 text-[#718096]">
                No transactions match your current filters.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
