import React, { useState } from 'react';
import { 
  ArrowDownCircle, Smartphone, CreditCard, Building, Link as LinkIcon, 
  QrCode, ArrowRight, CheckCircle2, Copy, Loader2, List
} from 'lucide-react';

export default function Deposit() {
  const [step, setStep] = useState(1); // 1: Input, 2: Payment UI, 3: Success
  const [method, setMethod] = useState('UPI'); // UPI, NetBanking, Card, Crypto
  const [amount, setAmount] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const depositHistory = [
    { id: 'TX-9901', date: '14 Apr, 09:30 AM', method: 'UPI', amount: '15000.00', status: 'Success' },
    { id: 'TX-9844', date: '10 Apr, 14:15 PM', method: 'Crypto', amount: '50000.00', status: 'Success' },
    { id: 'TX-9721', date: '05 Apr, 11:00 AM', method: 'Debit Card', amount: '2000.00', status: 'Failed' },
  ];

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setStep(2);
  };

  const simulatePaymentSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setReceiptData({
        hash: generatedHash,
        amount: amount,
        method: method,
        timestamp: new Date().toLocaleString()
      });
      setIsProcessing(false);
      setStep(3);
    }, 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8 bg-[#0B0F14]">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#E8EEF7] tracking-tight">Deposit Funds</h1>
            <p className="text-[#A0AEC0] mt-1">Add capital securely to your Sovereign account.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Action Area */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[400px]">
              
              {/* STEP 1: INITIAL FORM */}
              {step === 1 && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <h2 className="text-lg font-bold text-[#E8EEF7] mb-6">Select Deposit Method</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {['UPI', 'NetBanking', 'Card', 'Crypto'].map((m) => (
                      <button 
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${method === m ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]' : 'bg-[#0B0F14] border-white/10 text-[#718096] hover:border-white/30 hover:text-white'}`}
                      >
                        {m === 'UPI' && <Smartphone className="w-6 h-6 mb-2" />}
                        {m === 'NetBanking' && <Building className="w-6 h-6 mb-2" />}
                        {m === 'Card' && <CreditCard className="w-6 h-6 mb-2" />}
                        {m === 'Crypto' && <LinkIcon className="w-6 h-6 mb-2" />}
                        <span className="text-xs font-bold">{m} {m === 'Crypto' && '🔥'}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleProceedToPayment} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">
                        Amount to Deposit
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] font-bold text-xl">₹</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          min="100"
                          placeholder="1000.00"
                          className="w-full pl-10 pr-4 py-4 bg-[#0B0F14] border border-[#10B981]/20 rounded-lg text-[#E8EEF7] text-xl font-bold placeholder-[#718096] focus:ring-2 focus:ring-[#10B981] outline-none transition font-mono"
                        />
                      </div>
                      <p className="text-xs text-[#718096] mt-2">Minimum deposit: ₹100</p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-4 rounded-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-6"
                    >
                      Proceed to {method} Payment <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: PAYMENT UI (QR / Crypto / Gateway) */}
              {step === 2 && (
                <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col justify-center">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[#E8EEF7]">Complete Payment</h2>
                    <p className="text-[#A0AEC0]">Pay exactly <span className="font-bold text-[#10B981]">₹{parseFloat(amount).toFixed(2)}</span> via {method}</p>
                  </div>

                  <div className="bg-[#0B0F14] border border-white/10 rounded-xl p-8 max-w-sm mx-auto w-full text-center">
                    
                    {method === 'UPI' && (
                      <div className="space-y-4">
                        <div className="w-48 h-48 bg-white rounded-xl mx-auto flex items-center justify-center p-2">
                          <QrCode className="w-full h-full text-black" />
                        </div>
                        <p className="text-xs text-[#A0AEC0]">Scan from any UPI App (GPay, PhonePe)</p>
                      </div>
                    )}

                    {method === 'Crypto' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-[#FF006E]/10 rounded-full mx-auto flex items-center justify-center border border-[#FF006E]/30">
                          <LinkIcon className="w-8 h-8 text-[#FF006E]" />
                        </div>
                        <div className="bg-[#1A1F2E] p-3 rounded border border-white/5 text-left">
                          <p className="text-[10px] text-[#A0AEC0] uppercase mb-1">Deposit Address (ERC-20)</p>
                          <p className="text-xs text-[#00F0FF] font-mono break-all select-all">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</p>
                        </div>
                        <p className="text-xs text-[#FF006E]">Send strictly USDT equivalents.</p>
                      </div>
                    )}

                    {(method === 'NetBanking' || method === 'Card') && (
                      <div className="space-y-4">
                        <Loader2 className="w-12 h-12 text-[#00F0FF] animate-spin mx-auto" />
                        <p className="text-sm text-[#A0AEC0]">Connecting to Secure Gateway Gateway...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mt-8 max-w-sm mx-auto w-full">
                    <button onClick={() => setStep(1)} disabled={isProcessing} className="flex-1 px-4 py-3 bg-transparent border border-white/20 text-[#A0AEC0] rounded-lg hover:text-white transition">
                      Cancel
                    </button>
                    <button onClick={simulatePaymentSuccess} disabled={isProcessing} className="flex-1 px-4 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center">
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simulate Success'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS RECEIPT */}
              {step === 3 && receiptData && (
                <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col justify-center text-center">
                  <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#10B981]/30">
                    <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#E8EEF7] mb-2 tracking-tight">Amount Credited</h2>
                  <p className="text-[#10B981] font-bold text-xl font-mono mb-8">+ ₹{parseFloat(receiptData.amount).toFixed(2)}</p>

                  <div className="bg-[#0B0F14] rounded-xl p-5 space-y-4 mb-8 font-mono text-sm border border-white/5 text-left max-w-sm mx-auto">
                    <div>
                      <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">Transaction / Hash ID</p>
                      <div className="flex items-center justify-between bg-[#1A1F2E] p-2 rounded border border-[#00F0FF]/20 text-[#00F0FF]">
                        <span className="truncate pr-4 select-all">{receiptData.hash}</span>
                        <Copy onClick={() => copyToClipboard(receiptData.hash)} className="w-4 h-4 cursor-pointer hover:text-white shrink-0"/>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">Method</p>
                        <p className="text-[#E8EEF7] font-bold">{receiptData.method}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">New Balance</p>
                        <p className="text-[#10B981] font-bold inline-flex items-center gap-1">₹1,40,000.50</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setStep(1); setAmount(''); }}
                    className="w-full max-w-sm mx-auto bg-[#0B0F14] hover:bg-[#252C3C] border border-white/20 text-[#E8EEF7] font-bold py-3 rounded-lg transition"
                  >
                    Deposit More Funds
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Right Sidebar: History & Limits */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-4">
                <List className="w-5 h-5 text-[#00F0FF]" /> Deposit History
              </h3>
              <div className="space-y-4 mt-4">
                {depositHistory.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <p className="text-[#E8EEF7] font-bold text-sm">₹{parseFloat(tx.amount).toFixed(2)}</p>
                      <p className="text-[#718096] text-[10px] uppercase font-semibold">{tx.method} • {tx.date}</p>
                    </div>
                    {tx.status === 'Success' ? (
                      <span className="bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded text-xs font-bold border border-[#10B981]/20">✅</span>
                    ) : (
                      <span className="bg-[#FF006E]/10 text-[#FF006E] px-2 py-1 rounded text-xs font-bold border border-[#FF006E]/20">❌</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B0F14] border border-[#10B981]/30 rounded-2xl p-6 shadow-lg">
               <h3 className="text-[#E8EEF7] font-bold mb-2">Auto-Refresh Protocol</h3>
               <p className="text-xs text-[#A0AEC0]">Your balances are linked directly to the Sovereign node. Deposits reflect automatically upon 3 network confirmations.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
