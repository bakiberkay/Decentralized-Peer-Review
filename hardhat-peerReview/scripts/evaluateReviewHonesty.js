function evaluateReviewHonesty(reviewText) {
    const badFaithPhrases = [
        "this is useless",
        "waste of time",
        "not worth it",
        "don't care",
        "totally wrong"
    ];
    const inattentivePatterns = [
        { pattern: /\b(very){3,}\b/i, description: "Excessive repetition" },
        { pattern: /^[a-z\s]{1,10}$/i, description: "Too short" },
        { pattern: /\b(dummy|test|blah)\b/i, description: "Filler words" },
    ];

    // Detect bad faith content
    for (const phrase of badFaithPhrases) {
        if (reviewText.toLowerCase().includes(phrase)) {
            return { isHonest: false, reason: "Bad faith review" };
        }
    }

    // Detect inattentiveness
    for (const { pattern, description } of inattentivePatterns) {
        if (pattern.test(reviewText)) {
            return { isHonest: false, reason: `Inattentive review: ${description}` };
        }
    }

    // Ensure minimum effort
    const wordCount = reviewText.split(/\s+/).length;
    if (wordCount < 5) {
        return { isHonest: false, reason: "Too short to be meaningful" };
    }

    return { isHonest: true, reason: "Review appears to be honest and attentive" };
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
const encodedResult = new TextEncoder().encode(JSON.stringify(result));

// Return the Uint8Array
return encodedResult;
