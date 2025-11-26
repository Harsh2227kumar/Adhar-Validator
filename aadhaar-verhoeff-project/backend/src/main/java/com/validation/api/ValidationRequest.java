package com.validation.api;

/**
 * Data Transfer Object for Aadhaar validation requests.
 * Used to map the JSON request body containing the aadhaar number.
 */
public class ValidationRequest {
    private String aadhaarNumber;

    // Getters and Setters are required by Spring/Jackson for object mapping

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }
}