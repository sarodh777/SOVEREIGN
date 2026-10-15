import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Cache for loaded font base64 strings so repeated downloads are instant
let cachedFontRegular = null;
let cachedFontBold = null;
let cachedLogoDataUrl = null;

/**
 * Convert the SVG logo from public directory to a high-res PNG Data URL for jsPDF.
 */
async function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 160, 160);
        ctx.drawImage(img, 0, 0, 160, 160);
        cachedLogoDataUrl = canvas.toDataURL('image/png');
        resolve(cachedLogoDataUrl);
      } catch (err) {
        console.warn('Could not rasterize logo canvas', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/vaultchain-logo.svg';
  });
}

/**
 * Load TTF fonts supporting Unicode (including Indian Rupee ₹ symbol) into jsPDF VFS.
 */
async function loadUnicodeFonts(doc) {
  try {
    if (!cachedFontRegular) {
      const res = await fetch('/fonts/Arial.ttf');
      if (res.ok) {
        const buf = await res.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        cachedFontRegular = btoa(binary);
      }
    }

    if (!cachedFontBold) {
      const resB = await fetch('/fonts/Arial-Bold.ttf');
      if (resB.ok) {
        const bufB = await resB.arrayBuffer();
        let binaryB = '';
        const bytesB = new Uint8Array(bufB);
        const chunkSize = 8192;
        for (let i = 0; i < bytesB.length; i += chunkSize) {
          binaryB += String.fromCharCode.apply(null, bytesB.subarray(i, i + chunkSize));
        }
        cachedFontBold = btoa(binaryB);
      }
    }

    if (cachedFontRegular) {
      doc.addFileToVFS('Arial.ttf', cachedFontRegular);
      doc.addFont('Arial.ttf', 'Arial', 'normal');
      if (cachedFontBold) {
        doc.addFileToVFS('Arial-Bold.ttf', cachedFontBold);
        doc.addFont('Arial-Bold.ttf', 'Arial', 'bold');
      }
      doc.setFont('Arial', 'normal');
      return true;
    }
  } catch (err) {
    console.warn('Could not load Unicode TTF font, falling back to standard font', err);
  }
  return false;
}

/**
 * Format numbers as Indian Rupee amounts: e.g. ₹ 1,50,000.00
 */
export function formatINR(val, hasUnicodeFont = true) {
  const num = Number(val || 0);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return hasUnicodeFont ? `₹ ${formatted}` : `INR ${formatted}`;
}

/**
 * Format date string to readable IST format.
 */
function formatDate(d) {
  if (!d) return 'N/A';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(d);
  }
}

/**
 * Shorten blockchain hash for table display while preserving uniqueness.
 */
function formatHash(hash) {
  if (!hash || hash === 'null' || hash === 'N/A') return 'Off-chain';
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

/**
 * Generate a unique verification code for the statement.
 */
function generateStatementId(prefix = 'VC') {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. USER TRANSACTION REPORT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function generateUserTransactionReport({
  user = {},
  account = {},
  transactions = [],
  dateRangeLabel = 'All Time',
  typeFilter = 'ALL',
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const hasUnicode = await loadUnicodeFonts(doc);
  const logoData = await getLogoDataUrl();
  const fontName = hasUnicode ? 'Arial' : 'helvetica';

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const statementId = generateStatementId('VC-USR');
  const generatedAt = formatDate(new Date());

  // Calculate statistics
  const totalCount = transactions.length;
  const credits = transactions
    .filter((t) => t.direction === 'IN' || t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const debits = transactions
    .filter((t) => t.direction === 'OUT' || t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // ── Header Background Band ──
  doc.setFillColor(11, 19, 31); // #0B131F Dark slate
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent line
  doc.setFillColor(16, 185, 129); // #10B981 Emerald
  doc.rect(0, 37.5, pageWidth, 1.5, 'F');

  // Embed Logo
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 6, 25, 25);
    } catch {
      // Ignore image embedding error and fallback to vector shield
    }
  } else {
    // Fallback vector shield
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');
    doc.setTextColor(11, 19, 31);
    doc.setFont(fontName, 'bold');
    doc.setFontSize(14);
    doc.text('VC', 20, 22);
  }

  // Brand Name & Subtitle
  doc.setTextColor(240, 253, 244); // #F0FDF4
  doc.setFont(fontName, 'bold');
  doc.setFontSize(18);
  doc.text('VAULTCHAIN', 43, 16);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text('SECURE BLOCKCHAIN BANKING & GOVERNANCE SUITE', 43, 22);
  doc.text('Official Customer Account Statement', 43, 27);

  // Statement Metadata (Right-aligned in header)
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('ACCOUNT TRANSACTION REPORT', pageWidth - 14, 15, { align: 'right' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Statement ID: ${statementId}`, pageWidth - 14, 21, { align: 'right' });
  doc.text(`Generated: ${generatedAt}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Scope: ${dateRangeLabel} | Type: ${typeFilter}`, pageWidth - 14, 31, { align: 'right' });

  // ── Account Information & Summary Cards Band ──
  const startY = 44;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252); // Light background
  doc.roundedRect(14, startY, pageWidth - 28, 28, 3, 3, 'FD');

  // Left side: Account Holder Details
  doc.setTextColor(71, 85, 105);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('ACCOUNT HOLDER DETAILS', 18, startY + 6);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Name: ${user.name || 'Account Holder'}`, 18, startY + 12);
  doc.text(`Email: ${user.email || 'N/A'}`, 18, startY + 18);
  doc.text(`Phone: ${user.phone || 'N/A'}`, 18, startY + 24);

  // Middle: Bank Account Info
  const midX = 100;
  doc.setTextColor(71, 85, 105);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('ACCOUNT INFORMATION', midX, startY + 6);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Account No: ${account.accountNumber || 'N/A'}`, midX, startY + 12);
  doc.text(`Account Type: ${account.accountType || 'SAVINGS'}`, midX, startY + 18);
  doc.text(`IBAN: ${account.iban || 'N/A'}`, midX, startY + 24);

  // Right side: Financial Totals Box
  const summaryX = 195;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryX, startY + 3, pageWidth - summaryX - 18, 22, 2, 2, 'F');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('FINANCIAL RECONCILIATION', summaryX + 4, startY + 7);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Transactions: ${totalCount}`, summaryX + 4, startY + 12);

  doc.setTextColor(22, 163, 74); // Green
  doc.text(`Total Credits (+): ${formatINR(credits, hasUnicode)}`, summaryX + 4, startY + 17);

  doc.setTextColor(220, 38, 38); // Red
  doc.text(`Total Debits (-): ${formatINR(debits, hasUnicode)}`, summaryX + 4, startY + 22);

  // Balance Indicator
  const balanceX = pageWidth - 45;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('AVAILABLE BALANCE', balanceX, startY + 8, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  const currentBalance = account.balance !== undefined ? account.balance : (user.balance || 0);
  doc.text(formatINR(currentBalance, hasUnicode), balanceX, startY + 17, { align: 'right' });

  // ── Prepare Table Rows ──
  const tableHead = [
    [
      'Date & Time',
      'Transaction ID',
      'Type',
      'Flow',
      'Sender',
      'Receiver',
      'Amount',
      'Status',
      'Blockchain Hash',
    ],
  ];

  const tableBody = transactions.length > 0
    ? transactions.map((tx) => {
        const isCredit = tx.direction === 'IN' || tx.type === 'DEPOSIT';
        const flowLabel = isCredit ? 'Credit (+)' : 'Debit (-)';
        const amountStr = formatINR(tx.amount, hasUnicode);
        return [
          formatDate(tx.date),
          tx.transactionId || String(tx.id || '-'),
          tx.type || 'TRANSFER',
          flowLabel,
          tx.sender || (isCredit ? 'External / Counterparty' : (account.accountNumber || 'My Account')),
          tx.receiver || (!isCredit ? 'External / Counterparty' : (account.accountNumber || 'My Account')),
          amountStr,
          tx.status || 'COMPLETED',
          formatHash(tx.blockchainHash),
        ];
      })
    : [
        [
          {
            content: 'No transactions found for the selected period or filters.',
            colSpan: 9,
            styles: { halign: 'center', fontStyle: 'italic', textColor: [148, 163, 184], minCellHeight: 18 },
          },
        ],
      ];

  // Render Table
  const executeAutoTable = autoTable.default || autoTable;
  executeAutoTable(doc, {
    startY: startY + 32,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // Deep Navy/Slate
      textColor: [240, 253, 244],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 26 }, // Date
      1: { cellWidth: 32, font: fontName }, // TxID
      2: { cellWidth: 22, fontStyle: 'bold' }, // Type
      3: { cellWidth: 18 }, // Flow
      4: { cellWidth: 42 }, // Sender
      5: { cellWidth: 42 }, // Receiver
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }, // Amount
      7: { cellWidth: 22, halign: 'center' }, // Status
      8: { cellWidth: 36, font: fontName, fontSize: 7 }, // Hash
    },
    didParseCell: (data) => {
      // Colorize amount and status
      if (data.section === 'body' && transactions.length > 0) {
        const tx = transactions[data.row.index];
        if (data.column.index === 6 && tx) {
          const isCredit = tx.direction === 'IN' || tx.type === 'DEPOSIT';
          data.cell.styles.textColor = isCredit ? [22, 163, 74] : [220, 38, 38];
        }
        if (data.column.index === 7 && tx) {
          const st = String(tx.status || '').toUpperCase();
          if (st === 'COMPLETED' || st === 'SUCCESS') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else if (st === 'PENDING') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          } else if (st === 'FAILED') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.column.index === 3 && tx) {
          const isCredit = tx.direction === 'IN' || tx.type === 'DEPOSIT';
          data.cell.styles.textColor = isCredit ? [22, 163, 74] : [220, 38, 38];
        }
      }
    },
    didDrawPage: (data) => {
      // Running Header on subsequent pages
      if (data.pageNumber > 1) {
        doc.setFillColor(11, 19, 31);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(240, 253, 244);
        doc.setFont(fontName, 'bold');
        doc.setFontSize(9);
        doc.text('VAULTCHAIN • Transaction History Statement', 14, 8);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Account: ${account.accountNumber || 'N/A'} | Ref: ${statementId}`, pageWidth - 14, 8, { align: 'right' });
      }

      // Running Footer on every page
      const footerY = pageHeight - 8;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENTIAL • Secured by VaultChain Distributed Consensus & Cryptographic Hashes • ISO 20022 Validated', 14, footerY);

      const pageStr = `Page ${data.pageNumber}`;
      doc.text(pageStr, pageWidth - 14, footerY, { align: 'right' });
    },
    margin: { top: 16, bottom: 14, left: 14, right: 14 },
  });

  // Second pass: Update total page counts
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerY = pageHeight - 8;
    // Overwrite page number with full "Page X of Y"
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - 35, footerY - 2.5, 22, 4, 'F');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, footerY, { align: 'right' });
  }

  // Download PDF
  const filename = `VaultChain_Transactions_${account.accountNumber || 'Account'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return { success: true, filename, statementId };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADMIN TRANSACTION REPORT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function generateAdminTransactionReport({
  adminUser = {},
  transactions = [],
  filterInfo = {
    userId: 'ALL',
    userName: 'All Users',
    status: 'ALL',
    dateRangeLabel: 'All Time',
    type: 'ALL',
  },
  _stats = {},
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const hasUnicode = await loadUnicodeFonts(doc);
  const logoData = await getLogoDataUrl();
  const fontName = hasUnicode ? 'Arial' : 'helvetica';

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const statementId = generateStatementId('VC-ADM');
  const generatedAt = formatDate(new Date());

  // Platform Metrics for report
  const totalCount = transactions.length;
  const totalVolume = transactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const completedCount = transactions.filter((t) => String(t.status).toUpperCase() === 'COMPLETED').length;
  const pendingCount = transactions.filter((t) => String(t.status).toUpperCase() === 'PENDING').length;
  const failedCount = transactions.filter((t) => String(t.status).toUpperCase() === 'FAILED').length;

  // ── Header Background Band ──
  doc.setFillColor(11, 19, 31); // #0B131F Dark slate
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line: Amber/Emerald Admin Indicator
  doc.setFillColor(16, 185, 129); // #10B981
  doc.rect(0, 37.5, pageWidth, 1.5, 'F');

  // Logo
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 6, 25, 25);
    } catch {
      // Fallback if logo embedding encounters an issue
    }
  } else {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');
    doc.setTextColor(11, 19, 31);
    doc.setFont(fontName, 'bold');
    doc.setFontSize(14);
    doc.text('VC', 20, 22);
  }

  // Brand Name & Subtitle
  doc.setTextColor(240, 253, 244);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(18);
  doc.text('VAULTCHAIN', 43, 16);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('MASTER SYSTEM TRANSACTION & SURVEILLANCE REPORT', 43, 22);
  doc.text('Centralized Banking Telemetry & Distributed Ledger Audit', 43, 27);

  // Admin Metadata (Right-aligned in header)
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('ADMINISTRATIVE AUDIT STATEMENT', pageWidth - 14, 15, { align: 'right' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Audit ID: ${statementId}`, pageWidth - 14, 21, { align: 'right' });
  doc.text(`Generated: ${generatedAt}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Auditor: ${adminUser.email || adminUser.name || 'System Admin'}`, pageWidth - 14, 31, { align: 'right' });

  // ── Audit Scope & Filter Summary Card ──
  const startY = 44;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, pageWidth - 28, 28, 3, 3, 'FD');

  // Left side: Filter Scope
  doc.setTextColor(71, 85, 105);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('AUDIT PARAMETERS & FILTER CRITERIA', 18, startY + 6);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Target User: ${filterInfo.userName || (filterInfo.userId === 'ALL' ? 'All Users (Platform-Wide)' : `User #${filterInfo.userId}`)}`, 18, startY + 12);
  doc.text(`Date Range: ${filterInfo.dateRangeLabel || 'All Time'}`, 18, startY + 18);
  doc.text(`Status Filter: ${filterInfo.status || 'ALL'} | Type: ${filterInfo.type || 'ALL'}`, 18, startY + 24);

  // Middle: Transaction Status Distribution
  const midX = 115;
  doc.setTextColor(71, 85, 105);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.text('STATUS TELEMETRY BREAKDOWN', midX, startY + 6);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 163, 74); // Completed
  doc.text(`Completed: ${completedCount}`, midX, startY + 12);
  doc.setTextColor(217, 119, 6); // Pending
  doc.text(`Pending Review: ${pendingCount}`, midX, startY + 18);
  doc.setTextColor(220, 38, 38); // Failed
  doc.text(`Failed / Terminated: ${failedCount}`, midX, startY + 24);

  // Right side: Volume & Count KPI Box
  const summaryX = 200;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryX, startY + 3, pageWidth - summaryX - 18, 22, 2, 2, 'F');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AUDITED AGGREGATE VOLUME', summaryX + 4, startY + 7);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Records In Report: ${totalCount}`, summaryX + 4, startY + 13);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text(`Volume: ${formatINR(totalVolume, hasUnicode)}`, summaryX + 4, startY + 21);

  // ── Prepare Table Data ──
  const tableHead = [
    [
      'User ID',
      'Transaction ID',
      'Date & Time',
      'Type',
      'Sender',
      'Receiver',
      'Amount',
      'Status',
      'Blockchain Hash',
    ],
  ];

  const tableBody = transactions.length > 0
    ? transactions.map((tx) => {
        // User ID derivation
        const userIdVal = tx.userId || tx.fromUserId || tx.toUserId || 'System';
        const senderStr = tx.sender || tx.fromUserName || tx.fromAccountNumber || 'System / Deposit';
        const receiverStr = tx.receiver || tx.toUserName || tx.toAccountNumber || 'System / Withdrawal';

        return [
          String(userIdVal),
          tx.transactionId || String(tx.id || '-'),
          formatDate(tx.date),
          tx.type || 'TRANSFER',
          senderStr,
          receiverStr,
          formatINR(tx.amount, hasUnicode),
          tx.status || 'COMPLETED',
          formatHash(tx.blockchainHash),
        ];
      })
    : [
        [
          {
            content: 'No transaction records found matching the specified filter criteria.',
            colSpan: 9,
            styles: { halign: 'center', fontStyle: 'italic', textColor: [148, 163, 184], minCellHeight: 18 },
          },
        ],
      ];

  const executeAutoTable = autoTable.default || autoTable;
  executeAutoTable(doc, {
    startY: startY + 32,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [240, 253, 244],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }, // User ID
      1: { cellWidth: 32, font: fontName }, // TxID
      2: { cellWidth: 26 }, // Date
      3: { cellWidth: 22, fontStyle: 'bold' }, // Type
      4: { cellWidth: 40 }, // Sender
      5: { cellWidth: 40 }, // Receiver
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }, // Amount
      7: { cellWidth: 22, halign: 'center' }, // Status
      8: { cellWidth: 41, font: fontName, fontSize: 7 }, // Hash
    },
    didParseCell: (data) => {
      if (data.section === 'body' && transactions.length > 0) {
        const tx = transactions[data.row.index];
        if (data.column.index === 6 && tx) {
          data.cell.styles.textColor = [15, 23, 42];
        }
        if (data.column.index === 7 && tx) {
          const st = String(tx.status || '').toUpperCase();
          if (st === 'COMPLETED' || st === 'SUCCESS') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else if (st === 'PENDING') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          } else if (st === 'FAILED') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(11, 19, 31);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(240, 253, 244);
        doc.setFont(fontName, 'bold');
        doc.setFontSize(9);
        doc.text('VAULTCHAIN • Administrator Master Transaction Audit', 14, 8);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Audit Ref: ${statementId} | Records: ${totalCount}`, pageWidth - 14, 8, { align: 'right' });
      }

      const footerY = pageHeight - 8;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('RESTRICTED ACCESS • VaultChain Core Banking System Surveillance • Strictly Confidential', 14, footerY);

      doc.text(`Page ${data.pageNumber}`, pageWidth - 14, footerY, { align: 'right' });
    },
    margin: { top: 16, bottom: 14, left: 14, right: 14 },
  });

  // Second pass: Update total page counts
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerY = pageHeight - 8;
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - 35, footerY - 2.5, 22, 4, 'F');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, footerY, { align: 'right' });
  }

  const filename = `VaultChain_Admin_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return { success: true, filename, statementId };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERNATIONAL WIRE TRANSFER RECEIPT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export async function generateInternationalWireReceipt(transfer, user) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const hasUnicode = await loadUnicodeFonts(doc);
  const fontName = hasUnicode ? 'CustomArial' : 'helvetica';
  const logoDataUrl = await getLogoDataUrl();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const receiptId = transfer.transactionId || generateStatementId('INTL');

  // Header Banner
  doc.setFillColor(7, 11, 25);
  doc.rect(0, 0, pageWidth, 42, 'F');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 18, 18);
    } catch (e) {
      console.warn('Could not add logo to PDF', e);
    }
  }

  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('VAULTCHAIN CROSS-BORDER WIRE ADVICE', 36, 19);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Simulated SWIFT / BIC Cross-Border Payment Confirmation', 36, 25);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248);
  doc.text(`WIRE ADVICE NO: ${receiptId}`, pageWidth - 14, 18, { align: 'right' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`DATE: ${formatDate(transfer.completedAt || transfer.createdAt)}`, pageWidth - 14, 24, { align: 'right' });

  // Status Badge
  const status = (transfer.status || 'COMPLETED').toUpperCase();
  doc.setFillColor(status === 'COMPLETED' ? 16 : 59, status === 'COMPLETED' ? 185 : 130, status === 'COMPLETED' ? 129 : 246);
  doc.roundedRect(pageWidth - 45, 28, 31, 6, 1.5, 1.5, 'F');
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ${status}`, pageWidth - 29.5, 32.2, { align: 'center' });

  let y = 50;

  // Remitter & Beneficiary Cards (2 columns)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 88, 38, 2, 2, 'FD');
  doc.roundedRect(108, y, 88, 38, 2, 2, 'FD');

  // Remitter Details
  doc.setFont(fontName, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('REMITTER (ORDERING CUSTOMER)', 18, y + 7);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${user?.name || transfer.senderName || 'Authorized Customer'}`, 18, y + 14);
  doc.text(`Email: ${user?.email || transfer.senderEmail || 'N/A'}`, 18, y + 20);
  doc.text(`Debited Account: ${transfer.fromAccountNumber || 'VaultChain Core Account'}`, 18, y + 26);
  doc.text('Institution: VaultChain Sovereign Ledger (IN)', 18, y + 32);

  // Beneficiary Details
  doc.setFont(fontName, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('BENEFICIARY (RECIPIENT)', 112, y + 7);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${transfer.recipientName || 'Beneficiary'}`, 112, y + 14);
  doc.text(`Country: ${transfer.recipientCountry || 'Global'}`, 112, y + 20);
  doc.text(`Bank: ${transfer.recipientBankName || 'Destination Bank'}`, 112, y + 26);
  doc.text(`Account / IBAN: ${transfer.recipientAccountNumberMasked || '••••••••'}`, 112, y + 32);

  y += 44;

  // Table of Transfer Financial Particulars
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { font: fontName, fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    body: [
      ['Remitted Amount (Sender Currency)', `${formatINR(transfer.sendAmount, hasUnicode)} INR`],
      ['Exchange Rate Applied', `1 INR = ${transfer.exchangeRate || '0.000000'} ${transfer.targetCurrency}`],
      ['Destination Net Payout', `${Number(transfer.recipientAmount || 0).toLocaleString()} ${transfer.targetCurrency}`],
      ['Cross-Border Network Fee', `${formatINR(transfer.fee, hasUnicode)} INR`],
      ['Total Amount Debited', `${formatINR(transfer.totalPayable, hasUnicode)} INR`],
      ['Payment Reference', transfer.paymentReference || 'VAULTCHAIN-WIRE'],
      ['Purpose of Remittance', transfer.transferPurpose || 'Cross-Border Personal Remittance'],
      ['SWIFT / BIC Code', transfer.swiftBic || 'GENERIC-SWIFT'],
      ['Estimated Settlement Rails', transfer.estimatedDelivery || '1-2 Business Days (Simulated SWIFT Rails)'],
      ['FX Rate Quote Engine', transfer.rateSource || 'VAULTCHAIN FX Demo Engine (Simulated Rates)'],
    ],
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { cellWidth: 102, textColor: [15, 23, 42] }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Cryptographic & Blockchain Stamp Card
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CRYPTOGRAPHIC SETTLEMENT & IMMUTABLE PROOF', 18, y + 6);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Digital Signature: ${transfer.signatureVerified ? 'Verified (ECDSA-P256-SHA256 Client-Signed)' : 'Standard Platform Authorization'}`, 18, y + 12);
  doc.text(`Blockchain Consensus Hash: ${transfer.blockchainHash || 'Simulated On-Chain Transaction Hash Registered'}`, 18, y + 18);
  doc.text('Regulatory Notice: Prototype simulation for educational & portfolio demonstration. Not a regulated cross-border financial institution.', 18, y + 24);

  // Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('VaultChain Sovereign Core Ledger • Wire Advice Confirmation • Page 1 of 1', 14, footerY + 2);
  doc.text('Generated electronically under digital signature', pageWidth - 14, footerY + 2, { align: 'right' });

  const filename = `VaultChain_Wire_Receipt_${receiptId}.pdf`;
  doc.save(filename);
  return { success: true, filename, receiptId };
}

