const hre = require("hardhat");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function populateInteractions() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed contract address
  //const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // PARALLEL TEST CONTRACT
  const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);

  let totalGasUsed = BigInt(0);


  // Interaction ranges based on academic fields I ADJUSTED RANGES WHILE MAKING ANNUAL COUNT INTO A RANGE OF +/- 6, THESE NEED BETTER FIGURES, AND MAYBE DIFFERENT NUMBER OF INTERACTIONS AND DIFFERENT INTERVAL LENGTHS!
  const interactionRanges = {
    "Life Sciences": { weekly: [1, 2], biweekly: [1,3], monthly: [2, 4], quarterly: [6, 9], annually: [22, 34] },
    "Engineering": { weekly: [0, 2], biweekly: [1,2], monthly: [1, 3],  quarterly: [5, 7], annually: [18, 30] },
    "Physical Sciences": { weekly: [0, 1], biweekly: [0,2], monthly: [2, 3], quarterly: [4, 6], annually: [14, 26] },
    "Social Sciences": { weekly: [0, 1], biweekly: [0,1], monthly: [1, 2], quarterly: [2, 4], annually: [6, 18] },
    "Psychology": { weekly: [0, 1], biweekly: [0,2], monthly: [1, 3], quarterly: [2, 5], annually: [10, 22] },
    "Health Sciences": { weekly: [1, 2], biweekly: [1,3], monthly: [2, 5], quarterly: [6, 9], annually: [24, 36] },
    "Education": { weekly: [0, 1], biweekly: [0,1], monthly: [0, 2], quarterly: [1, 3], annually: [2, 14] },
    "Mathematics & Computer Science": { weekly: [0, 2], biweekly: [0,1], monthly: [1, 2], quarterly: [3, 6], annually: [12, 24] },
    "Humanities": { weekly: [0, 1], biweekly: [0,1], monthly: [0, 2], quarterly: [1, 3], annually: [2, 14] },
    "Agricultural Sciences": { weekly: [0, 1], biweekly: [0,2], monthly: [0, 3], quarterly: [3, 5], annually: [9, 21] }, //bu aslında yok...
  };

  /*const interactionRanges = {
    "Life Sciences": { weekly: [0, 1], biweekly: [0,2], monthly: [2, 4], quarterly: [6, 9], annually: [22, 34] },
    "Engineering": { weekly: [0, 0], biweekly: [0,1], monthly: [1, 3],  quarterly: [5, 7], annually: [18, 30] },
    "Physical Sciences": { weekly: [0, 1], biweekly: [0,1], monthly: [2, 3], quarterly: [4, 6], annually: [14, 26] },
    "Social Sciences": { weekly: [0, 0], biweekly: [0,1], monthly: [1, 2], quarterly: [2, 4], annually: [6, 18] },
    "Psychology": { weekly: [0, 1], biweekly: [0,1], monthly: [1, 3], quarterly: [2, 5], annually: [10, 22] },
    "Health Sciences": { weekly: [0, 1], biweekly: [1,2], monthly: [2, 5], quarterly: [6, 9], annually: [24, 36] },
    "Education": { weekly: [0, 1], biweekly: [0,1], monthly: [0, 2], quarterly: [1, 3], annually: [2, 14] },
    "Mathematics & Computer Science": { weekly: [0, 1], biweekly: [0,1], monthly: [1, 2], quarterly: [3, 6], annually: [12, 24] },
    "Humanities": { weekly: [1, 1], biweekly: [0,1], monthly: [0, 2], quarterly: [1, 3], annually: [2, 14] },
    "Agricultural Sciences": { weekly: [1, 1], biweekly: [0,2], monthly: [0, 3], quarterly: [3, 5], annually: [9, 21] }, //bu aslında yok...
  };*/

  // agri 0-3 , hum 0-2, math 1-2, edu 0-2, health 2-5, psych 1-3, social 1-2, phys 2-3, eng 1-3, life 2-4
  const intervalToTest = "monthly"; // Change to "monthly", "quarterly", or "annually" for specific interval testing
  const accounts = await hre.ethers.getSigners();

  // Shuffle the accounts array to randomize the order of users
  const shuffledAccounts = shuffleArray(accounts);

  const interactionSummary = []; // Array to hold interaction details for each user


  for (let i = 0; i < 50; i++) {
    const user = shuffledAccounts[i];


    // Retrieve the tags for the user from the contract and access the first tag directly
    const tagsResult = await contract.getUserTags(user.address);
    const mainTag = tagsResult[0] || "Engineering"; // Default to "Engineering" if tag not found
    //SIGSIN DIYE
    //console.log(`User ${i + 1} tag:`, mainTag);

    // Assign ranges based on mainTag
    const ranges = interactionRanges[mainTag];

    // Generate interactions based on the intervalToTest variable
    let interactions;
    switch (intervalToTest) {
      case "weekly":
        interactions = getRandomInt(ranges.weekly);
        break;
      case "biweekly":
        interactions = getRandomInt(ranges.biweekly);
        break;  
      case "monthly":
        interactions = getRandomInt(ranges.monthly);
        break;
      case "quarterly":
        interactions = getRandomInt(ranges.quarterly);
        break;
      case "annually":
        interactions = getRandomInt(ranges.annually);
        break;
      default:
        throw new Error("Invalid interval specified");
    }


    // Track if any interaction occurred for this user in this interval
    let interactionOccurred = false;


    // Populate interactions for the selected interval
    let gasUsedPerInteraction = BigInt(0);
    for (let j = 0; j < interactions; j++) {
      const targetUser = getRandomTargetUser(accounts);
      const gass = await recordInteraction(contract, user, targetUser);
      const gasReceipt = await gass.wait();
      interactionOccurred = true;
      gasUsedPerInteraction += gasReceipt.gasUsed;
      //console.log(`User ${i + 1} (${user.address}) interaction ${j + 1} with NO NEED - Gas Used: ${gasReceipt.gasUsed.toString()}`);
      const userData = await contract.users(user.address);
const activeTime = userData.activeTime;
//console.log(`Active Time for user ${user.address}: ${activeTime.toString()}`);
    }
  //  console.log(`User ${i + 1} (${user.address}) total gas used for ${interactions} interactions: ${gasUsedPerInteraction.toString()}`);
    totalGasUsed += gasUsedPerInteraction;

    //if (interactionOccurred) {
    //    await contract.connect(user).incrementActiveTime(user.address); // Increment active time in the contract
    //  }

      // Add to summary
  interactionSummary.push({
    User: i + 1,
    Address: user.address,
    MainTag: mainTag,
    Interactions: interactions,
    InteractionOccurred: interactionOccurred,
  });

  //SIGSIN DIYE
    //console.log(`User ${i + 1} (${user.address}) interactions for ${intervalToTest} interval completed.`);
  }
  console.log(`Total gas used for all interactions: ${totalGasUsed.toString()}`);
  console.log(JSON.stringify(interactionSummary)); // Output as JSON

}



// Utility Functions
function getRandomInt([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomTargetUser(accounts) {
  const randomIndex = Math.floor(Math.random() * accounts.length);
  return accounts[randomIndex].address;
}

async function recordInteraction(contract, user, targetUser) {

  const honesty = Math.random() < 0.9; // CHANCE OF DISHONESTY!

  const tx = await contract.connect(user).recordInteraction(targetUser, honesty); // Assuming honesty = true
  //await tx.wait();
  return tx;
}

//GROUPED HONESTY
//async function recordInteraction(contract, user, targetUser, index) {
//  const isGroupA = index % 2 === 0; // Every second user belongs to the other group
//  const honesty = isGroupA ? Math.random() < 0.95 : Math.random() < 0.85; // Different honesty chances for two groups
//  const tx = await contract.connect(user).recordInteraction(targetUser, honesty);
//  await tx.wait();
//}

// Run the script
populateInteractions()
  .then(() => console.log("Interaction population complete!"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
