import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Send, ArrowRight, Wallet, Building, Link as LinkIcon, QrCode, 
  ChevronDown, CheckCircle2, Copy, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';

export default function Transfer() {
  const [step, setStep] = useState(1); // 1: Setup, 2: Confirm, 3: Receipt
  const [transferType, setTransferType] = useState('Blockchain'); // Internal, External, Blockchain
  
  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [customAddress, setCustomAddress] = useState(''); // Used for manual Wallet/IFSC
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  const email = localStorage.getItem('userEmail') || 'operator@institution.com';

  const savedBeneficiaries = [
    { id: 1, name: 'Rahul (Personal)', address: '0x3F2a...91B2' },
    { id: 2, name: 'Exchange Deposit', address: '0x99B1...F00A' },
    { id: 3, name: 'TechCorp Salary', address: 'ACC-891-TECH' },
  ];

  // Optional true backend connect, using mockup fallback if not running
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get(`/api/banking/accounts/${email}`);
      if (response.data.success && response.data.accounts.length > 0) {
        setAccounts(response.data.accounts);
      } else {
        throw new Error("Using mock data");
      }
    } catch (error) {
      setAccounts([{ id: 1, accountNumber: "ACC-49F1-A89", balance: 125000 }]);
      setFromAccountId(1);
    }
  };

  // State Transitions
  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (!amount || (!beneficiary && !customAddress)) return;
    setStep(2);
  };

  const handleExecuteTransfer = () => {
    setIsProcessing(true);
    
    // Simulate Backend/Blockchain Sync
    setTimeout(() => {
      const generatedHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setReceiptData({
        hash: generatedHash,
        target: beneficiary || customAddress,
        amountSent: amount,
        fee: calculateFee(),
        timestamp: new Date().toLocaleString()
      });
      setIsProcessing(false);
      setStep(3);
    }, 2500);
  };

  const calculateFee = () => {
    if (!amount) return '0.00';
    const numAmount = parseFloat(amount);
    if (transferType === 'Blockchain') return '2.50'; // Flat gas mock
    if (transferType === 'External') return (numAmount * 0.002).toFixed(2); // 0.2%
    return '0.00'; // Internal is free
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // --- RENDERING STEP 1: SETUP ---
  if (step === 1) {
    return (
      <div className="w-full min-h-screen p-6 md:p-8 bg-[#0B0F14]">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-[#00F0FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#E8EEF7] tracking-tight">Send Funds</h1>
              <p className="text-[#A0AEC0] mt-1">Execute secure transactions across ledgers.</p>
            </div>
          </div>

          <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6 shadow-xl">
            {/* Type Selector */}
            <div className="flex bg-[#0B0F14] rounded-lg p-1 mb-8 border border-white/5">
              <button onClick={() => setTransferType('Internal')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition ${transferType === 'Internal' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-[#718096] hover:text-[#E8EEF7]'}`}>
                <Wallet className="w-4 h-4" /> Internal
              </button>
              <button onClick={() => setTransferType('External')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition ${transferType === 'External' ? 'bg-[#10B981]/20 text-[#10B981]' : 'text-[#718096] hover:text-[#E8EEF7]'}`}>
                <Building className="w-4 h-4" /> External Bank
              </button>
              <button onClick={() => setTransferType('Blockchain')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition ${transferType === 'Blockchain' ? 'bg-[#FF006E]/20 text-[#FF006E]' : 'text-[#718096] hover:text-[#E8EEF7]'}`}>
                <LinkIcon className="w-4 h-4" /> Blockchain 🔥
              </button>
            </div>

            <form onSubmit={handleProceedToConfirm} className="space-y-6">
              
              {/* Recipient Input */}
              <div>
                <label className="text-xs font-semibold text-[#A0AEC0] mb-2 flex justify-between uppercase tracking-wider">
                  <span>Destination / Recipient</span>
                  <button type="button" className="text-[#00F0FF] hover:underline flex items-center gap-1 font-normal capitalize">
                    <QrCode className="w-3 h-3" /> Scan QR
                  </button>
                </label>
                <div className="relative mb-3">
                  <select 
                    value={beneficiary} 
                    onChange={(e) => { setBeneficiary(e.target.value); setCustomAddress(''); }}
                    className="w-full px-4 py-3 bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg text-[#E8EEF7] focus:ring-2 focus:ring-[#00F0FF] outline-none transition appearance-none"
                  >
                    <option value="">-- Choose Saved Beneficiary --</option>
                    {savedBeneficiaries.map(b => (
                      <option key={b.id} value={b.name}>{b.name} ({b.address})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
                </div>
                
                {!beneficiary && (
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    required
                    placeholder={transferType === 'Blockchain' ? 'Wallet Address (0x...)' : transferType === 'External' ? 'Account Number + IFSC' : 'Internal SL Account Number'}
                    className="w-full px-4 py-3 bg-[#0B0F14] border border-[#00F0FF]/10 rounded-lg text-[#E8EEF7] placeholder-[#718096] focus:border-[#00F0FF] outline-none transition font-mono"
                  />
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">
                  Amount to Send
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] font-bold text-xl">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 bg-[#0B0F14] border border-[#10B981]/20 rounded-lg text-[#E8EEF7] text-xl font-bold placeholder-[#718096] focus:ring-2 focus:ring-[#10B981] outline-none transition font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#718096] font-semibold">
                    Current Balance: ₹1,25,000.50
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What is this for?"
                  className="w-full px-4 py-3 bg-[#0B0F14] border border-white/10 rounded-lg text-[#E8EEF7] placeholder-[#718096] focus:border-[#00F0FF] outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] hover:from-[#00D4E0] hover:to-[#00A8BC] text-[#0B0F14] font-bold py-4 rounded-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] mt-6"
              >
                Proceed to Confirmation <ArrowRight className="w-5 h-5" />
              </button>

            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING STEP 2: CONFIRM ---
  if (step === 2) {
    const fee = calculateFee();
    const total = (parseFloat(amount) + parseFloat(fee)).toFixed(2);

    return (
      <div className="w-full min-h-screen p-6 md:p-8 bg-[#0B0F14] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#1A1F2E] border border-[#F59E0B]/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative">
          
          <button onClick={() => setStep(1)} className="absolute top-6 left-6 text-[#718096] hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-[#E8EEF7] text-center mb-8 mt-2">Confirm Transfer</h2>

          <div className="bg-[#0B0F14] rounded-xl p-5 border border-white/5 space-y-4 mb-8">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-[#A0AEC0] text-sm">Mode</span>
              <span className={`font-bold px-2 py-0.5 rounded text-xs ${transferType === 'Blockchain' ? 'bg-[#FF006E]/10 text-[#FF006E]' : 'bg-[#00F0FF]/10 text-[#00F0FF]'}`}>{transferType} Transfer</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-[#A0AEC0] text-sm">Recipient</span>
              <span className="text-[#E8EEF7] font-semibold text-right max-w-[200px] truncate">{beneficiary || customAddress}</span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                 <span className="text-[#A0AEC0] text-sm">Amount</span>
                 <span className="text-[#E8EEF7] font-mono">₹{parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[#718096] text-sm flex items-center gap-1">Network Fee <AlertCircle className="w-3 h-3"/></span>
                 <span className="text-[#F59E0B] font-mono">+ ₹{fee}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-2">
               <span className="text-[#E8EEF7] font-bold text-lg">Total</span>
               <span className="text-[#10B981] font-bold text-2xl font-mono">₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleExecuteTransfer}
            disabled={isProcessing}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Nodes...</>
            ) : (
              <><ShieldAlert className="w-5 h-5"/> Confirm & Authenticate</>
            )}
          </button>

        </div>
      </div>
    );
  }

  // --- RENDERING STEP 3: RECEIPT ---
  if (step === 3 && receiptData) {
    return (
      <div className="w-full min-h-screen p-6 md:p-8 bg-[#0B0F14] flex items-center justify-center">
        <div className="max-w-lg w-full bg-[#1A1F2E] border border-[#10B981]/40 rounded-2xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#10B981] to-[#00F0FF]"></div>
          
          <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#10B981]/30 mt-4">
            <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
          </div>
          
          <h2 className="text-3xl font-bold text-[#E8EEF7] text-center mb-2 tracking-tight">Transfer Verified</h2>
          <p className="text-[#10B981] text-center font-bold mb-8 uppercase tracking-widest text-sm bg-[#10B981]/10 w-max mx-auto px-3 py-1 rounded">Status: Success</p>

          <div className="bg-[#0B0F14] rounded-xl p-5 space-y-4 mb-8 font-mono text-sm border border-white/5">
            <div>
              <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">Ledger Tx Hash</p>
              <div className="flex items-center justify-between bg-[#1A1F2E] p-2 rounded border border-[#00F0FF]/20 text-[#00F0FF]">
                <span className="truncate pr-4 select-all">{receiptData.hash}</span>
                <Copy onClick={() => copyToClipboard(receiptData.hash)} className="w-4 h-4 cursor-pointer hover:text-white shrink-0"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">Amount Sent</p>
                <p className="text-[#E8EEF7] font-bold">₹{parseFloat(receiptData.amountSent).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">Timestamp</p>
                <p className="text-[#A0AEC0]">{receiptData.timestamp}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-[#718096] uppercase tracking-wider text-[10px] mb-1 font-sans font-bold">Destination</p>
              <p className="text-[#E8EEF7] truncate">{receiptData.target}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setAmount('');
              setNote('');
              setBeneficiary('');
              setCustomAddress('');
            }}
            className="w-full bg-[#0B0F14] hover:bg-[#1A1F2E] border border-white/20 text-[#E8EEF7] font-bold py-3 rounded-lg transition"
          >
            Initiate New Transfer
          </button>
        </div>
      </div>
    );
  }

  return null;
}
