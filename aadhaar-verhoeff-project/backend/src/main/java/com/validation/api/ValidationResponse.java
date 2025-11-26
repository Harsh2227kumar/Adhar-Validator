/**
 * ValidationResponse.java
 * Data Transfer Object (DTO) for the API response after Aadhaar validation.
 * This object is automatically serialized into JSON by the Spring Boot controller.
 */
package com.validation.api;

public class ValidationResponse {
    // Boolean status indicating whether the Aadhaar number passed the Verhoeff check.
    private final boolean isValid;
    
    // A descriptive message explaining the validation outcome.
    private final String message;

    /**
     * Constructor for the validation response.
     * @param isValid true if the number is valid, false otherwise.
     * @param message a human-readable message about the result.
     */
    public ValidationResponse(boolean isValid, String message) {
        this.isValid = isValid;
        this.message = message;
    }

    // Getters are required for Jackson (Spring Boot's default JSON library) 
    // to serialize the fields into the final JSON response.

    public boolean getIsValid() {
        return isValid;
    }

    public String getMessage() {
        return message;
    }
}