import React, { useState, useMemo } from 'react';

// --- VERHOEFF ALGORITHM TABLES ---
// These tables define the operation of the Dihedral Group D5, which underpins the checksum calculation.

// D_TABLE: The Multiplication Table (Cayley table of D5).
// D[i][j] = i * j (non-commutative)
const D_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// P_TABLE: The Permutation Table.
// P[i][j] permutes digit j based on position (i % 8).
const P_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// INV_TABLE: The Inverse Table.
// Used to find the check digit (k) such that D[c][k] = 0.
const INV_TABLE = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Executes the Verhoeff algorithm step-by-step for validation visualization.
 * It simulates the process for a given number (assumed to be 12 digits for Aadhaar).
 * @param {string} numString - The 12-digit Aadhaar number string.
 * @returns {{steps: Array<object>, isValid: boolean, finalChecksum: number}}
 */
const getVerhoeffValidationSteps = (numString) => {
    // 1. Basic validation and sanitization
    const cleanedNum = numString.replace(/\D/g, '');
    const digits = cleanedNum.split('').map(Number);

    if (digits.some(isNaN)) {
        return { steps: [], isValid: false, finalChecksum: null };
    }

    // 2. Reverse the number for validation sequence (right-to-left processing)
    const reversedDigits = [...digits].reverse();

    // 3. Initialize checksum
    let currentChecksum = 0;
    const steps = [];

    // 4. Iterate through the reversed digits (i=0 for the rightmost digit, 11 for the leftmost)
    for (let i = 0; i < reversedDigits.length; i++) {
        const digit = reversedDigits[i];
        const pIndex = i % 8;
        
        // Lookup the permutation from the P-Table
        const permutedDigit = P_TABLE[pIndex][digit];
        
        // Combine with the running checksum using the D-Table
        const newChecksum = D_TABLE[currentChecksum][permutedDigit];

        steps.push({
            i: i + 1, // 1-based index for display
            digit: digit,
            pIndex: pIndex,
            permutedDigit: permutedDigit,
            oldChecksum: currentChecksum,
            newChecksum: newChecksum,
        });

        currentChecksum = newChecksum;
    }

    // 5. Final Result Check (only valid if 12 digits were checked and the final checksum is 0)
    const isValid = cleanedNum.length === 12 && currentChecksum === 0;

    return { steps, isValid, finalChecksum: currentChecksum };
};

/**
 * Function to calculate the required checksum for an 11-digit prefix.
 * @param {string} prefix - The 11-digit Aadhaar prefix string.
 * @returns {number | null} The required checksum digit (0-9) or null.
 */
const generateChecksumDigit = (prefix) => {
    const cleanedPrefix = prefix.replace(/\D/g, '');
    const digits = cleanedPrefix.split('').map(Number);
    
    if (digits.length !== 11 || digits.some(isNaN)) return null;

    // Use the same validation logic but only for 11 digits
    const reversedDigits = [...digits].reverse();
    let currentChecksum = 0;

    for (let i = 0; i < reversedDigits.length; i++) {
        const digit = reversedDigits[i];
        const pIndex = i % 8;
        const permutedDigit = P_TABLE[pIndex][digit];
        currentChecksum = D_TABLE[currentChecksum][permutedDigit];
    }
    
    // The required checksum digit is the inverse of the final cumulative checksum 'c'
    return INV_TABLE[currentChecksum];
};


const App = () => {
    const [aadhaarInput, setAadhaarInput] = useState('');
    const [backendResult, setBackendResult] = useState({ status: 'initial', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Memoize the visualization and checksum calculation for performance
    const { steps, isValid, finalChecksum } = useMemo(() => {
        return getVerhoeffValidationSteps(aadhaarInput);
    }, [aadhaarInput]);

    // Calculate the generated checksum for 11-digit inputs
    const generatedChecksum = useMemo(() => {
        return generateChecksumDigit(aadhaarInput);
    }, [aadhaarInput]);

    // Input change handler including formatting logic
    const handleInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        const finalValue = value.substring(0, 12); // Limit to 12 digits

        // Format into 4-4-4 groups (XXXX XXXX XXXX)
        const formattedValue = finalValue.replace(/(\d{4})(?=\d)/g, '$1 ');
        setAadhaarInput(formattedValue);
        
        // Reset backend message on new input
        setBackendResult({ status: 'initial', message: '' });
    };

    // Simulated Backend Check (Represents the call to the Java API)
    const checkValidityWithBackend = async () => {
        const rawInput = aadhaarInput.replace(/\s/g, '');
        if (rawInput.length !== 12) return;

        setIsLoading(true);
        setBackendResult({ status: 'checking', message: 'Connecting to Java Verification Server...' });

        // --- SIMULATED FETCH/API CALL ---
        // IN PRODUCTION: Replace the following logic with a real fetch call to your deployed Java API 
        // that uses the VerhoeffValidator.java class.

        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

        // We use the client-side calculated value for the result simulation
        const isVerified = finalChecksum === 0; 
        
        if (isVerified) {
            setBackendResult({ 
                status: 'valid', 
                message: '✅ VALID (Confirmed by Simulated Java Backend). Final checksum is 0.' 
            });
        } else {
            setBackendResult({ 
                status: 'invalid', 
                message: `❌ INVALID (Confirmed by Simulated Java Backend). Final checksum is ${finalChecksum} (must be 0).` 
            });
        }

        setIsLoading(false);
    };

    // Determine UI styling based on status
    const resultClasses = useMemo(() => {
        let base = 'p-4 rounded-xl border-l-4 font-semibold text-center mt-4 ';
        switch (backendResult.status) {
            case 'valid':
                return base + 'bg-green-100 text-green-800 border-green-500';
            case 'invalid':
                return base + 'bg-red-100 text-red-800 border-red-500';
            case 'checking':
                return base + 'bg-yellow-100 text-yellow-800 border-yellow-500';
            default:
                return 'hidden';
        }
    }, [backendResult.status]);

    const isInputReadyForCheck = aadhaarInput.replace(/\s/g, '').length === 12 && !isLoading;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gray-100">
            <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl overflow-hidden">
                
                {/* Header */}
                <header className="bg-gradient-to-r from-blue-700 to-indigo-500 p-6 rounded-t-xl">
                    <h1 className="text-3xl font-bold text-white mb-1">Aadhaar Verhoeff Checksum Validator</h1>
                    <p className="text-indigo-200">Interactive visualization and secure server validation demonstration.</p>
                </header>

                {/* Main Content */}
                <main className="p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* Input and Summary Panel */}
                        <div className="lg:w-1/3 space-y-6">
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
                                <label htmlFor="aadhaarInput" className="block text-sm font-medium text-gray-700 mb-2">Enter 12-Digit Aadhaar Number</label>
                                <input
                                    type="text"
                                    id="aadhaarInput"
                                    maxLength="14" // 12 digits + 2 spaces
                                    value={aadhaarInput}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg tracking-widest text-center font-mono"
                                    placeholder="XXXX XXXX XXXX"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500 mt-2">The final digit is the checksum.</p>
                                
                                {/* Server Validation Button */}
                                <button
                                    onClick={checkValidityWithBackend}
                                    disabled={!isInputReadyForCheck || isLoading}
                                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150 disabled:bg-blue-300 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        'Check Final Validity (Simulated Java Backend)'
                                    )}
                                </button>
                                
                                {/* Live Validation Result */}
                                <div className={resultClasses} hidden={backendResult.status === 'initial'}>
                                    {backendResult.message}
                                </div>
                            </div>

                            {/* Checksum Generation Help */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800">
                                <h3 className="font-bold text-lg mb-2">Checksum Generator</h3>
                                <p>If you enter **11 digits**, the required 12th checksum digit is:</p>
                                <p id="generatedChecksum" className="text-3xl font-extrabold mt-2 text-center text-blue-700">
                                    {aadhaarInput.replace(/\s/g, '').length === 11 && generatedChecksum !== null
                                        ? generatedChecksum
                                        : '...'}
                                </p>
                            </div>
                        </div>

                        {/* Visualization Table */}
                        <div className="lg:w-2/3">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Visualization: Live Checksum Calculation</h2>
                            
                            <div className="scroll-container bg-white rounded-lg shadow-md border border-gray-100">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Pos (i)</th>
                                            <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Digit ($d'$)</th>
                                            <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Permutation ($P[i \bmod 8]$)</th>
                                            <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Permuted Digit ($P[...][d']$)</th>
                                            <th className="px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">New Checksum ($D[c][p]$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {steps.length > 0 ? (
                                            steps.map((step) => (
                                                <tr key={step.i} className="hover:bg-blue-50 transition duration-150">
                                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-mono">{step.i}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-mono font-bold">{step.digit}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-center text-xs text-gray-500">P[{step.pIndex}] ($c_{old}={step.oldChecksum}$)</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-mono">{step.permutedDigit}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-mono text-blue-600 font-bold">{step.newChecksum}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="h-20"><td colSpan="5" className="text-center text-gray-400 italic py-8">Enter digits (12 total) to see the full calculation process...</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Final Result Row */}
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-lg font-bold flex justify-between items-center">
                                <span>Final Cumulative Checksum:</span>
                                <span className={`text-2xl font-extrabold ${finalChecksum === 0 ? 'text-green-600' : finalChecksum !== null ? 'text-red-600' : 'text-gray-600'}`}>
                                    {finalChecksum !== null ? finalChecksum : '--'}
                                </span>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;