import React, { useState } from 'react';
import { 
  ArrowUpCircle, Building, Smartphone, Send, 
  ShieldAlert, Lock, Fingerprint, Loader2, CheckCircle2 
} from 'lucide-react';

export default function Withdraw() {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Confirm, 3: Success
  const [targetType, setTargetType] = useState('BankAccount'); // BankAccount, UPI
  const [amount, setAmount] = useState('');
  
  // Specific to external transfers
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', ifsc: '' });
  const [upiId, setUpiId] = useState('');
  
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Limits
  const availableBalance = 25000.00;
  const dailyLimit = 50000.00;

  const handleValidation = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > availableBalance) {
      alert("Insufficient available balance tracking!");
      return;
    }
    setStep(2);
  };

  const executeWithdrawal = () => {
    if (otp.length !== 6) return;
    setIsProcessing(true);
    
    // Simulate Processing block length
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 2500);
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8 bg-[#0B0F14]">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-[#FF006E]/10 rounded-xl flex items-center justify-center">
            <ArrowUpCircle className="w-6 h-6 text-[#FF006E]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#E8EEF7] tracking-tight">Withdraw Funds</h1>
            <p className="text-[#A0AEC0] mt-1">Cash out securely to an external matrix.</p>
          </div>
        </div>

        {/* The Main UI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form / Wizard Column */}
          <div className="md:col-span-2">
            <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl min-h-[450px]">
              
              {/* STEP 1: FORM */}
              {step === 1 && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <h2 className="text-[#E8EEF7] font-bold mb-6 text-xl">Withdrawal Details</h2>
                  
                  <div className="flex bg-[#0B0F14] rounded-lg p-1 mb-6 border border-white/5">
                    <button onClick={() => setTargetType('BankAccount')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition ${targetType === 'BankAccount' ? 'bg-[#FF006E]/20 text-[#FF006E]' : 'text-[#718096] hover:text-[#E8EEF7]'}`}>
                      <Building className="w-4 h-4" /> Bank Account
                    </button>
                    <button onClick={() => setTargetType('UPI')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition ${targetType === 'UPI' ? 'bg-[#FF006E]/20 text-[#FF006E]' : 'text-[#718096] hover:text-[#E8EEF7]'}`}>
                      <Smartphone className="w-4 h-4" /> UPI ID
                    </button>
                  </div>

                  <form onSubmit={handleValidation} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">
                        Amount to Withdraw
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF006E] font-bold text-xl">₹</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          max={availableBalance}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-4 bg-[#0B0F14] border border-[#FF006E]/20 rounded-lg text-[#E8EEF7] text-xl font-bold placeholder-[#718096] focus:ring-2 focus:ring-[#FF006E] outline-none transition font-mono"
                        />
                      </div>
                    </div>

                    {targetType === 'UPI' ? (
                      <div>
                        <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">Linked UPI ID</label>
                        <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} required placeholder="name@bank" className="w-full px-4 py-3 bg-[#0B0F14] border border-[#00F0FF]/10 rounded-lg text-[#E8EEF7] focus:border-[#00F0FF] outline-none transition" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">Account Holder Name</label>
                          <input type="text" required placeholder="John Doe" className="w-full px-4 py-3 bg-[#0B0F14] border border-white/10 rounded-lg text-[#E8EEF7] focus:border-[#00F0FF] outline-none transition" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">Account No.</label>
                          <input type="text" required placeholder="123456789" className="w-full px-4 py-3 bg-[#0B0F14] border border-white/10 rounded-lg text-[#E8EEF7] focus:border-[#00F0FF] outline-none transition font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#A0AEC0] mb-2 uppercase tracking-wider">IFSC Code</label>
                          <input type="text" required placeholder="HDFC000123" className="w-full px-4 py-3 bg-[#0B0F14] border border-white/10 rounded-lg text-[#E8EEF7] focus:border-[#00F0FF] outline-none transition font-mono uppercase" />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#FF006E] hover:bg-[#E60063] text-white font-bold py-4 rounded-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,110,0.3)] mt-4"
                    >
                      Authenticate Outbound <img src="" alt="" className="hidden" /> {/* Force layout reset mock */} <Send className="w-4 h-4 ml-2" />
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: OTP CONFIRMATION */}
              {step === 2 && (
                <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col justify-center text-center">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 rounded-full mx-auto flex items-center justify-center border border-[#00F0FF]/30 mb-6">
                    <Lock className="w-8 h-8 text-[#00F0FF]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#E8EEF7] mb-2">Security Verification</h2>
                  <p className="text-[#A0AEC0] text-sm mb-8">Enter the 6-digit OTP sent to your registered device to authorize the deduction of <strong className="text-[#FF006E]">₹{amount}</strong>.</p>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full max-w-[200px] mx-auto text-center tracking-[0.75em] px-4 py-3 text-2xl font-bold bg-[#0B0F14] border border-[#00F0FF]/30 rounded-lg text-[#E8EEF7] focus:border-[#00F0FF] outline-none transition mb-8"
                  />

                  <div className="flex gap-4 max-w-sm mx-auto w-full">
                    <button onClick={() => setStep(1)} disabled={isProcessing} className="flex-1 px-4 py-3 bg-transparent border border-white/20 text-[#A0AEC0] rounded-lg hover:text-white transition">Back</button>
                    <button onClick={executeWithdrawal} disabled={isProcessing || otp.length !== 6} className="flex-1 px-4 py-3 bg-[#00F0FF] text-[#0B0F14] font-bold rounded-lg transition shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-105 disabled:opacity-50 flex justify-center items-center">
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Burn'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS */}
              {step === 3 && (
                 <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col justify-center text-center">
                   <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#10B981]/30">
                     <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
                   </div>
                   <h2 className="text-3xl font-bold text-[#E8EEF7] mb-2 tracking-tight">Processing Completed</h2>
                   <p className="text-[#10B981] font-bold text-sm bg-[#10B981]/10 w-max mx-auto px-3 py-1 rounded mb-6 uppercase tracking-widest">Status: Processing Outbound</p>
                   
                   <p className="text-[#A0AEC0] mb-8">Funds have been burned from your local ledger and are being routed externally.</p>

                   <div className="bg-[#0B0F14] border border-white/5 rounded-xl p-4 text-left max-w-sm mx-auto mb-8">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-xs text-[#718096] uppercase font-bold">Deducted</span>
                        <span className="text-[#FF006E] font-bold font-mono">- ₹{parseFloat(amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-xs text-[#718096] uppercase font-bold">New Available Balance</span>
                        <span className="text-[#E8EEF7] font-bold font-mono">₹{(availableBalance - parseFloat(amount)).toFixed(2)}</span>
                      </div>
                   </div>

                   <button onClick={() => { setStep(1); setAmount(''); setOtp(''); }} className="mx-auto block text-[#00F0FF] hover:underline text-sm font-semibold">
                     Make Another Withdrawal
                   </button>
                 </div>
              )}

            </div>
          </div>

          {/* Side Limits Column */}
          <div className="space-y-6">
            <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-[#E8EEF7] font-bold mb-4 border-b border-white/5 pb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#F59E0B]" /> Withdrawal Limits
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[#A0AEC0] text-xs uppercase tracking-wider font-semibold mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-[#10B981] font-mono">₹{availableBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                     <p className="text-[#A0AEC0] text-xs uppercase tracking-wider font-semibold">Daily Limit</p>
                     <p className="text-sm font-bold text-[#E8EEF7]">₹{dailyLimit.toLocaleString('en-IN')}</p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-[#0B0F14] rounded-full h-2 overflow-hidden border border-white/10">
                    <div className="bg-[#00F0FF] h-full w-[15%]"></div>
                  </div>
                  <p className="text-right text-[10px] text-[#718096] mt-1">₹7,500 used today</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-[#0B0F14] to-[#1A1F2E] border border-[#FF006E]/20 rounded-2xl p-6 shadow-lg">
               <Fingerprint className="w-6 h-6 text-[#FF006E] mb-3" />
               <p className="text-xs text-[#A0AEC0] leading-relaxed">
                 All outbound distributions require cryptographic OTP sign-off. High velocity transactions may temporarily trigger a manual fraud review.
               </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
