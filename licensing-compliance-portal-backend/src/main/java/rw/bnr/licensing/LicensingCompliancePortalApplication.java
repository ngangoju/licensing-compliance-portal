package rw.bnr.licensing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LicensingCompliancePortalApplication {

	public static void main(String[] args) {
		SpringApplication.run(LicensingCompliancePortalApplication.class, args);
	}

}
