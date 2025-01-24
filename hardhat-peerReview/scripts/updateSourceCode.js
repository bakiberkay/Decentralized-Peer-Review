const { ethers } = require("hardhat");

async function updateSourceCode() {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", "0x3d0D2F202Fd195aB1De6553a64882b993Dd6FF44", deployer);

    // Updated JavaScript code with Uint8Array encoding
    const jsCode = `

const { ethers } = await import("npm:ethers@6.10.0") // Import ethers.js v6.10.0

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

function evaluateReviewHonesty(reviewText) {
    const badFaithPhrases = [
        "this is useless",
        "waste of time",
        "not worth it",
        "don't care",
        "totally wrong"
    ];
    const inattentivePatterns = [
        { pattern: /\\b(very){3,}\\b/i, description: "Excessive repetition" },
        { pattern: /^[a-z\\s]{1,10}$/i, description: "Too short" },
        { pattern: /\\b(dummy|test|blah)\\b/i, description: "Filler words" },
    ];

    // Detect bad faith content
    for (const phrase of badFaithPhrases) {
        if (reviewText.toLowerCase().includes(phrase)) {
            return { isHonest: false, reason: 1 };
        }
    }

    // Detect inattentiveness
    for (const { pattern, description } of inattentivePatterns) {
        if (pattern.test(reviewText)) {
            return { isHonest: false, reason: 2 };
        }
    }

    // Ensure minimum effort
    const wordCount = reviewText.split(/\\s+/).length;
    if (wordCount < 5) {
        return { isHonest: false, reason: 3 };
    }

    return { isHonest: true, reason: 0 };
}

// Extract arguments
const [reviewId, reviewText] = args;

// Evaluate the review
const evaluation = evaluateReviewHonesty(reviewText);

// Encode the result into a Uint8Array
const result = {
    reviewId: parseInt(reviewId),
    ...evaluation,
};

// Use TextEncoder to convert the result into a Uint8Array
//const encodedResult = new TextEncoder().encode(JSON.stringify(result));
//const encodedResult = Functions.encodeString(JSON.stringify(result));
const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "bool", "uint256"],
    [result.reviewId, result.isHonest, result.reason]
);

// Return the Uint8Array
return ethers.getBytes(encodedResult);
    `;

    // Call the contract's updateSourceCode function
    const tx = await contract.updateSourceCode(jsCode);
    await tx.wait();

    console.log("JavaScript source code updated successfully for PeerReview contract!");
}

updateSourceCode().catch((error) => {
    console.error("Error updating source code:", error);
    process.exitCode = 1;
});
