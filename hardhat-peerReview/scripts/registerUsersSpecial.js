const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed contract address
  const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);

  // Tags and their distribution with interaction ranges from testInteractionsSpecial.js
  const tags2 = [
    { name: "Natural Sciences", interactionRange: [1, 2, 3, 4], count: 15 },
    { name: "Engineering", interactionRange: [0, 1, 2, 3, 3, 4], count: 12 },
    { name: "Health Sciences", interactionRange: [0, 1, 2, 3, 4], count: 7 },
    { name: "Agriculture", interactionRange: [0, 1, 2, 3], count: 2 },
    { name: "Humanities", interactionRange: [0, 0, 1, 2, 3], count: 3 },
    { name: "Social Sciences", interactionRange: [0, 0, 0, 1, 2, 3], count: 3 },
    { name: "Rarely Honest", interactionRange: [0, 1], count: 1 }, // Case 1
    { name: "Rarely Honest (0.9)", interactionRange: [0, 1], count: 1 }, // Case 2
    {
      name: "Dynamic Honesty (0.8 → 0.95)",
      interactionRange: [2, 5],
      count: 1,
    }, // Case 3
    {
      name: "Dynamic Honesty (0.95 → 0.8)",
      interactionRange: [2, 5],
      count: 1,
    }, // Case 4
    {
      name: "Honesty Switch (0.5 → 1)",
      interactionRange: [2, 4],
      count: 1,
    }, // Case 5
    {
      name: "Early Dishonesty",
      interactionRange: [2, 4],
      count: 1,
    }, // Case 6
    {
      name: "Mid Dishonesty",
      interactionRange: [2, 4],
      count: 1,
    }, // Case 7
    {
      name: "Late Dishonesty",
      interactionRange: [2, 4],
      count: 1,
    }, // Case 8
  ];

  const accounts = await hre.ethers.getSigners();

  let userIndex = 0;

  // Register users based on tags2 distribution
  for (const tag of tags2) {
    for (let i = 0; i < tag.count; i++) {
      const user = accounts[userIndex];
      const userSigner = contract.connect(user);
      const tx = await userSigner.registerUser([tag.name]);
      await tx.wait();
      console.log(
        `Registered user ${userIndex + 1}: ${user.address} with tag "${tag.name}"`
      );
      userIndex++;
    }
  }

  console.log("All users registered successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
