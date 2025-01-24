const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);

  // Retrieve accounts
  const accounts = await hre.ethers.getSigners();

  // Log each user's tags
  for (let i = 0; i < 50; i++) {
    const userAddress = accounts[i].address;
    const userDetails = await contract.getUserTags(userAddress);
    console.log(`User ${i + 1} details:`, userDetails);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });