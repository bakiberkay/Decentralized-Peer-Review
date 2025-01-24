const hre = require("hardhat");
const { int } = require("hardhat/internal/core/params/argumentTypes");

// Utility function to shuffle users
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Define user behavior patterns with specific user cases
const tags2 = [
    { name: "Natural Sciences", honestyChance: 0.95, possibleInteractions: [1, 1, 2, 3]},
    { name: "Engineering", honestyChance: 0.95, possibleInteractions: [0, 1, 2, 3]},
    { name: "Health Sciences", honestyChance: 0.95, possibleInteractions: [1, 2, 2, 3]},
    { name: "Agriculture", honestyChance: 0.95, possibleInteractions: [0, 1, 2]},
    { name: "Humanities", honestyChance: 0.95, possibleInteractions: [0, 0, 1, 2]},
    { name: "Social Sciences", honestyChance: 0.95, possibleInteractions: [0, 0, 0, 1, 2]},
    { name: "Rarely Honest", honestyChance: 1.0, possibleInteractions: [0, 0, 0, 1]},
    { name: "Rarely Honest (0.9)", honestyChance: 0.9, possibleInteractions: [0, 0, 0, 1] },
    {
      name: "Dynamic Honesty (0.8 → 0.95)",
      honestyChance: null,
      possibleInteractions: [1, 2, 3, 4],
     
      dynamicHonesty: (interval, totalIntervals) => (interval < totalIntervals / 2 ? 0.8 : 0.95),
    },
    {
      name: "Dynamic Honesty (0.95 → 0.8)",
      honestyChance: null,
      possibleInteractions: [1, 2, 3, 4],
    
      dynamicHonesty: (interval, totalIntervals) => (interval < totalIntervals / 2 ? 0.95 : 0.8),
    },
    {
      name: "Honesty Switch (0.5 → 1)",
      honestyChance: null,
      possibleInteractions: [2, 3, 4],

      dynamicHonesty: (interval, totalIntervals) => (interval < totalIntervals / 4 ? 0.5 : 1.0),
    },
    {
      name: "Early Dishonesty",
      honestyChance: 1.0,
      possibleInteractions: [1],
 
      dishonestIntervals: [0,1],
    },
    {
      name: "Mid Dishonesty",
      honestyChance: 1.0,
      possibleInteractions: [1],
 
      dishonestIntervals: [29, 30],
    },
    {
      name: "Late Dishonesty",
      honestyChance: 1.0,
      possibleInteractions: [1],
   
      dishonestIntervals: [57,58],
    },
  ];
  


function getRandomIntegerFromArray(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}



// Main function to populate interactions for a single interval
async function populateInteractions() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed contract address
    const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);
  
    const accounts = await hre.ethers.getSigners();
    const shuffledAccounts = shuffleArray(accounts); // Shuffle accounts
  
    const interactionSummary = [];
    let totalGasUsed = BigInt(0);
  
    // Get the current interval from the contract
    const intervalIndex = await contract.getCurrentInterval();
    console.log(`Current interval index: ${intervalIndex}`);
  
    for (let i = 0; i < 50; i++) {
      const user = shuffledAccounts[i];
      const tagsResult = await contract.getUserTags(user.address);
      const mainTag = tagsResult[0] || "Engineering"; // Default to "Engineering" if tag not found
      const tag = tags2.find((t) => t.name === mainTag) || tags2[0]; // Default to first tag if no match
  
      // Handle dynamic honesty for special cases
      let honestyChance = tag.honestyChance;
      if (tag.dynamicHonesty) {
        const totalIntervals = 60; // Define the total intervals externally if needed
        honestyChance = tag.dynamicHonesty(intervalIndex, totalIntervals);
      }
  
      // Determine if dishonesty should be applied for this interval (special cases)
      const isDishonest = tag.dishonestIntervals?.map(BigInt).includes(intervalIndex) || false;
      if (isDishonest) {
        honestyChance = 0;
       //console.log("SHOULD BE DISHONEST");
      } else {
       // console.log("something went wrong");
      }
  
      // Determine the number of interactions for this interval
      const interactions = getRandomIntegerFromArray(tag.possibleInteractions);
  
      let gasUsedPerInteraction = BigInt(0);
      for (let j = 0; j < interactions; j++) {
        const targetUser = getRandomTargetUser(accounts);
        const tx = await recordInteraction(
          contract,
          user,
          targetUser,
          isDishonest ? 0 : honestyChance // Apply dishonesty logic
        );
        const gasReceipt = await tx.wait();
        gasUsedPerInteraction += gasReceipt.gasUsed;
      }
  
      totalGasUsed += gasUsedPerInteraction;
  
      interactionSummary.push({
        User: i + 1,
        Address: user.address,
        MainTag: mainTag,
        Interactions: interactions,
      });
    }
  
    console.log(`Total gas used for all interactions: ${totalGasUsed.toString()}`);
    console.log(JSON.stringify(interactionSummary)); // Output as JSON
  }
  

// Helper functions
function getRandomTargetUser(accounts) {
  const randomIndex = Math.floor(Math.random() * accounts.length);
  return accounts[randomIndex].address;
}

async function recordInteraction(contract, user, targetUser, honestyChance) {
  const honesty = Math.random() < honestyChance;
  return await contract.connect(user).recordInteraction(targetUser, honesty);
}

// Run the script
populateInteractions()
  .then(() => console.log("Interaction population complete!"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });