const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PeerReview Contract - Gas Usage for All Functions", function () {
  let peerReviewContract;
  let owner, author, reviewer, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13, user14, user15, user16, user17, user18, user19, user20, user21;

  beforeEach(async function () {
    const PeerReview = await ethers.getContractFactory("PeerReview");
    peerReviewContract = await PeerReview.deploy(); // 1 week interval
    await peerReviewContract.waitForDeployment();

  [owner, author, reviewer, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13, user14, user15, user16, user17, user18, user19, user20, user21 ] = await ethers.getSigners();


    // Register users
    await peerReviewContract.connect(author).registerUser(["AI", "Blockchain"]);
    await peerReviewContract.connect(reviewer).registerUser(["Machine Learning", "Maths"]);
    await peerReviewContract.connect(user1).registerUser(["Physics", "Chemistry"]);
    await peerReviewContract.connect(user2).registerUser(["Maths", "Physics"]);
    await peerReviewContract.connect(user3).registerUser(["Chemistry", "Biology"]);
    await peerReviewContract.connect(user4).registerUser(["Biology", "Physics"]);
    await peerReviewContract.connect(user5).registerUser(["Maths", "Chemistry"]);
    await peerReviewContract.connect(user6).registerUser(["AI", "ML"]);
    await peerReviewContract.connect(user7).registerUser(["Blockchain", "DeFi"]);
    await peerReviewContract.connect(user8).registerUser(["AI", "Blockchain"]);
    await peerReviewContract.connect(user9).registerUser(["Machine Learning", "Maths"]);
    await peerReviewContract.connect(user10).registerUser(["Physics", "Chemistry"]);
    await peerReviewContract.connect(user11).registerUser(["Maths", "Physics"]);
    await peerReviewContract.connect(user12).registerUser(["Chemistry", "Biology"]);
    await peerReviewContract.connect(user13).registerUser(["Biology", "Physics"]);
    await peerReviewContract.connect(user14).registerUser(["Maths", "Chemistry"]);
    await peerReviewContract.connect(user15).registerUser(["AI", "ML"]);
    await peerReviewContract.connect(user16).registerUser(["Blockchain", "DeFi"]);
    await peerReviewContract.connect(user17).registerUser(["AI", "Blockchain"]);
    await peerReviewContract.connect(user18).registerUser(["Machine Learning", "Maths"]);
    await peerReviewContract.connect(user19).registerUser(["Physics", "Chemistry"]);
    await peerReviewContract.connect(user20).registerUser(["Maths", "Physics"]);


    // Create a conference
    await peerReviewContract.connect(owner).createConference("AI Conference", "London", ["AI", "ML"]);

    // Submit a paper
    await peerReviewContract
      .connect(author)
      .submitPaper(1, "QmExamplePaperHash", "example", ["AI", "Blockchain"]);

    // Assign reviewer role
    await peerReviewContract.connect(owner).assignRole(1, reviewer.address, 2); // 2 = Role.Reviewer
  });

  it("should measure gas for all functions", async function () {
    // Register User
    const registerTx = await peerReviewContract.connect(user21).registerUser(["Physics", "Maths"]);
    const registerReceipt = await registerTx.wait();
    console.log("Gas used for registerUser:", registerReceipt.gasUsed.toString());

    // Create Conference
    const createConferenceTx = await peerReviewContract
      .connect(owner)
      .createConference("Blockchain Conference", "New York", ["Blockchain", "DeFi"]);
    const createConferenceReceipt = await createConferenceTx.wait();
    console.log("Gas used for createConference:", createConferenceReceipt.gasUsed.toString());

    // Submit Paper
    const submitPaperTx = await peerReviewContract
      .connect(author)
      .submitPaper(2, "QmAnotherPaperHash", "example", ["Blockchain", "DeFi"]);
    const submitPaperReceipt = await submitPaperTx.wait();
    console.log("Gas used for submitPaper:", submitPaperReceipt.gasUsed.toString());

    // Submit Review
    const submitReviewTx = await peerReviewContract
      .connect(reviewer)
      .submitReview(1, 1, 4, "QmReviewHash");
    const submitReviewReceipt = await submitReviewTx.wait();
    console.log("Gas used for submitReview:", submitReviewReceipt.gasUsed.toString());

    // Assign Role
    const assignRoleTx = await peerReviewContract.connect(owner).assignRole(1, user1.address, 2); // Reviewer
    const assignRoleReceipt = await assignRoleTx.wait();
    console.log("Gas used for assignRole:", assignRoleReceipt.gasUsed.toString());

    // Record Interaction
    const recordInteractionTx = await peerReviewContract
      .connect(author)
      .recordInteraction(user1.address, true);
    const recordInteractionReceipt = await recordInteractionTx.wait();
    console.log("Gas used for recordInteraction:", recordInteractionReceipt.gasUsed.toString());

    // Record Interaction loop, for each user 1 through 10, record interaction with 2 different users
    const users = [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13, user14, user15, user16, user17, user18, user19, user20];

    let totalGasUsed = BigInt(0);
    for (let i = 0; i < 20; i++) {
      const user = users[i];
      //const userTags = ["AI", "Blockchain"];
      //await peerReviewContract.connect(user).registerUser(userTags);
      const userData = await peerReviewContract.users(user.address);
      const activeTime = userData.activeTime;
      console.log(`Active Time for user ${user.address}: ${activeTime.toString()}`);

      const interactions = 4; // Record 2 interactions for each user
      let gasUsedPerInteraction = BigInt(0);
      //if (i % 2 === 0) {
      for (let j = 0; j < interactions; j++) {
        const targetUser = users[(i + j) % 20];
        const recordInteractionTx = await peerReviewContract.connect(user).recordInteraction(targetUser.address, true);
        const recordInteractionReceipt = await recordInteractionTx.wait();
        gasUsedPerInteraction += recordInteractionReceipt.gasUsed;
      }
    //}
      totalGasUsed += gasUsedPerInteraction;
    }


    // Update Reputations 
    //for (let i = 0; i < users.length; i++) {
    //  const updateReputationTx = await peerReviewContract.connect(owner).updateReputation(users[i].address);
    //  const updateReputationReceipt = await updateReputationTx.wait();
    //  console.log(`Gas used for updateReputation for user ${users[i].address}:`, updateReputationReceipt.gasUsed.toString());
    //}

    // Update Reputations
    const updateReputationTx = await peerReviewContract.connect(owner).updateReputation();
    const updateReputationReceipt = await updateReputationTx.wait();
    
    console.log(`Total gas used for updateReputation (all users):`, updateReputationReceipt.gasUsed.toString());

    
    // Clear Interactions
    const clearInteractionsTx = await peerReviewContract.connect(owner).clearInteractions();
    const clearInteractionsReceipt = await clearInteractionsTx.wait();
    console.log("Gas used for clearInteractions:", clearInteractionsReceipt.gasUsed.toString());


    // Perform Upkeep
    const performUpkeepTx = await peerReviewContract.connect(owner).performUpkeep("0x");
    const performUpkeepReceipt = await performUpkeepTx.wait();
    console.log("Gas used for performUpkeep:", performUpkeepReceipt.gasUsed.toString());

  

    //const performUpkeepTx2 = await peerReviewContract.connect(owner).performUpkeep("0x");
    //const performUpkeepReceipt2 = await performUpkeepTx2.wait();
    //console.log("Gas used for performUpkeep:", performUpkeepReceipt2.gasUsed.toString());




    // Update Reputation
    //const updateReputationTx = await peerReviewContract.connect(owner).updateReputation(author.address);
    //const updateReputationReceipt = await updateReputationTx.wait();
    //console.log("Gas used for updateReputation:", updateReputationReceipt.gasUsed.toString());

    // Increment Active Time
    const incrementActiveTimeTx = await peerReviewContract.connect(owner).incrementActiveTime(author.address);
    const incrementActiveTimeReceipt = await incrementActiveTimeTx.wait();
    console.log("Gas used for incrementActiveTime:", incrementActiveTimeReceipt.gasUsed.toString());

    // Assign Reviewers
    const assignReviewersTx = await peerReviewContract.connect(owner).assignReviewers(1, 1);
    const assignReviewersReceipt = await assignReviewersTx.wait();
    console.log("Gas used for assignReviewers:", assignReviewersReceipt.gasUsed.toString());

    // Reset Active Time
    const resetActiveTimeTx = await peerReviewContract.connect(owner).resetActiveTime();
    const resetActiveTimeReceipt = await resetActiveTimeTx.wait();
    console.log("Gas used for resetActiveTime:", resetActiveTimeReceipt.gasUsed.toString());

    // Request Honesty Evaluation

    //await peerReviewContract.setSubscriptionId(4103);

    const jsSourceCode = `
        const review = args[0];
        return Functions.encodeString(review === "Honest" ? "true" : "false");
    `;
    const updateSourceCodeTx = await peerReviewContract.connect(owner).updateSourceCode(jsSourceCode);
    const updateSourceCodeReceipt = await updateSourceCodeTx.wait();
    console.log("Gas used for updateSourceCode:", updateSourceCodeReceipt.gasUsed.toString());

   const longerJsSourceCode = `

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

    const updateSourceCodeTx2 = await peerReviewContract.connect(owner).updateSourceCode(longerJsSourceCode);
    const updateSourceCodeReceipt2 = await updateSourceCodeTx2.wait();
    console.log("Gas used for updateSourceCode (longer):", updateSourceCodeReceipt2.gasUsed.toString());


 const longestJsSourceCode = `// Import ethers.js v6.10.0
const { ethers } = await import("npm:ethers@6.10.0");

// Initialize ABI coder
const abiCoder = ethers.AbiCoder.defaultAbiCoder();

/**
 * Evaluates the honesty of a review based on predefined criteria.
 * @param {string} reviewText - The text of the review to evaluate.
 * @returns {object} - An object indicating if the review is honest and the reason code.
 */
function evaluateReviewHonesty(reviewText) {
    // Predefined bad faith phrases
    const badFaithPhrases = [
        "this is useless",
        "waste of time",
        "not worth it",
        "don't care",
        "totally wrong",
    ];

    // Patterns indicating inattentiveness
    const inattentivePatterns = [
        { pattern: /\b(very){3,}\b/i, description: "Excessive repetition" },
        { pattern: /^[a-z\s]{1,10}$/i, description: "Too short" },
        { pattern: /\b(dummy|test|blah)\b/i, description: "Filler words" },
    ];

    // Check for bad faith content
    for (const phrase of badFaithPhrases) {
        if (reviewText.toLowerCase().includes(phrase)) {
            return { isHonest: false, reason: 1, message: "Detected bad faith content." };
        }
    }

    // Detect inattentiveness
    for (const { pattern, description } of inattentivePatterns) {
        if (pattern.test(reviewText)) {
            return { isHonest: false, reason: 2 };
        }
    }

    // Check minimum effort (e.g., word count)
    const wordCount = reviewText.split(/\s+/).length;
    if (wordCount < 5) {
        return { isHonest: false, reason: 3, message: "Review text is too short to evaluate honestly." };
    }

    // Additional quality checks (optional)
    const forbiddenWords = ["plagiarism", "irrelevant"];
    for (const word of forbiddenWords) {
        if (reviewText.toLowerCase().includes(word)) {
            return { isHonest: false, reason: 4, message: "Contains forbidden words." };
        }
    }

    // If all checks pass, the review is honest
    return { isHonest: true, reason: 0, message: "Review passed all honesty checks." };
}

// Extract arguments from the input (e.g., Chainlink Functions call)
const [reviewId, reviewText] = args;

// Validate arguments
if (!reviewId || !reviewText) {
    throw new Error("Invalid arguments: reviewId and reviewText are required.");
}

// Evaluate the honesty of the review
const evaluation = evaluateReviewHonesty(reviewText);

// Log the evaluation result for debugging purposes
console.log("Evaluation Result:", evaluation);

// Prepare the result object
const result = {
    reviewId: parseInt(reviewId, 10), // Ensure reviewId is a number
    isHonest: evaluation.isHonest,
    reason: evaluation.reason,
    message: evaluation.message,
};

// Encode the result into a Uint8Array using ABI encoding
const encodedResult = abiCoder.encode(
    ["uint256", "bool", "uint256", "string"],
    [result.reviewId, result.isHonest, result.reason, result.message]
);

// Return the encoded result
return ethers.getBytes(encodedResult);`;

    const updateSourceCodeTx3 = await peerReviewContract.connect(owner).updateSourceCode(longestJsSourceCode);
    const updateSourceCodeReceipt3 = await updateSourceCodeTx3.wait();
    console.log("Gas used for updateSourceCode (longest):", updateSourceCodeReceipt3.gasUsed.toString());
    

    // Fulfill Request


    // Evaluate Paper
    //const evaluatePaperTx = await peerReviewContract.connect(owner).evaluatePaper(1,1);
    //const evaluatePaperReceipt = await evaluatePaperTx.wait();
    //console.log("Gas used for evaluatePaper:", evaluatePaperReceipt.gasUsed.toString());
    // GasUsage2.test.js içinde yazıldı

  });
});
