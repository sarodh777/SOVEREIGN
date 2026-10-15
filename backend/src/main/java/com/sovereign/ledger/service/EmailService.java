package com.sovereign.ledger.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    // ─── UNIFIED OTP EMAIL ──────────────────────────────────────────────────────
    public boolean sendOtpEmail(String to, String otp, String purpose, String name) {
        try {
            String subject;
            String headline;
            String bodyText;

            switch (purpose) {
                case "REGISTER" -> {
                    subject   = "VaultChain — Verify Your Email";
                    headline  = "Welcome to VaultChain!";
                    bodyText  = "Hi " + (name != null ? name : "there") + ", please verify your email to complete registration.";
                }
                case "RESET_PASSWORD" -> {
                    subject   = "VaultChain — Password Reset Code";
                    headline  = "Reset Your Password";
                    bodyText  = "We received a request to reset your password. Use the code below.";
                }
                default -> {
                    subject   = "VaultChain — Secure Login Code";
                    headline  = "Your Login Verification Code";
                    bodyText  = "A login attempt was made for your account. Use the code below to authenticate.";
                }
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);

            String html = "<div style='font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#0B0F14; padding:40px;'>" +
                "<div style='max-width:520px; margin:0 auto; background:#1A1F2E; border-radius:16px; overflow:hidden; border:1px solid rgba(0,240,255,0.2);'>" +
                "<div style='background:linear-gradient(135deg,#0B0F14 0%,#1A1F2E 100%); padding:32px; text-align:center; border-bottom:1px solid rgba(0,240,255,0.1);'>" +
                "<h1 style='color:#00F0FF; margin:0; font-size:22px; letter-spacing:4px; font-weight:800;'>VaultChain</h1>" +
                "<p style='color:#718096; margin:6px 0 0; font-size:12px; letter-spacing:2px; text-transform:uppercase;'>Secure Banking Platform</p>" +
                "</div>" +
                "<div style='padding:40px;'>" +
                "<h2 style='color:#E8EEF7; margin:0 0 12px;'>" + headline + "</h2>" +
                "<p style='color:#A0AEC0; line-height:1.7; margin:0 0 28px;'>" + bodyText + "</p>" +
                "<div style='background:#0B0F14; border:2px solid #00F0FF; border-radius:12px; padding:28px; text-align:center; margin:0 0 28px;'>" +
                "<p style='color:#718096; margin:0 0 8px; font-size:11px; letter-spacing:2px; text-transform:uppercase;'>Your Verification Code</p>" +
                "<h1 style='color:#00F0FF; font-size:44px; letter-spacing:10px; margin:0; font-family:monospace; font-weight:900;'>" + otp + "</h1>" +
                "</div>" +
                "<p style='color:#FF006E; font-size:12px; margin:0;'>⚠️ This code expires in 10 minutes. Never share it with anyone.</p>" +
                "</div>" +
                "<div style='background:#0B0F14; padding:20px; text-align:center; border-top:1px solid rgba(255,255,255,0.05);'>" +
                "<p style='color:#4A5568; font-size:11px; margin:0;'>© 2026 VaultChain. All rights reserved.</p>" +
                "</div></div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            logger.info("OTP email [{}] sent to: {}", purpose, to);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send OTP email [{}] to {}: {}", purpose, to, e.getMessage());
            return false;
        }
    }

    // ─── LEGACY SUPPORT ─────────────────────────────────────────────────────────
    public boolean sendOtpEmail(String to, String otp) {
        return sendOtpEmail(to, otp, "LOGIN", null);
    }

    // ─── ORDER CONFIRMATION ──────────────────────────────────────────────────────
    public boolean sendOrderConfirmationEmail(String to, String orderId, double totalAmount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("VaultChain — Order Confirmation #" + orderId);

            String html = "<div style='font-family:sans-serif;background:#f3f4f6;padding:40px;'>" +
                "<div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;'>" +
                "<div style='background:#0B0F14;padding:30px;text-align:center;'>" +
                "<h1 style='color:#00F0FF;margin:0;letter-spacing:2px;'>VaultChain</h1></div>" +
                "<div style='padding:40px;'>" +
                "<h2 style='color:#1f2937;'>Order Confirmed!</h2>" +
                "<div style='background:#f0fdf4;border-left:4px solid #10b981;padding:20px;margin:20px 0;'>" +
                "<p style='margin:0;font-weight:bold;'>Order ID: <span style='color:#10b981;'>" + orderId + "</span></p>" +
                "<p style='margin:10px 0 0;font-weight:bold;'>Amount: <span style='color:#10b981;'>₹" + String.format("%.2f", totalAmount) + "</span></p>" +
                "</div></div></div></div>";

            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send order confirmation: {}", e.getMessage());
            return false;
        }
    }

    // ─── PAYMENT OTP ─────────────────────────────────────────────────────────────
    public boolean sendPaymentOtpEmail(String to, String otp) {
        return sendOtpEmail(to, otp, "PAYMENT", null);
    }

    // ─── TRANSACTION CONFIRMATION (SENDER) ────────────────────────────────────
    public boolean sendTransactionConfirmationSender(String to, String senderName, String receiverName,
                                                      java.math.BigDecimal amount, String txId,
                                                      String date, java.math.BigDecimal remainingBalance,
                                                      String blockchainHash) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("VaultChain — Transaction Successful ✓");

            String html = buildEmailWrapper(
                "Transaction Successful",
                "Hi " + (senderName != null ? senderName : "there") + ", your transfer has been processed successfully.",
                "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
                buildRow("Amount Debited", "<span style='color:#FF006E;font-weight:bold;font-size:18px;'>₹" + String.format("%.2f", amount) + "</span>") +
                buildRow("Receiver", receiverName) +
                buildRow("Transaction ID", "<code style='color:#00F0FF;'>" + txId + "</code>") +
                buildRow("Date & Time", date) +
                buildRow("Status", "<span style='color:#10B981;font-weight:bold;'>✓ SUCCESS</span>") +
                buildRow("Remaining Balance", "₹" + String.format("%.2f", remainingBalance)) +
                (blockchainHash != null ? buildRow("Blockchain Hash", "<code style='font-size:11px;color:#718096;'>" + blockchainHash + "</code>") : "") +
                "</table>" +
                "<p style='color:#718096;font-size:12px;margin-top:20px;'>Transaction authenticated using Transaction PIN + Email OTP.</p>"
            );
            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Sender confirmation sent to: {}", to);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send sender confirmation: {}", e.getMessage());
            return false;
        }
    }

    // ─── TRANSACTION CONFIRMATION (RECEIVER) ──────────────────────────────────
    public boolean sendTransactionConfirmationReceiver(String to, String receiverName, String senderName,
                                                        java.math.BigDecimal amount, String txId,
                                                        String date, String blockchainHash) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("VaultChain — Payment Received! 💰");

            String safeReceiver = escapeHtml(receiverName != null ? receiverName : "Valued Customer");
            String safeSender   = escapeHtml(senderName != null ? senderName : "Authorized Sender");
            String safeTxId     = escapeHtml(txId != null ? txId : "VC-TX-" + System.currentTimeMillis());
            String safeDate     = escapeHtml(date != null ? date : java.time.LocalDateTime.now().toString());
            String safeHash     = blockchainHash != null ? escapeHtml(blockchainHash) : null;
            String formattedAmt = amount != null ? String.format("%,.2f", amount) : "0.00";

            String html =
                "<div style='margin:0;padding:40px 16px;background-color:#070B19;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;'>" +
                "  <div style='max-width:580px;margin:0 auto;background-color:#0E1738;border-radius:20px;overflow:hidden;border:1px solid rgba(20,184,166,0.3);box-shadow:0 20px 50px rgba(0,0,0,0.6);'>" +
                
                // Top Brand Banner
                "    <div style='background:linear-gradient(135deg,#080E24 0%,#0E1738 100%);padding:28px 32px;text-align:center;border-bottom:1px solid rgba(20,184,166,0.2);'>" +
                "      <div style='display:inline-block;padding:8px 16px;background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.35);border-radius:999px;margin-bottom:12px;'>" +
                "        <span style='color:#14B8A6;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;'>✦ VAULTCHAIN</span>" +
                "      </div>" +
                "      <p style='color:#64748B;margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;'>Cryptographic Ledger & Banking Network</p>" +
                "    </div>" +

                // Body Section
                "    <div style='padding:36px 32px;'>" +
                "      <div style='text-align:center;margin-bottom:28px;'>" +
                "        <h1 style='color:#FFFFFF;margin:0 0 8px;font-size:26px;font-weight:900;letter-spacing:-0.5px;'>Payment Received!</h1>" +
                "        <p style='color:#94A3B8;margin:0;font-size:14px;line-height:1.5;'>Hi <strong style='color:#F1F5F9;'>" + safeReceiver + "</strong>, you have received funds into your account.</p>" +
                "      </div>" +

                // Hero Amount Card
                "      <div style='background:linear-gradient(180deg,rgba(20,184,166,0.12) 0%,rgba(6,182,212,0.06) 100%);border:1px solid rgba(20,184,166,0.4);border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;'>" +
                "        <span style='display:block;color:#14B8A6;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;'>Amount Credited</span>" +
                "        <div style='color:#2DD4BF;font-size:36px;font-weight:900;letter-spacing:-1px;margin-bottom:8px;font-family:monospace;'>₹ " + formattedAmt + "</div>" +
                "        <div style='display:inline-block;padding:3px 12px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);border-radius:999px;color:#34D399;font-size:11px;font-weight:700;'>✓ COMPLETED</div>" +
                "      </div>" +

                // Transaction Details Table
                "      <div style='background:#091029;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 20px;margin-bottom:28px;'>" +
                "        <table style='width:100%;border-collapse:collapse;font-size:13px;'>" +
                buildRow("Sender", "<span style='color:#F1F5F9;font-weight:600;'>" + safeSender + "</span>") +
                buildRow("Transaction ID", "<code style='color:#38BDF8;font-family:monospace;background:#050C21;padding:2px 8px;border-radius:6px;border:1px solid rgba(56,189,248,0.2);'>" + safeTxId + "</code>") +
                buildRow("Date & Time", "<span style='color:#CBD5E1;'>" + safeDate + "</span>") +
                buildRow("Status", "<span style='color:#34D399;font-weight:700;'>✓ SETTLED & VERIFIED</span>") +
                (safeHash != null ? buildRow("Blockchain Hash", "<code style='font-size:11px;color:#94A3B8;word-break:break-all;font-family:monospace;'>" + safeHash + "</code>") : "") +
                "        </table>" +
                "      </div>" +

                // CTA Button
                "      <div style='text-align:center;margin-bottom:24px;'>" +
                "        <a href='http://localhost:5173/transactions' style='display:inline-block;background:linear-gradient(135deg,#0D9488 0%,#06B6D4 100%);color:#FFFFFF;text-decoration:none;font-weight:800;font-size:13px;padding:14px 32px;border-radius:12px;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(13,148,136,0.35);'>View Transaction Details →</a>" +
                "      </div>" +

                // Security Note
                "      <div style='background:rgba(148,163,184,0.06);border:1px solid rgba(148,163,184,0.12);border-radius:10px;padding:12px 16px;'>" +
                "        <p style='color:#94A3B8;font-size:11px;margin:0;line-height:1.5;'>🔒 <strong>Security Notice:</strong> You must securely sign in to view full transaction logs. VaultChain will never ask for your password, PIN, or private keys by email.</p>" +
                "      </div>" +
                "    </div>" +

                // Footer
                "    <div style='background:#070C1E;padding:20px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);'>" +
                "      <p style='color:#475569;font-size:11px;margin:0 0 4px;'>© 2026 VAULTCHAIN. All rights reserved.</p>" +
                "      <p style='color:#334155;font-size:10px;margin:0;'>Encrypted with SHA-256 and ECDSA cryptographic consensus.</p>" +
                "    </div>" +
                "  </div>" +
                "</div>";

            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Payment received confirmation sent to: {}", to);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send receiver confirmation: {}", e.getMessage());
            return false;
        }
    }

    // ─── SMART TRANSFER NOTIFICATION ──────────────────────────────────────────
    public boolean sendSmartTransferNotification(String to, String name, String ruleName,
                                                  java.math.BigDecimal amount, String status, String detail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            boolean success = "SUCCESS".equals(status);
            helper.setSubject("VaultChain — Smart Transfer " + (success ? "Executed ✓" : "Failed ✗"));

            String safeName   = escapeHtml(name != null ? name : "Customer");
            String safeRule   = escapeHtml(ruleName != null ? ruleName : "Smart Rule");
            String safeDetail = escapeHtml(detail != null ? detail : "");
            String formattedAmt = amount != null ? String.format("%,.2f", amount) : "0.00";

            String html = buildEmailWrapper(
                "Smart Transfer " + (success ? "Successful" : "Failed"),
                "Hi " + safeName + ", your automated smart transfer rule has been processed.",
                "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
                buildRow("Rule Name", safeRule) +
                buildRow("Amount", "₹ " + formattedAmt) +
                buildRow("Status", success
                    ? "<span style='color:#10B981;font-weight:bold;'>✓ SUCCESS</span>"
                    : "<span style='color:#FF006E;font-weight:bold;'>✗ FAILED</span>") +
                buildRow(success ? "Transaction ID" : "Failure Reason", safeDetail) +
                "</table>"
            );
            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send smart transfer notification: {}", e.getMessage());
            return false;
        }
    }

    // ─── FRAUD & SECURITY ALERT EMAIL ─────────────────────────────────────────
    public boolean sendSecurityAlert(String to, String name, String title, String details) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("⚠️ VaultChain Security Alert: " + title);

            String safeName    = escapeHtml(name != null ? name : "Customer");
            String safeTitle   = escapeHtml(title != null ? title : "Suspicious Activity");
            String safeDetails = escapeHtml(details != null ? details : "");

            String html = buildEmailWrapper(
                "Security Notice: " + safeTitle,
                "Dear " + safeName + ", our automated AI Fraud Surveillance detected unusual activity.",
                "<div style='background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;margin-bottom:24px;'>" +
                "<p style='color:#EF4444;font-weight:bold;margin:0 0 8px;font-size:15px;'>Activity Summary</p>" +
                "<p style='color:#E8EEF7;margin:0;line-height:1.6;font-size:13px;'>" + safeDetails + "</p>" +
                "</div>" +
                "<p style='color:#A0AEC0;font-size:12px;line-height:1.6;'>If this was initiated by you, please follow verification instructions in your VaultChain dashboard. If you did not authorize this, contact support immediately.</p>"
            );
            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send security alert email: {}", e.getMessage());
            return false;
        }
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────
    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String buildRow(String label, String value) {
        return "<tr style='border-bottom:1px solid rgba(255,255,255,0.06);'>" +
               "<td style='padding:12px 0;color:#64748B;width:40%;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-family:monospace;'>" + label + "</td>" +
               "<td style='padding:12px 0;color:#F1F5F9;font-weight:500;text-align:right;'>" + value + "</td></tr>";
    }

    private String buildEmailWrapper(String title, String subtitle, String body) {
        return "<div style='font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;background:#070B19;padding:40px 16px;color:#E2E8F0;'>" +
               "<div style='max-width:580px;margin:0 auto;background:#0E1738;border-radius:18px;overflow:hidden;border:1px solid rgba(20,184,166,0.3);box-shadow:0 15px 40px rgba(0,0,0,0.5);'>" +
               "<div style='background:linear-gradient(135deg,#080E24 0%,#0E1738 100%);padding:28px;text-align:center;border-bottom:1px solid rgba(20,184,166,0.15);'>" +
               "<h1 style='color:#14B8A6;margin:0;font-size:20px;letter-spacing:4px;font-weight:900;'>VAULTCHAIN</h1>" +
               "<p style='color:#64748B;margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;'>Cryptographic Ledger & Banking Network</p></div>" +
               "<div style='padding:36px 32px;'>" +
               "<h2 style='color:#FFFFFF;margin:0 0 8px;font-size:22px;font-weight:800;'>" + title + "</h2>" +
               "<p style='color:#94A3B8;margin:0 0 24px;line-height:1.6;font-size:14px;'>" + subtitle + "</p>" +
               body +
               "</div>" +
               "<div style='background:#070C1E;padding:18px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);'>" +
               "<p style='color:#475569;font-size:11px;margin:0;'>© 2026 VaultChain. All rights reserved. Do not share this email.</p></div>" +
               "</div></div>";
    }
}
