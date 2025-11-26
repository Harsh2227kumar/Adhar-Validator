package com.validation.api;

import com.validation.core.VerhoeffValidator;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

/**
 * REST Controller that exposes the Aadhaar verification functionality 
 * via a secure API endpoint.
 * Requires Spring Boot dependencies (spring-boot-starter-web).
 */
@RestController
@RequestMapping("/api")
// @CrossOrigin is required to allow the React frontend (running on a different port) 
// to make requests to this API.
@CrossOrigin(origins = "http://localhost:3000") // Assuming React runs on port 3000
public class ValidationController {

    /**
     * Endpoint to check the validity of an Aadhaar number.
     * Accessible via POST request to /api/validate
     * * @param request The JSON body containing the aadhaarNumber.
     * @return A JSON response indicating the validity status.
     */
    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validateAadhaar(@RequestBody ValidationRequest request) {
        String inputNumber = request.getAadhaarNumber();
        
        if (inputNumber == null || inputNumber.isEmpty()) {
            return ResponseEntity.badRequest().body(new ValidationResponse(false, "Input cannot be empty."));
        }

        // Use the core, authoritative validation logic
        boolean isValid = VerhoeffValidator.validateAadhaar(inputNumber);

        String message = isValid 
            ? "Aadhaar number is mathematically valid." 
            : "Aadhaar number failed the Verhoeff checksum check.";

        ValidationResponse response = new ValidationResponse(isValid, message);
        return ResponseEntity.ok(response);
    }
}

/**
 * Simple response DTO for the API.
 */
class ValidationResponse {
    private final boolean isValid;
    private final String message;

    public ValidationResponse(boolean isValid, String message) {
        this.isValid = isValid;
        this.message = message;
    }

    public boolean getIsValid() {
        return isValid;
    }

    public String getMessage() {
        return message;
    }
}