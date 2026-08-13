package com.sovereign.ledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SovereignLedgerApplication {

	public static void main(String[] args) {
		SpringApplication.run(SovereignLedgerApplication.class, args);
	}

}
