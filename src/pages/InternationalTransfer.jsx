import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, Send, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle,
  Clock, DollarSign, RefreshCw, Download, Search, Filter, Lock,
  KeyRound, Eye, EyeOff, ShieldAlert, Cpu, ExternalLink, ArrowLeft,
  Check, Copy, Bug, HelpCircle, ChevronRight, FileText, Building2
} from 'lucide-react';
import api from '../api';
import { signTransaction } from '../utils/cryptoSigner';
import { generateInternationalWireReceipt, formatINR } from '../utils/pdfGenerator';

const SUPPORTED_CORRIDORS = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States', rate: 0.011900, min: 500, max: 500000, swiftHint: 'e.g. CHASUS33, BOFAUS3N', accHint: 'ACH / Routing + Account No. (9-17 digits)' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'European Union (Germany/France)', rate: 0.011000, min: 500, max: 500000, swiftHint: 'e.g. DEUTDEDD, BNPAFRPP', accHint: 'IBAN (e.g. DE89 3704 0044 0532 0130 00)' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom', rate: 0.009350, min: 500, max: 500000, swiftHint: 'e.g. BARCGB22, HBUKGB4B', accHint: 'UK Sort Code + Account or GB IBAN' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', country: 'United Arab Emirates', rate: 0.043700, min: 500, max: 500000, swiftHint: 'e.g. ENBDANDD, FABKAEAD', accHint: 'UAE IBAN (AE + 21 digits)' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', country: 'Singapore', rate: 0.015800, min: 500, max: 500000, swiftHint: 'e.g. DBSSSGSG, OCBCSGSG', accHint: 'Bank Code + Branch + Account Number' },
  { code: 'INR', name: 'Indian Rupee (NRE/NRO)', symbol: '₹', flag: '🇮🇳', country: 'India (Cross-Border Remittance)', rate: 1.000000, min: 100, max: 1000000, swiftHint: 'e.g. SBININBB, HDFC000001', accHint: 'Domestic Core Account / IFSC' },
];

const PURPOSE_OPTIONS = [
  'Family Support & Living Maintenance',
  'Higher Education & University Tuition',
  'Overseas Medical & Health Treatment',
  'Business Consultancy & Professional Services',
  'International Travel & Hospitality',
  'Personal Gift & Relocation Remittance'
];

export default function InternationalTransfer() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [step, setStep] = useState(1); // 1 = form, 2 = review & sign, 3 = pin, 4 = success
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  // Form State
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [recipientName, setRecipientName] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('United States');
  const [recipientBankName, setRecipientBankName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [sendAmount, setSendAmount] = useState('10000');
  const [transferPurpose, setTransferPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [paymentReference, setPaymentReference] = useState('');

  // Security & PIN State
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [hasPinSet, setHasPinSet] = useState(true);

  // Quote State
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Digital Signature State
  const [signedTxData, setSignedTxData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [tamperMode, setTamperMode] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Transfer Processing
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [transferResult, setTransferResult] = useState(null);

  // History & Tracking
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterStatus, setHistoryFilterStatus] = useState('ALL');
  const [historyFilterCurrency, setHistoryFilterCurrency] = useState('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedTxDetail, setSelectedTxDetail] = useState(null);

  const selectedAccount = useMemo(() => {
    return accounts.find(a => String(a.id) === String(selectedAccountId));
  }, [accounts, selectedAccountId]);

  const activeCorridor = useMemo(() => {
    return SUPPORTED_CORRIDORS.find(c => c.code === targetCurrency) || SUPPORTED_CORRIDORS[0];
  }, [targetCurrency]);

  // Load User Accounts & PIN status
  useEffect(() => {
    api.get('/api/banking/accounts')
      .then(res => {
        if (res.data?.success && res.data.accounts?.length) {
          setAccounts(res.data.accounts);
          setSelectedAccountId(res.data.accounts[0].id);
        }
      })
      .catch(() => {});

    api.get('/api/security/pin/status')
      .then(res => {
        if (res.data?.success) setHasPinSet(res.data.hasPinSet);
      })
      .catch(() => {});
  }, []);

  // Update country when currency changes
  useEffect(() => {
    if (activeCorridor) {
      setRecipientCountry(activeCorridor.country);
    }
  }, [activeCorridor]);

  // Calculate live FX quote
  useEffect(() => {
    const numAmt = parseFloat(sendAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setQuote(null);
      return;
    }

    setLoadingQuote(true);
    api.post('/api/international/quote', {
      sendAmount: String(numAmt),
      targetCurrency: targetCurrency
    })
      .then(res => {
        if (res.data?.success) {
          setQuote(res.data);
        }
      })
      .catch(err => {
        // Fallback local calculation if offline
        const rate = activeCorridor.rate;
        const fee = numAmt * 0.005 + 150;
        setQuote({
          sendAmount: numAmt,
          sendCurrency: 'INR',
          targetCurrency: targetCurrency,
          exchangeRate: rate,
          recipientAmount: Number((numAmt * rate).toFixed(2)),
          fee: Number(fee.toFixed(2)),
          totalPayable: Number((numAmt + fee).toFixed(2)),
          rateTimestamp: new Date().toISOString(),
          rateSource: 'VAULTCHAIN FX Demo Engine (Simulated Rates)',
          isSimulated: true,
          estimatedDelivery: '1-2 Business Days (Simulated SWIFT Settlement)'
        });
      })
      .finally(() => setLoadingQuote(false));
  }, [sendAmount, targetCurrency, activeCorridor]);

  // Load Wire History
  const fetchHistory = () => {
    setLoadingHistory(true);
    api.get('/api/international/history')
      .then(res => {
        if (res.data?.success) {
          setHistoryList(res.data.transfers || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle Review Step & Digital Signature
  const handleProceedToReview = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recipientName.trim()) { setErrorMsg('Please enter recipient full name'); return; }
    if (!recipientBankName.trim()) { setErrorMsg('Please enter recipient bank name'); return; }
    if (!recipientAccount.trim()) { setErrorMsg('Please enter recipient account or IBAN'); return; }

    const numAmt = parseFloat(sendAmount);
    if (isNaN(numAmt) || numAmt < activeCorridor.min) {
      setErrorMsg(`Minimum wire amount for ${targetCurrency} is ₹${activeCorridor.min.toLocaleString('en-IN')}`);
      return;
    }
    if (numAmt > activeCorridor.max) {
      setErrorMsg(`Maximum wire amount for ${targetCurrency} is ₹${activeCorridor.max.toLocaleString('en-IN')}`);
      return;
    }

    const availableBal = Number(selectedAccount?.balance || 0);
    const totalPayable = quote ? quote.totalPayable : numAmt + 150 + numAmt * 0.005;
    if (totalPayable > availableBal) {
      setErrorMsg(`Insufficient funds. Total payable is ₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })} but your balance is ₹${availableBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      return;
    }

    // Generate cryptographic ECDSA P-256 signature
    setIsSigning(true);
    try {
      const txId = `INTL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const nonce = `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const timestamp = Math.floor(Date.now() / 1000);

      const sigResult = await signTransaction({
        transactionId: txId,
        fromAccount: selectedAccount?.accountNumber || 'SYSTEM',
        toAccount: recipientAccount.trim(),
        amount: String(numAmt),
        timestamp,
        nonce,
        userEmail: localStorage.getItem('userEmail') || ''
      });

      setSignedTxData(sigResult);
      setStep(2);
    } catch (err) {
      console.warn('Digital signing notice:', err);
      setStep(2);
    } finally {
      setIsSigning(false);
    }
  };

  // Submit Wire Transfer
  const handleSubmitTransfer = async () => {
    setErrorMsg('');
    setPinError('');
    if (!pin.trim()) {
      setPinError('Transaction PIN is required to authorize cross-border wire');
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `wire_idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const payload = {
        fromAccountId: String(selectedAccountId),
        recipientName: recipientName.trim(),
        recipientCountry: recipientCountry.trim(),
        recipientBankName: recipientBankName.trim(),
        recipientAccountNumber: recipientAccount.trim(),
        swiftBic: swiftBic.trim(),
        sendAmount: String(sendAmount),
        targetCurrency: targetCurrency,
        transferPurpose: transferPurpose,
        paymentReference: paymentReference.trim() || 'Cross-Border Wire Transfer',
        idempotencyKey,
        pin: pin.trim(),
        digitalSignature: tamperMode ? 'TAMPERED_INVALID_SIG_0xDEADBEEF' : signedTxData?.signature || '',
        publicKey: signedTxData?.publicKeyHex || '',
        transactionHash: tamperMode ? '0x0000000000000000000000000000000000000000000000000000000000000000' : signedTxData?.computedHash || ''
      };

      const res = await api.post('/api/international/transfer', payload);
      if (res.data?.success) {
        setTransferResult(res.data);
        setStep(4);
        // Refresh balance in state
        if (res.data.newBalance !== undefined) {
          setAccounts(prev => prev.map(a => a.id === selectedAccountId ? { ...a, balance: res.data.newBalance } : a));
        }
      } else {
        setErrorMsg(res.data?.message || 'Transfer failed. Check balance and details.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Wire transfer authorization failed.';
      if (msg.toLowerCase().includes('pin')) {
        setPinError(msg);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async (transferObj) => {
    const user = {
      name: localStorage.getItem('userName') || 'Authorized User',
      email: localStorage.getItem('userEmail') || 'user@vaultchain.io'
    };
    await generateInternationalWireReceipt(transferObj || transferResult, user);
  };

  const filteredHistory = useMemo(() => {
    return historyList.filter(item => {
      if (historyFilterStatus !== 'ALL' && item.status !== historyFilterStatus) return false;
      if (historyFilterCurrency !== 'ALL' && item.targetCurrency !== historyFilterCurrency) return false;
      if (historySearchQuery) {
        const q = historySearchQuery.toLowerCase();
        const matchName = item.recipientName?.toLowerCase().includes(q);
        const matchId = item.transactionId?.toLowerCase().includes(q);
        const matchBank = item.recipientBankName?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchBank) return false;
      }
      return true;
    });
  }, [historyList, historyFilterStatus, historyFilterCurrency, historySearchQuery]);

  return (
    <div className="page-root min-h-screen">
      <div className="page-content space-y-6">

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center border shadow-lg"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <Globe className="w-7 h-7 text-[var(--accent-primary)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  International Wire Transfers
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border"
                      style={{ background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8' }}>
                  Cross-Border Settlement
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                Prepare, sign, and track simulated international SWIFT & SEPA payments with live FX quotes.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 p-1 rounded-xl border self-start md:self-auto"
               style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => { setActiveTab('new'); setStep(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'new'
                  ? 'shadow-sm text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={activeTab === 'new' ? { background: 'var(--accent-primary)' } : {}}
            >
              <Send className="w-3.5 h-3.5" />
              New Wire Transfer
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'shadow-sm text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={activeTab === 'history' ? { background: 'var(--accent-primary)' } : {}}
            >
              <Clock className="w-3.5 h-3.5" />
              Wire History & Tracking
            </button>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-3.5 rounded-xl border flex items-start gap-3 text-xs"
             style={{ background: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.25)', color: '#FACC15' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-white">Demonstration & College Project Notice:</strong> Cross-border payments are executed on a strictly simulated international settlement ledger. FX rates are generated by the configured demo FX engine and no actual SWIFT network funds are transferred.
          </div>
        </div>

        {/* TAB 1: NEW WIRE TRANSFER */}
        {activeTab === 'new' && (
          <div>
            {/* Step 1: Transfer Setup Form */}
            {step === 1 && (
              <form onSubmit={handleProceedToReview} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Form Details (8 cols) */}
                <div className="lg:col-span-8 space-y-6">

                  {/* 1. Sender Account Selection */}
                  <div className="rounded-2xl p-6 border space-y-4"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                             style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-primary)' }}>1</div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                          Sender Account (Remitter)
                        </h2>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">Debit Currency: <strong>INR (₹)</strong></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Select Account</label>
                        <select
                          value={selectedAccountId}
                          onChange={e => setSelectedAccountId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountNumber} ({acc.accountType}) — {formatINR(acc.balance)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-center"
                           style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Available Balance</span>
                        <span className="text-lg font-black text-[var(--accent-primary)] font-mono mt-0.5">
                          {formatINR(selectedAccount?.balance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Destination & Recipient Particulars */}
                  <div className="rounded-2xl p-6 border space-y-5"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                           style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-primary)' }}>2</div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Recipient & Destination Bank
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recipient Full Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Recipient Full Legal Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                          placeholder="e.g. Alexander Vance"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* Destination Country / Corridor */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Destination Country / Corridor *
                        </label>
                        <select
                          value={targetCurrency}
                          onChange={e => setTargetCurrency(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          {SUPPORTED_CORRIDORS.map(cor => (
                            <option key={cor.code} value={cor.code}>
                              {cor.flag} {cor.country} — {cor.code} ({cor.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Recipient Bank Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Recipient Bank Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={recipientBankName}
                          onChange={e => setRecipientBankName(e.target.value)}
                          placeholder="e.g. JPMorgan Chase, Barclays, Deutsche Bank"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* SWIFT / BIC Code */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          SWIFT / BIC Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={swiftBic}
                          onChange={e => setSwiftBic(e.target.value.toUpperCase())}
                          placeholder={activeCorridor.swiftHint}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* Account Number or IBAN */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Recipient Account Number or IBAN *
                        </label>
                        <input
                          type="text"
                          required
                          value={recipientAccount}
                          onChange={e => setRecipientAccount(e.target.value)}
                          placeholder={activeCorridor.accHint}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                          Sensitive account details are encrypted and masked in all public ledger proofs.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Transfer Amount & Purpose */}
                  <div className="rounded-2xl p-6 border space-y-4"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                           style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-primary)' }}>3</div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        Remittance Amount & Purpose
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Remit Amount (INR) */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Transfer Amount in INR (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[var(--text-muted)]">₹</span>
                          <input
                            type="number"
                            required
                            min={activeCorridor.min}
                            max={activeCorridor.max}
                            value={sendAmount}
                            onChange={e => setSendAmount(e.target.value)}
                            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-base font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                          Min: ₹{activeCorridor.min.toLocaleString('en-IN')} | Max: ₹{activeCorridor.max.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Purpose */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Regulatory Purpose of Transfer *
                        </label>
                        <select
                          value={transferPurpose}
                          onChange={e => setTransferPurpose(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          {PURPOSE_OPTIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* Optional Reference */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                          Payment Reference / Notes to Beneficiary (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={e => setPaymentReference(e.target.value)}
                          placeholder="e.g. Tuition Fee Semester 1 / Invoice INV-2026-90"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl border flex items-center gap-2.5 text-xs text-rose-400 bg-rose-500/10 border-rose-500/30">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSigning || loadingQuote}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'var(--btn-primary-gradient, linear-gradient(135deg, #0284c7 0%, #0369a1 100%))' }}
                  >
                    {isSigning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating Cryptographic Signature...
                      </>
                    ) : (
                      <>
                        Review Cross-Border Transfer
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Right Column: Live FX Conversion Card & Cost Breakdown (4 cols) */}
                <div className="lg:col-span-4 space-y-6">

                  {/* FX Rate Card */}
                  <div className="rounded-2xl p-6 border space-y-4"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Live FX Rate Quote
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Demo Engine
                      </span>
                    </div>

                    {/* Prominent Rate Box */}
                    <div className="p-4 rounded-xl border text-center space-y-1"
                         style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                      <span className="text-[11px] text-[var(--text-secondary)]">Exchange Rate (INR to {targetCurrency})</span>
                      <div className="text-2xl font-black text-[var(--text-primary)] font-mono">
                        1 INR = {quote?.exchangeRate || activeCorridor.rate} {targetCurrency}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Source: {quote?.rateSource || 'VAULTCHAIN FX Demo Engine (Simulated Rates)'}
                      </span>
                    </div>

                    {/* Recipient Gets */}
                    <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 space-y-1">
                      <span className="text-xs text-sky-300 font-medium">Estimated Recipient Receives</span>
                      <div className="text-3xl font-black text-sky-400 font-mono">
                        {activeCorridor.symbol} {Number(quote?.recipientAmount || 0).toLocaleString()} <span className="text-xs font-normal">{targetCurrency}</span>
                      </div>
                      <span className="text-[11px] text-sky-200/70">
                        Zero deduction at destination bank
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2.5 pt-2 text-xs border-t border-[var(--border-color)]">
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Transfer Amount:</span>
                        <span className="font-mono font-medium text-[var(--text-primary)]">{formatINR(sendAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Wire Network Fee (0.5% + ₹150):</span>
                        <span className="font-mono font-medium text-[var(--text-primary)]">{formatINR(quote?.fee || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[var(--border-color)] font-bold text-sm">
                        <span className="text-[var(--text-primary)]">Total Payable:</span>
                        <span className="font-mono text-emerald-400">{formatINR(quote?.totalPayable || 0)}</span>
                      </div>
                    </div>

                    {/* Estimated delivery */}
                    <div className="p-3 rounded-xl border flex items-center gap-2.5 text-xs"
                         style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                      <Clock className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                      <span className="text-[var(--text-secondary)]">
                        Estimated Settlement: <strong className="text-[var(--text-primary)]">1-2 Business Days</strong> (Simulated SWIFT)
                      </span>
                    </div>
                  </div>

                  {/* Security Highlights */}
                  <div className="rounded-2xl p-5 border space-y-3"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      VAULTCHAIN Protocol Security
                    </div>
                    <ul className="text-xs space-y-2 text-[var(--text-secondary)]">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Client-side Web Crypto ECDSA P-256 digital signature stamp</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Idempotency token locks duplicate accidental submissions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Dual authentication required with 4-15 digit Transaction PIN</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Full immutable block anchored to decentralized EVM network</span>
                      </li>
                    </ul>
                  </div>

                </div>

              </form>
            )}

            {/* Step 2: Review Screen & Cryptographic Signature */}
            {step === 2 && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="rounded-2xl p-6 sm:p-8 border space-y-6"
                     style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        Confirm International Wire Remittance
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Verify beneficiary details, exchange conversion, and cryptographic authorization.
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition hover:opacity-80"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Beneficiary */}
                    <div className="p-4 rounded-xl border space-y-2"
                         style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Beneficiary (Recipient)
                      </span>
                      <div className="text-base font-black text-[var(--text-primary)]">{recipientName}</div>
                      <div className="text-xs text-[var(--text-secondary)] space-y-1">
                        <div>Country: <strong className="text-[var(--text-primary)]">{activeCorridor.flag} {recipientCountry}</strong></div>
                        <div>Bank: <strong className="text-[var(--text-primary)]">{recipientBankName}</strong></div>
                        <div>Account / IBAN: <code className="text-xs font-mono text-sky-400">{recipientAccount}</code></div>
                        {swiftBic && <div>SWIFT/BIC: <strong className="text-xs font-mono text-[var(--text-primary)]">{swiftBic}</strong></div>}
                      </div>
                    </div>

                    {/* Financial Terms */}
                    <div className="p-4 rounded-xl border space-y-2"
                         style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Settlement Breakdown
                      </span>
                      <div className="text-xl font-black text-emerald-400 font-mono">
                        {activeCorridor.symbol} {Number(quote?.recipientAmount || 0).toLocaleString()} {targetCurrency}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] space-y-1">
                        <div>Remitted: <strong className="text-[var(--text-primary)]">{formatINR(sendAmount)}</strong></div>
                        <div>Exchange Rate: <strong className="text-[var(--text-primary)] font-mono">1 INR = {quote?.exchangeRate} {targetCurrency}</strong></div>
                        <div>Network Fee: <strong className="text-[var(--text-primary)] font-mono">{formatINR(quote?.fee || 0)}</strong></div>
                        <div>Total Debited: <strong className="text-rose-400 font-mono">{formatINR(quote?.totalPayable || 0)}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Digital Signature Verification Widget */}
                  <div className="p-4 rounded-xl border space-y-3"
                       style={{ background: 'rgba(56,189,248,0.04)', borderColor: 'rgba(56,189,248,0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                          ECDSA P-256 Cryptographic Signature
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {tamperMode ? '⚠️ TAMPER TEST MODE' : '✓ CLIENT SIGNED'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)]">
                      This transaction was signed locally inside your browser with your private key. The deterministic SHA-256 hash below seals the sender, recipient, and amount against tampering.
                    </p>

                    <div className="p-2.5 rounded-lg border font-mono text-[11px] break-all"
                         style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                      <span className="text-sky-400 font-bold">Transaction Hash: </span>
                      {signedTxData?.computedHash || '0x...'}
                    </div>

                    {/* Developer Tamper Test Button */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setTamperMode(!tamperMode)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bug className="w-3.5 h-3.5" />
                        {tamperMode ? 'Disable Tamper Simulation' : 'Test Security: Simulate Tampered Signature'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (signedTxData?.computedHash) {
                            navigator.clipboard.writeText(signedTxData.computedHash);
                            setCopiedHash(true);
                            setTimeout(() => setCopiedHash(false), 2000);
                          }
                        }}
                        className="text-[11px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedHash ? 'Copied' : 'Copy Hash'}
                      </button>
                    </div>
                  </div>

                  {/* Transaction PIN Input */}
                  <div className="p-5 rounded-xl border space-y-3"
                       style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[var(--accent-primary)]" />
                        Enter Transaction PIN to Authorize *
                      </label>
                      <span className="text-[11px] text-[var(--text-muted)]">4–15 digits numbers only</span>
                    </div>

                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        maxLength={15}
                        onChange={e => {
                          setPin(e.target.value.replace(/\D/g, ''));
                          setPinError('');
                        }}
                        placeholder="••••"
                        className="w-full px-4 py-3 rounded-xl text-base font-mono tracking-widest border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {pinError && (
                      <span className="text-xs text-rose-400 font-semibold block">{pinError}</span>
                    )}

                    {!hasPinSet && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        You have not set a transaction PIN yet. Go to <strong>Security & 2FA</strong> to configure one.
                      </div>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl border flex items-center gap-2.5 text-xs text-rose-400 bg-rose-500/10 border-rose-500/30">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 rounded-xl text-xs font-bold border transition hover:opacity-80"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitTransfer}
                      className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      style={{ background: 'var(--btn-primary-gradient, linear-gradient(135deg, #0284c7 0%, #0369a1 100%))' }}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Authorizing & Mining Wire Block...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Authorize Cross-Border Remittance
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Step 4: Success Screen */}
            {step === 4 && transferResult && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="rounded-2xl p-8 border text-center space-y-6"
                     style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border shadow-xl"
                       style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' }}>
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Wire Transfer Executed
                    </span>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] mt-3">
                      Payment Successfully Sent!
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Your simulated international remittance is confirmed and recorded into the decentralized blockchain ledger.
                    </p>
                  </div>

                  {/* Wire Details Grid */}
                  <div className="p-5 rounded-xl border text-left space-y-3"
                       style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">Transaction Reference ID:</span>
                      <code className="font-mono font-bold text-sky-400">{transferResult.transactionId}</code>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-muted)]">Recipient:</span>
                      <span className="font-bold text-[var(--text-primary)]">{transferResult.recipientName} ({transferResult.recipientCountry})</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-muted)]">Recipient Receives:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {transferResult.recipientAmount} {transferResult.targetCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-muted)]">Total Amount Debited:</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {formatINR(transferResult.totalPayable)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-muted)]">Blockchain Consensus Hash:</span>
                      <code className="font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[220px]">
                        {transferResult.blockchainHash || 'Simulated On-Chain Block'}
                      </code>
                    </div>
                  </div>

                  {/* 4-Step Interactive Timeline */}
                  <div className="p-4 rounded-xl border text-left space-y-3"
                       style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Settlement Lifecycle Progress
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="space-y-1">
                        <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</div>
                        <span className="font-semibold text-emerald-400">Order Initiated</span>
                      </div>
                      <div className="space-y-1">
                        <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</div>
                        <span className="font-semibold text-emerald-400">Digital Sign</span>
                      </div>
                      <div className="space-y-1">
                        <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</div>
                        <span className="font-semibold text-emerald-400">FX Cleared</span>
                      </div>
                      <div className="space-y-1">
                        <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</div>
                        <span className="font-semibold text-emerald-400">Settled (Sim)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDownloadPDF(transferResult)}
                      className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <Download className="w-4 h-4 text-[var(--accent-primary)]" />
                      Download Wire Advice (PDF)
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setStep(1);
                      }}
                      className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      style={{ background: 'var(--btn-primary-gradient, linear-gradient(135deg, #0284c7 0%, #0369a1 100%))' }}
                    >
                      <Clock className="w-4 h-4" />
                      View in Wire History
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WIRE HISTORY & TRACKING */}
        {activeTab === 'history' && (
          <div className="space-y-6">

            {/* Filter Controls Bar */}
            <div className="rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    placeholder="Search recipient or Tx ID..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={historyFilterStatus}
                  onChange={e => setHistoryFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Currency Filter */}
                <select
                  value={historyFilterCurrency}
                  onChange={e => setHistoryFilterCurrency(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">All Currencies</option>
                  {SUPPORTED_CORRIDORS.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.name})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer self-start md:self-auto hover:opacity-80"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Wire Transfers Table */}
            <div className="rounded-2xl border overflow-hidden"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              
              {loadingHistory ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-[var(--text-secondary)]">Fetching international wire registry...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Globe className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">No International Wire Transfers Found</h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                    You haven't initiated any cross-border payments yet, or no records matched your filter criteria.
                  </p>
                  <button
                    onClick={() => { setActiveTab('new'); setStep(1); }}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow cursor-pointer"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    Initiate First Wire
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b"
                          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Wire ID</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Date & Time</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Destination</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Beneficiary</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Debited (INR)</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Net Payout</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredHistory.map(tx => (
                        <tr key={tx.id} className="hover:bg-[var(--bg-elevated)] transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                            {tx.transactionId}
                          </td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                            {tx.recipientCountry}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[var(--text-primary)]">{tx.recipientName}</div>
                            <div className="text-[11px] font-mono text-[var(--text-muted)]">{tx.recipientAccountNumberMasked}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                            {formatINR(tx.totalPayable || tx.sendAmount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-emerald-400">
                            {tx.recipientAmount} {tx.targetCurrency}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : tx.status === 'FAILED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadPDF(tx)}
                                title="Download PDF Receipt"
                                className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-input)] transition cursor-pointer"
                                style={{ borderColor: 'var(--border-color)' }}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedTxDetail(tx)}
                                className="px-2.5 py-1 rounded-lg border text-[11px] font-bold text-sky-400 hover:bg-sky-500/10 transition cursor-pointer"
                                style={{ borderColor: 'rgba(56,189,248,0.3)' }}
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Modal: Wire Transfer Full Detail & Tracking */}
        {selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl border p-6 space-y-5 shadow-2xl relative"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Cross-Border Wire Audit
                  </span>
                  <h3 className="text-base font-bold text-[var(--text-primary)] font-mono">
                    {selectedTxDetail.transactionId}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTxDetail(null)}
                  className="p-1.5 rounded-lg border text-[var(--text-muted)] hover:text-white transition"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  ✕
                </button>
              </div>

              {/* Status Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl border"
                   style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs text-[var(--text-secondary)]">Settlement Status:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ✓ {selectedTxDetail.status} (SIMULATED)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] text-[var(--text-muted)]">Beneficiary Name</span>
                  <div className="font-bold text-[var(--text-primary)]">{selectedTxDetail.recipientName}</div>
                </div>
                <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] text-[var(--text-muted)]">Destination Country</span>
                  <div className="font-bold text-[var(--text-primary)]">{selectedTxDetail.recipientCountry}</div>
                </div>
                <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] text-[var(--text-muted)]">Bank Name</span>
                  <div className="font-bold text-[var(--text-primary)]">{selectedTxDetail.recipientBankName}</div>
                </div>
                <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] text-[var(--text-muted)]">Masked Account / IBAN</span>
                  <div className="font-mono text-sky-400">{selectedTxDetail.recipientAccountNumberMasked}</div>
                </div>
                <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] text-[var(--text-muted)]">Send Amount (INR)</span>
                  <div className="font-bold font-mono text-[var(--text-primary)]">{formatINR(selectedTxDetail.sendAmount)}</div>
                </div>
                <div className="p-3 rounded-xl border space-y-1" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] text-[var(--text-muted)]">Recipient Amount</span>
                  <div className="font-bold font-mono text-emerald-400">{selectedTxDetail.recipientAmount} {selectedTxDetail.targetCurrency}</div>
                </div>
              </div>

              {/* Blockchain info */}
              <div className="p-3 rounded-xl border font-mono text-[11px] space-y-1"
                   style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                <span className="text-[var(--text-muted)]">Blockchain Consensus Hash:</span>
                <div className="text-sky-400 break-all text-[10px]">
                  {selectedTxDetail.blockchainHash || 'Simulated On-Chain Transaction Hash Registered'}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleDownloadPDF(selectedTxDetail)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Download Wire Receipt (PDF)
                </button>
                <button
                  onClick={() => setSelectedTxDetail(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
