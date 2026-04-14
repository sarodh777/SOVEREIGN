import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, Send, Plus, Minus, TrendingUp, User, LayoutDashboard, 
  ShieldCheck, Activity, Link as LinkIcon, CheckCircle2, AlertTriangle, 
  Fingerprint, Calendar, Download, QrCode, Lock, History, Search, Cpu,
  ArrowDownRight, ArrowUpRight, Copy
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const email = localStorage.getItem('userEmail') || 'operator@institution.com';
  const displayName = email.split('@')[0].toUpperCase();
  const [txFilter, setTxFilter] = useState('all');

  // Chart Data
  const chartData = [
    { name: 'Nov', income: 85000, expenses: 42000 },
    { name: 'Dec', income: 90000, expenses: 58000 },
    { name: 'Jan', income: 110000, expenses: 61000 },
    { name: 'Feb', income: 105000, expenses: 54000 },
    { name: 'Mar', income: 125000, expenses: 48000 },
    { name: 'Apr', income: 140000, expenses: 65000 },
  ];

  // Transaction Data
  const allTransactions = [
    { id: 'TX-7A8B', date: '2026-04-14', amount: '12,500.00', type: 'Credit', status: 'Completed', ref: 'Salary Transfer', daysAgo: 0 },
    { id: 'TX-2B9C', date: '2026-04-13', amount: '4,200.00', type: 'Debit', status: 'Completed', ref: 'Merchant Payment', daysAgo: 1 },
    { id: 'TX-11DF', date: '2026-04-10', amount: '8,000.00', type: 'Debit', status: 'Pending', ref: 'Investment SIP', daysAgo: 4 },
    { id: 'TX-99EE', date: '2026-04-05', amount: '1,500.00', type: 'Credit', status: 'Completed', ref: 'Peer Transfer', daysAgo: 9 },
    { id: 'TX-44AA', date: '2026-03-28', amount: '2,000.00', type: 'Debit', status: 'Failed', ref: 'Utility Bill', daysAgo: 17 },
  ];

  const filteredData = allTransactions.filter(tx => {
    if (txFilter === '7days') return tx.daysAgo <= 7;
    if (txFilter === '30days') return tx.daysAgo <= 30;
    return true;
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP ROW: Profile (1 col) & Account Summary (3 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-[#00F0FF] to-[#FF006E] rounded-full p-0.5">
                <div className="w-full h-full bg-[#0B0F14] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#E8EEF7]" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#E8EEF7]">{displayName}</h2>
                <p className="text-sm text-[#A0AEC0] truncate max-w-[150px]">{email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0B0F14]/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider font-semibold">Account Number</p>
                <div className="flex justify-between items-center">
                  <p className="font-mono text-[#E8EEF7] font-bold">ACC-49F1-A89</p>
                  <button onClick={() => copyToClipboard('ACC-49F1-A89')} className="text-[#00F0FF] hover:text-white transition"><Copy className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="bg-[#0B0F14]/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider font-semibold">Web3 Wallet</p>
                <div className="flex justify-between items-center">
                  <p className="font-mono text-[#00F0FF] font-bold">0x71C...9B23</p>
                  <button onClick={() => copyToClipboard('0x71C9D2E4F8B23')} className="text-[#00F0FF] hover:text-white transition"><Copy className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-2xl group-hover:bg-[#00F0FF]/10 transition duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-[#00F0FF]" />
                  <p className="text-[#A0AEC0] font-semibold tracking-wider text-sm uppercase">Total Balance</p>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-[#E8EEF7] tracking-tight">₹ 1,25,000</h1>
                <p className="text-[#10B981] text-sm mt-2 flex items-center gap-1 font-semibold"><TrendingUp className="w-4 h-4"/> +14.2% from last month</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/20 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#10B981]/5 rounded-full blur-2xl group-hover:bg-[#10B981]/10 transition duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  <p className="text-[#A0AEC0] font-semibold tracking-wider text-sm uppercase">Available Balance</p>
                </div>
                <h1 className="text-4xl font-bold text-[#E8EEF7] tracking-tight">₹ 1,00,000</h1>
                <p className="text-[#A0AEC0] text-sm mt-2 font-medium">Ready for transfer</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0B0F14] to-[#1A1F2E] border border-[#F59E0B]/20 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#F59E0B]/5 rounded-full blur-2xl group-hover:bg-[#F59E0B]/10 transition duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-[#F59E0B]" />
                  <p className="text-[#A0AEC0] font-semibold tracking-wider text-sm uppercase">Locked (Blockchain)</p>
                </div>
                <h1 className="text-4xl font-bold text-[#F59E0B] tracking-tight">₹ 25,000</h1>
                <p className="text-[#A0AEC0] text-sm mt-2 font-medium">Staked in smart contracts</p>
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE ROW: Analytics (3 cols) & Quick Actions (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* AI Analytics Chart */}
          <div className="lg:col-span-3 bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#E8EEF7] flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#00F0FF]" />
                  AI Spending Analytics
                </h2>
                <p className="text-[#A0AEC0] text-sm mt-1">Income vs Expenses (6-Month Projection)</p>
              </div>
              <select className="bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg px-3 py-1.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF]">
                <option>Last 6 Months</option>
                <option>Year to Date</option>
              </select>
            </div>
            
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF006E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF006E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252C3C" vertical={false} />
                  <XAxis dataKey="name" stroke="#A0AEC0" axisLine={false} tickLine={false} />
                  <YAxis stroke="#A0AEC0" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F14', borderColor: '#00F0FF', borderRadius: '8px', color: '#E8EEF7' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#FF006E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#E8EEF7] mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/transfer" className="flex flex-col items-center justify-center bg-[#0B0F14] border border-white/5 hover:border-[#00F0FF]/50 p-4 rounded-xl transition transform hover:-translate-y-1 group">
                <Send className="w-8 h-8 text-[#00F0FF] mb-2 group-hover:scale-110 transition" />
                <span className="text-sm font-semibold text-[#A0AEC0] group-hover:text-[#E8EEF7]">Send</span>
              </Link>
              <Link to="/deposit" className="flex flex-col items-center justify-center bg-[#0B0F14] border border-white/5 hover:border-[#10B981]/50 p-4 rounded-xl transition transform hover:-translate-y-1 group">
                <ArrowDownRight className="w-8 h-8 text-[#10B981] mb-2 group-hover:scale-110 transition" />
                <span className="text-sm font-semibold text-[#A0AEC0] group-hover:text-[#E8EEF7]">Request</span>
              </Link>
              <button className="flex flex-col items-center justify-center bg-[#0B0F14] border border-white/5 hover:border-[#F59E0B]/50 p-4 rounded-xl transition transform hover:-translate-y-1 group">
                <QrCode className="w-8 h-8 text-[#F59E0B] mb-2 group-hover:scale-110 transition" />
                <span className="text-sm font-semibold text-[#A0AEC0] group-hover:text-[#E8EEF7]">Scan QR</span>
              </button>
              <button className="flex flex-col items-center justify-center bg-[#0B0F14] border border-white/5 hover:border-[#FF006E]/50 p-4 rounded-xl transition transform hover:-translate-y-1 group">
                <User className="w-8 h-8 text-[#FF006E] mb-2 group-hover:scale-110 transition" />
                <span className="text-sm font-semibold text-[#A0AEC0] group-hover:text-[#E8EEF7]">Add Ben.</span>
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: Blockchain Verification (2 col) & Notifications (2 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Blockchain Verification Panel */}
          <div className="bg-[#0B0F14] border border-[#10B981]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10B981] to-[#00F0FF]"></div>
            <h2 className="text-xl font-bold text-[#E8EEF7] mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#10B981]" />
              Blockchain Synchronization
            </h2>
            
            <div className="space-y-4 font-mono">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-[#A0AEC0] text-sm">Last Synced Block:</span>
                <span className="text-[#00F0FF] font-bold animate-pulse">#14,295,301</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-[#A0AEC0] text-sm">Network Status:</span>
                <span className="flex items-center gap-2 text-[#10B981] font-bold bg-[#10B981]/10 px-3 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></div>
                  ONLINE & VERIFIED
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[#A0AEC0] text-sm block mb-2">Latest Contract Hash:</span>
                <div className="bg-[#1A1F2E] p-3 rounded border border-white/5 text-xs text-[#E8EEF7] flex justify-between items-center group cursor-pointer hover:border-[#10B981]/50 transition">
                  <span className="truncate max-w-[280px]">0x9f8f72aa9304c8b593d555f12ef6589cc3a5a...</span>
                  <Copy className="w-4 h-4 text-[#A0AEC0] group-hover:text-[#10B981]" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications / Alerts */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[#E8EEF7] mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF006E]" />
              Security & Alerts
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start p-3 bg-[#0B0F14]/50 rounded-lg border border-white/5 border-l-2 border-l-[#10B981]">
                <Fingerprint className="w-5 h-5 text-[#10B981] mt-0.5" />
                <div>
                  <h4 className="text-[#E8EEF7] text-sm font-bold">New Login Detected</h4>
                  <p className="text-[#A0AEC0] text-xs mt-1">Authorized login from Windows device (192.168.1.4)</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-[#0B0F14]/50 rounded-lg border border-white/5 border-l-2 border-l-[#F59E0B]">
                <Activity className="w-5 h-5 text-[#F59E0B] mt-0.5" />
                <div>
                  <h4 className="text-[#E8EEF7] text-sm font-bold">Smart Contract Executed</h4>
                  <p className="text-[#A0AEC0] text-xs mt-1">Yield farming auto-compound succeeded.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 bg-[#0B0F14]/50 rounded-lg border border-white/5 border-l-2 border-l-[#FF006E]">
                <AlertTriangle className="w-5 h-5 text-[#FF006E] mt-0.5" />
                <div>
                  <h4 className="text-[#E8EEF7] text-sm font-bold">Fraud System Active</h4>
                  <p className="text-[#A0AEC0] text-xs mt-1">AI sentinel monitoring 0 anomalous patterns currently.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FULL WIDTH: Transaction History Table */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-[#E8EEF7] flex items-center gap-2">
              <History className="w-5 h-5 text-[#00F0FF]" />
              Transaction History
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg pl-9 pr-4 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition"
                />
              </div>
              <select 
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg px-4 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF]"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="7days">Last 7 Days</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#00F0FF]/20 text-[#A0AEC0] text-sm uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[#E8EEF7]">
                {filteredData.map((tx, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-4 text-sm text-[#A0AEC0]">{tx.date}</td>
                    <td className="px-4 py-4 font-medium">{tx.ref}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex w-max items-center gap-1 ${
                        tx.type === 'Credit' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#FF006E]/10 text-[#FF006E]'
                      }`}>
                        {tx.type === 'Credit' ? <ArrowDownRight className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-4 font-mono font-bold ${tx.type === 'Credit' ? 'text-[#10B981]' : 'text-[#E8EEF7]'}`}>
                      {tx.type === 'Credit' ? '+' : '-'}₹ {tx.amount}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-bold border ${
                        tx.status === 'Completed' ? 'border-[#10B981]/20 text-[#10B981] bg-[#10B981]/5' : 
                        tx.status === 'Pending' ? 'border-[#F59E0B]/20 text-[#F59E0B] bg-[#F59E0B]/5' : 
                        'border-[#FF006E]/20 text-[#FF006E] bg-[#FF006E]/5'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="text-center py-12 text-[#A0AEC0]">
                No transactions found for the selected filter.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
