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
                    subject   = "Sovereign Ledger — Verify Your Email";
                    headline  = "Welcome to Sovereign Ledger!";
                    bodyText  = "Hi " + (name != null ? name : "there") + ", please verify your email to complete registration.";
                }
                case "RESET_PASSWORD" -> {
                    subject   = "Sovereign Ledger — Password Reset Code";
                    headline  = "Reset Your Password";
                    bodyText  = "We received a request to reset your password. Use the code below.";
                }
                default -> {
                    subject   = "Sovereign Ledger — Secure Login Code";
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
                "<h1 style='color:#00F0FF; margin:0; font-size:22px; letter-spacing:4px; font-weight:800;'>SOVEREIGN LEDGER</h1>" +
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
                "<p style='color:#4A5568; font-size:11px; margin:0;'>© 2026 Sovereign Ledger. All rights reserved.</p>" +
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
            helper.setSubject("Sovereign Ledger — Order Confirmation #" + orderId);

            String html = "<div style='font-family:sans-serif;background:#f3f4f6;padding:40px;'>" +
                "<div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;'>" +
                "<div style='background:#0B0F14;padding:30px;text-align:center;'>" +
                "<h1 style='color:#00F0FF;margin:0;letter-spacing:2px;'>SOVEREIGN LEDGER</h1></div>" +
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
            helper.setSubject("VaultChain — Payment Received 💰");

            String html = buildEmailWrapper(
                "Payment Received!",
                "Hi " + (receiverName != null ? receiverName : "there") + ", you have received a payment.",
                "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
                buildRow("Amount Received", "<span style='color:#10B981;font-weight:bold;font-size:18px;'>₹" + String.format("%.2f", amount) + "</span>") +
                buildRow("From", senderName) +
                buildRow("Transaction ID", "<code style='color:#00F0FF;'>" + txId + "</code>") +
                buildRow("Date & Time", date) +
                buildRow("Status", "<span style='color:#10B981;font-weight:bold;'>✓ RECEIVED</span>") +
                (blockchainHash != null ? buildRow("Blockchain Hash", "<code style='font-size:11px;color:#718096;'>" + blockchainHash + "</code>") : "") +
                "</table>"
            );
            helper.setText(html, true);
            mailSender.send(message);
            logger.info("Receiver confirmation sent to: {}", to);
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

            String html = buildEmailWrapper(
                "Smart Transfer " + (success ? "Successful" : "Failed"),
                "Hi " + (name != null ? name : "there") + ", your smart transfer rule has been processed.",
                "<table style='width:100%;border-collapse:collapse;font-size:14px;'>" +
                buildRow("Rule Name", ruleName) +
                buildRow("Amount", "₹" + String.format("%.2f", amount)) +
                buildRow("Status", success
                    ? "<span style='color:#10B981;font-weight:bold;'>✓ SUCCESS</span>"
                    : "<span style='color:#FF006E;font-weight:bold;'>✗ FAILED</span>") +
                buildRow(success ? "Transaction ID" : "Failure Reason", detail) +
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

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────
    private String buildRow(String label, String value) {
        return "<tr style='border-bottom:1px solid rgba(255,255,255,0.05);'>" +
               "<td style='padding:10px 0;color:#718096;width:40%;'>" + label + "</td>" +
               "<td style='padding:10px 0;color:#E8EEF7;font-weight:500;'>" + value + "</td></tr>";
    }

    private String buildEmailWrapper(String title, String subtitle, String body) {
        return "<div style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0B0F14;padding:40px;'>" +
               "<div style='max-width:560px;margin:0 auto;background:#1A1F2E;border-radius:16px;overflow:hidden;border:1px solid rgba(0,240,255,0.2);'>" +
               "<div style='background:linear-gradient(135deg,#0B0F14 0%,#1A1F2E 100%);padding:28px;text-align:center;border-bottom:1px solid rgba(0,240,255,0.1);'>" +
               "<h1 style='color:#00F0FF;margin:0;font-size:20px;letter-spacing:4px;'>VAULTCHAIN</h1>" +
               "<p style='color:#718096;margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;'>Secure Banking Platform</p></div>" +
               "<div style='padding:36px;'>" +
               "<h2 style='color:#E8EEF7;margin:0 0 8px;'>" + title + "</h2>" +
               "<p style='color:#A0AEC0;margin:0 0 24px;line-height:1.6;'>" + subtitle + "</p>" +
               body +
               "</div>" +
               "<div style='background:#0B0F14;padding:16px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);'>" +
               "<p style='color:#4A5568;font-size:11px;margin:0;'>© 2026 VaultChain. All rights reserved. Do not share this email.</p></div>" +
               "</div></div>";
    }
}
