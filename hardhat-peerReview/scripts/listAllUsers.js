const hre = require("hardhat");

async function listAllUsers() {
  const contractAddress = "0x89bf329bc1e4c731230cb2379927aac350d18cd0"; // Replace with deployed contract address
  const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);

  // Retrieve the list of registered users
  const registeredUsers = await contract.getRegisteredUsers();

  console.log("Listing all registered users' data:\n");

  for (let i = 0; i < registeredUsers.length; i++) {
    const userAddress = registeredUsers[i];

    // Retrieve user data from the contract
    const userData = await contract.users(userAddress);

    console.log(`User ${i + 1}:`);
    console.log(`  Address: ${userAddress}`);
    console.log(`  Reputation Score: ${userData.reputationScore.toString()}`);
    console.log(`  Active Time: ${userData.activeTime.toString()}`);
    //console.log(`  Tags: ${userData.tags.join(", ")}`);
    console.log(`  Active in Current Interval: ${userData.activeInCurrentInterval}\n`);
  }
}

// Run the script
listAllUsers()
  .then(() => console.log("User listing complete!"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
