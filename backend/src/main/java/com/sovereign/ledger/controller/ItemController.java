package com.sovereign.ledger.controller;

import com.sovereign.ledger.model.SuperAppOrder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

import com.sovereign.ledger.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*") // Allow frontend to fetch data
public class ItemController {

    @Autowired
    private EmailService emailService;

    @GetMapping
    public ResponseEntity<List<SuperAppOrder>> getItems() {
        // Mock items based on the requested categories
        List<SuperAppOrder> mockItems = Arrays.asList(
            new SuperAppOrder("Organic Tomatoes", "Vegetables", false, 4.99, "/assets/organic_tomatoes_1777012273551.png"),
            new SuperAppOrder("Premium Denim Jacket", "Clothing", false, 89.99, "/assets/denim_jacket_1777012302397.png"),
            new SuperAppOrder("Home Cleaning Service", "Works", true, 150.00, "/assets/home_cleaning_1777012488599.png"),
            new SuperAppOrder("Modern Sofa", "Furniture", false, 499.00, "/assets/modern_sofa_1777012540101.png"),
            new SuperAppOrder("Noise Cancelling Headphones", "Electronics", false, 299.99, "/assets/headphones_1777012555417.png")
        );
        return ResponseEntity.ok(mockItems);
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        
        Double total = Double.valueOf(payload.get("total").toString());
        String orderId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        boolean sent = emailService.sendOrderConfirmationEmail(email, orderId, total);
        if (sent) {
            return ResponseEntity.ok(Map.of("message", "Checkout successful, email sent", "orderId", orderId));
        } else {
            return ResponseEntity.internalServerError().body("Checkout successful, but failed to send email");
        }
    }
}
