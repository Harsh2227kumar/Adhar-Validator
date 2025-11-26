/**
 * VerhoeffValidator.java
 * Implements the Verhoeff Algorithm for Aadhaar number validation and checksum generation.
 * This class leverages the mathematical structure of the Dihedral Group D5 for its error detection 
 * properties, providing a superior check compared to simpler algorithms.
 */
package com.validation.core;

public class VerhoeffValidator {

    // --- Verhoeff Algorithm Core Tables ---
    // 1. D-Table (Multiplication Table for D5) - Defines the group operation.
    private static final int[][] D_TABLE = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 2, 3, 4, 0, 6, 7, 8, 9, 5},
        {2, 3, 4, 0, 1, 7, 8, 9, 5, 6},
        {3, 4, 0, 1, 2, 8, 9, 5, 6, 7},
        {4, 0, 1, 2, 3, 9, 5, 6, 7, 8},
        {5, 9, 8, 7, 6, 0, 4, 3, 2, 1},
        {6, 5, 9, 8, 7, 1, 0, 4, 3, 2},
        {7, 6, 5, 9, 8, 2, 1, 0, 4, 3},
        {8, 7, 6, 5, 9, 3, 2, 1, 0, 4},
        {9, 8, 7, 6, 5, 4, 3, 2, 1, 0}
    };

    // 2. P-Table (Permutation Table) - Applies position-dependent permutation (i mod 8).
    private static final int[][] P_TABLE = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 5, 7, 6, 2, 8, 3, 0, 9, 4},
        {5, 8, 0, 3, 7, 9, 6, 1, 4, 2},
        {8, 9, 1, 6, 0, 4, 3, 5, 2, 7},
        {9, 4, 5, 3, 1, 2, 6, 8, 7, 0},
        {4, 2, 8, 6, 5, 7, 3, 9, 0, 1},
        {2, 7, 9, 3, 8, 0, 6, 4, 1, 5},
        {7, 0, 4, 6, 9, 1, 3, 2, 5, 8}
    };

    // 3. Inv-Table (Inverse Table) - Used for determining the checksum digit.
    private static final int[] INV_TABLE = {0, 4, 3, 2, 1, 5, 6, 7, 8, 9};

    /**
     * Executes the core Verhoeff calculation on a sequence of digits in reverse order.
     */
    private static int calculateChecksum(int[] digits) {
        int c = 0; // Initial cumulative checksum

        // Iterate through digits from right to left (i=0 is the rightmost digit)
        for (int i = 0; i < digits.length; i++) {
            int digit = digits[digits.length - 1 - i]; 
            int pIndex = i % 8; // Positional index for permutation
            
            // 1. Permute the digit
            int permutedDigit = P_TABLE[pIndex][digit];
            
            // 2. Combine with running checksum using D-Table
            c = D_TABLE[c][permutedDigit];
        }

        return c;
    }

    /**
     * Validates a complete 12-digit Aadhaar number. The number is valid if the final 
     * cumulative checksum after processing all 12 digits is 0.
     *
     * @param aadhaarNumber A 12-digit Aadhaar number string (may contain spaces).
     * @return true if the number is mathematically valid, false otherwise.
     */
    public static boolean validateAadhaar(String aadhaarNumber) {
        String cleanedNumber = aadhaarNumber.replaceAll("\\s", "");
        
        if (cleanedNumber == null || !cleanedNumber.matches("\\d{12}")) {
            return false;
        }

        int[] digits = new int[12];
        for (int i = 0; i < 12; i++) {
            digits[i] = Character.getNumericValue(cleanedNumber.charAt(i));
        }

        return calculateChecksum(digits) == 0;
    }
}