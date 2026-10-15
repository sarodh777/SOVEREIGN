package com.sovereign.ledger;

import com.sovereign.ledger.model.User;
import com.sovereign.ledger.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SovereignLedgerApplication {

	public static void main(String[] args) {
		SpringApplication.run(SovereignLedgerApplication.class, args);
	}

	@Bean
	CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			String adminEmail = "admin@vaultchain.bank";
			User admin = userRepository.findByEmail(adminEmail).orElse(null);
			if (admin == null) {
				admin = new User(adminEmail, passwordEncoder.encode("password123"), "System Administrator");
				admin.setRole("ROLE_SUPER_ADMIN");
				admin.setEmailVerified(true);
				admin.setActive(true);
				userRepository.save(admin);
			} else {
				if (!"ROLE_SUPER_ADMIN".equals(admin.getRole()) && !"ROLE_ADMIN".equals(admin.getRole())) {
					admin.setRole("ROLE_SUPER_ADMIN");
					userRepository.save(admin);
				}
			}
		};
	}
}
