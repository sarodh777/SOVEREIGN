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

    public boolean sendOtpEmail(String to, String otp) {
        try {
            logger.info("Attempting to send OTP email to: {}", to);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("URGENT: Sovereign Ledger Access Protocol");
            
            String htmlContent = "<div style='font-family: monospace; background-color: #0B0F14; color: #F0F6FC; padding: 30px; border-radius: 8px; border-left: 4px solid #00F0FF;'>" +
                    "<h2 style='color: #00F0FF; letter-spacing: 2px;'>SOVEREIGN LEDGER - NODE AUTHENTICATION</h2>" +
                    "<p>An access request was initiated for your institutional node operator profile.</p>" +
                    "<p>Your 6-Digit Secure Protocol Authorization Code is:</p>" +
                    "<h1 style='color: #00F0FF; tracking: 0.5em; font-size: 32px;'> " + otp + " </h1>" +
                    "<p style='color: #FF3366; font-size: 12px;'>WARNING: Do not share this code with anyone. Sovereign support staff will never ask for this code.</p>" +
                    "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("OTP email successfully sent to: {}", to);
            return true;
            
        } catch (MessagingException e) {
            logger.error("Failed to send OTP email to {}: {}", to, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error sending OTP email to {}: {}", to, e.getMessage(), e);
            return false;
        }
    }
}
