import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, EyeOff, Eye, UploadCloud, 
  ShieldCheck, Banknote, Fingerprint, ChevronRight, CheckCircle2, Copy, Link as LinkIcon
} from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    accountType: 'Savings', initialDeposit: '', currency: '₹ INR',
    securityPin: '', securityQuestion: '', securityAnswer: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [cryptoWallet, setCryptoWallet] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateWallet = () => {
    // Generate a simulated cryptographic wallet pair on the fly!
    const randomHex = (size) => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setCryptoWallet({
      address: '0x' + randomHex(40),
      publicKey: '0x04' + randomHex(128),
      privateKey: '0x' + randomHex(64),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay and Blockchain sync
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    }, 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (isSuccessModalOpen) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-6 bg-gradient-to-br from-[#0B0F14] via-[#0B0F14] to-[#1A1F2E]">
        <div className="bg-[#1A1F2E] border border-[#10B981]/30 p-10 rounded-2xl max-w-2xl w-full text-center shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#10B981] to-[#00F0FF]"></div>
          
          <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#10B981]/30">
            <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
          </div>
          
          <h1 className="text-3xl font-bold text-[#E8EEF7] mb-2 tracking-tight">Account Created Successfully!</h1>
          <p className="text-[#A0AEC0] mb-8">Your Sovereign Ledger banking and blockchain identity have been synced.</p>

          <div className="space-y-4 text-left max-w-md mx-auto">
            <div className="bg-[#0B0F14] border border-white/5 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-[#A0AEC0] uppercase tracking-wider font-semibold mb-1">Account Number</p>
                <p className="font-mono text-xl font-bold text-[#E8EEF7]">ACC-{Math.floor(1000 + Math.random() * 9000)}-SL</p>
              </div>
            </div>
            
            <div className="bg-[#0B0F14] border border-white/5 p-4 rounded-xl flex justify-between items-center group">
              <div className="w-full">
                <p className="text-xs text-[#A0AEC0] uppercase tracking-wider font-semibold mb-1">Web3 Wallet Address</p>
                <div className="flex justify-between items-center w-full">
                  <p className="font-mono text-[#00F0FF] truncate pr-4">{cryptoWallet?.address || '0xA7F...92B'}</p>
                  <button onClick={() => copyToClipboard(cryptoWallet?.address)} className="text-[#A0AEC0] hover:text-[#00F0FF]"><Copy className="w-4 h-4"/></button>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0F14] border border-white/5 p-4 rounded-xl flex justify-between items-center border-l-4 border-l-[#10B981]">
              <div>
                <p className="text-xs text-[#A0AEC0] uppercase tracking-wider font-semibold mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-[#10B981] tracking-tight">{formData.currency.split(' ')[0]} {formData.initialDeposit || '0.00'}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="mt-8 w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#00F0FF] to-[#FF006E] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-105 transition transform flex items-center justify-center gap-2 mx-auto"
          >
            Login to Dashboard <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0B0F14] to-[#1A1F2E]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#00F0FF]/10 rounded-xl border border-[#00F0FF]/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#00F0FF]" />
            </div>
            <span className="text-[#E8EEF7] text-2xl font-bold tracking-tight">Sovereign Ledger</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#E8EEF7]">Create Secure Account</h1>
          <p className="text-[#A0AEC0] mt-2">Initialize your banking & blockchain identity in one step.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* COLUMN 1: Identity & Security */}
            <div className="space-y-8">
              
              {/* Basic Details */}
              <div className="bg-[#1A1F2E] p-6 rounded-xl border border-white/5 shadow-lg">
                <h3 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                  <User className="w-4 h-4 text-[#00F0FF]" /> Basic User Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                      <input required type="text" name="fullName" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" placeholder="John Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                      <input required type="email" name="email" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                      <input required type="tel" name="phone" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" placeholder="+91 9876543210" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                        <input required type={showPassword ? "text" : "password"} name="password" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-10 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#00F0FF]">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Confirm Password</label>
                      <input required type={showPassword ? "text" : "password"} name="confirmPassword" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Setup */}
              <div className="bg-[#1A1F2E] p-6 rounded-xl border border-white/5 shadow-lg border-l-4 border-l-[#F59E0B]">
                <h3 className="text-[#F59E0B] font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                  <Fingerprint className="w-4 h-4" /> Security Setup
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">4-Digit Auth PIN</label>
                    <input required type="password" name="securityPin" onChange={handleInputChange} maxLength="4" className="w-full text-center tracking-[1em] font-bold text-xl bg-[#0B0F14] border border-[#F59E0B]/30 rounded-lg px-4 py-2 text-[#E8EEF7] focus:outline-none focus:border-[#F59E0B] transition placeholder:text-sm placeholder:tracking-normal placeholder:font-normal" placeholder="Enter PIN" />
                  </div>
                  <div>
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Security Question (Recovery)</label>
                    <select name="securityQuestion" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition appearance-none">
                      <option value="">Select a question...</option>
                      <option value="pet">What was your first pet's name?</option>
                      <option value="city">In what city were you born?</option>
                      <option value="crypto">What was your first cryptocurrency?</option>
                    </select>
                    <input type="text" name="securityAnswer" onChange={handleInputChange} className="w-full mt-2 bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" placeholder="Your Answer" />
                  </div>
                  <button type="button" className="w-full bg-[#0B0F14] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/10 text-[#00F0FF] font-semibold py-2 rounded-lg transition text-sm flex justify-center items-center gap-2 mt-2">
                    <Mail className="w-4 h-4" /> Send Email OTP
                  </button>
                </div>
              </div>

            </div>

            {/* COLUMN 2: Banking, Web3 & KYC */}
            <div className="space-y-8">
              
              {/* Banking Details */}
              <div className="bg-[#1A1F2E] p-6 rounded-xl border border-white/5 shadow-lg">
                <h3 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                  <Banknote className="w-4 h-4 text-[#10B981]" /> Bank Account Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Account Type</label>
                    <select name="accountType" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition">
                      <option value="Savings">Savings Account</option>
                      <option value="Current">Current Account</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Currency Base</label>
                    <input disabled type="text" value="₹ INR" className="w-full bg-[#0B0F14]/50 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#718096] cursor-not-allowed" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#A0AEC0] font-semibold mb-1 block">Initial Deposit Amount (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] font-bold">₹</span>
                      <input type="number" name="initialDeposit" onChange={handleInputChange} className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#10B981] transition font-mono" placeholder="10000" />
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Upload UI */}
              <div className="bg-[#1A1F2E] p-6 rounded-xl border border-white/5 shadow-lg">
                <h3 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                  <UploadCloud className="w-4 h-4 text-[#FF006E]" /> KYC & Identity Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-dashed border-[#718096]/50 hover:border-[#FF006E]/50 bg-[#0B0F14]/50 rounded-xl p-4 text-center cursor-pointer transition group">
                    <div className="w-8 h-8 rounded-full bg-[#FF006E]/10 flex flex-col justify-center items-center mx-auto mb-2 group-hover:scale-110 transition">
                      <UploadCloud className="w-4 h-4 text-[#FF006E]" />
                    </div>
                    <p className="text-xs text-[#E8EEF7] font-semibold">Upload Aadhaar/PAN</p>
                    <p className="text-[10px] text-[#718096] mt-1">PDF, JPG (Max 5MB)</p>
                  </div>
                  <div className="border border-dashed border-[#718096]/50 hover:border-[#FF006E]/50 bg-[#0B0F14]/50 rounded-xl p-4 text-center cursor-pointer transition group">
                    <div className="w-8 h-8 rounded-full bg-[#FF006E]/10 flex flex-col justify-center items-center mx-auto mb-2 group-hover:scale-110 transition">
                      <User className="w-4 h-4 text-[#FF006E]" />
                    </div>
                    <p className="text-xs text-[#E8EEF7] font-semibold">Profile Photo</p>
                    <p className="text-[10px] text-[#718096] mt-1">Live Capture or Upload</p>
                  </div>
                </div>
              </div>

              {/* Blockchain USP Module */}
              <div className={`p-6 rounded-xl border shadow-lg transition-all duration-500 overflow-hidden ${cryptoWallet ? 'bg-gradient-to-br from-[#0B0F14] to-[#1A1F2E] border-[#10B981]/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-[#1A1F2E] border-[#00F0FF]/20'}`}>
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <h3 className={`font-bold flex items-center gap-2 ${cryptoWallet ? 'text-[#10B981]' : 'text-[#00F0FF]'}`}>
                    <LinkIcon className="w-4 h-4" /> Web3 Blockchain Identity
                  </h3>
                  {cryptoWallet && <span className="text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded uppercase tracking-wider">Synchronized ✅</span>}
                </div>
                
                {!cryptoWallet ? (
                  <div className="text-center py-4">
                    <p className="text-[#A0AEC0] text-sm mb-4">You need a cryptographic wallet to hold your Sovereign assets on the chain.</p>
                    <button 
                      type="button" 
                      onClick={generateWallet}
                      className="w-full bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition"
                    >
                      Auto-Generate Wallet Keypair
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <p className="text-[#718096] uppercase tracking-wider mb-1 font-sans font-semibold text-[10px]">Wallet Address</p>
                      <div className="bg-[#0B0F14] border border-[#10B981]/20 p-2 text-[#00F0FF] rounded flex justify-between items-center group">
                        <span className="truncate pr-4">{cryptoWallet.address}</span>
                        <Copy onClick={() => copyToClipboard(cryptoWallet.address)} className="w-3 h-3 text-[#A0AEC0] cursor-pointer hover:text-white shrink-0" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[#718096] uppercase tracking-wider mb-1 font-sans font-semibold text-[10px]">Public Key</p>
                      <p className="bg-[#0B0F14] border border-white/5 p-2 text-[#A0AEC0] truncate rounded">{cryptoWallet.publicKey}</p>
                    </div>
                    <div>
                      <p className="text-[#718096] uppercase tracking-wider mb-1 font-sans font-semibold text-[10px]">Private Key (Export)</p>
                      <div className="flex border border-[#FF006E]/30 rounded overflow-hidden">
                        <p className="bg-[#0B0F14] p-2 text-[#FF006E] truncate flex-1 select-none">
                          {showPrivateKey ? cryptoWallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                        </p>
                        <button type="button" onClick={() => setShowPrivateKey(!showPrivateKey)} className="bg-[#FF006E]/10 px-3 hover:bg-[#FF006E]/20 text-[#FF006E] transition">
                          {showPrivateKey ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#A0AEC0] text-sm">
              Already have a Sovereign account? <Link to="/login" className="text-[#00F0FF] hover:underline font-semibold">Login</Link>
            </p>
            <button 
              type="submit" 
              disabled={isSubmitting || !cryptoWallet}
              className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition transform flex items-center gap-2 ${
                isSubmitting || !cryptoWallet 
                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-[#00F0FF] to-[#FF006E] hover:scale-105 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              }`}
            >
              {isSubmitting ? (
                <>Processing Protocols <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></>
              ) : (
                <>Submit KYC & Create Account <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
