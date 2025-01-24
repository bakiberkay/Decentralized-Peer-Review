const hre = require("hardhat");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }


async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed contract address
  const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);

  // Define interval lengths to test (in days)
  const intervals = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  };

  console.log("Starting interval gas cost testing...");

  for (const [intervalName, days] of Object.entries(intervals)) {
    console.log(`\nTesting ${intervalName.toUpperCase()} interval (${days} days):`);

    // Simulate interactions over the interval
    console.log("Simulating interactions...");
    await simulateInteractions(contract, days);

    // Clear interactions and measure gas
    const clearTx = await contract.clearInteractions();
    const clearReceipt = await clearTx.wait();
    console.log(`Gas used for clearInteractions: ${clearReceipt.gasUsed.toString()}`);

    
    // Update reputation for all users and measure gas
    console.log("Updating reputations...");
    const users = await contract.getRegisteredUsers();
    //let totalGasUsed = BigInt(0); // Initialize as BigInt
    let totalGasUsed = BigInt(0);

    for (const user of users) {
      const updateReputationTx = await contract.updateReputation(user);
      const updateReputationReceipt = await updateReputationTx.wait();
      totalGasUsed += updateReputationReceipt.gasUsed; // Add gas used as BigInt
    }
    console.log(`Total gas used for updateReputation (all users): ${totalGasUsed.toString()}`);
  }
}

async function simulateInteractions(contract, days) {
  const users = await contract.getRegisteredUsers();

  // Simulate interactions for all users
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const honesty = Math.random() > 0.1; // 90% chance of honest interactions
      await contract.recordInteraction(users[j], honesty);
    }
  }

  console.log(`Simulated interactions for ${users.length} users over ${days} days.`);
}

main()
  .then(() => console.log("Interval gas cost testing completed."))
  .catch((error) => {
    console.error("Error during interval gas cost testing:", error);
    process.exit(1);
  });
