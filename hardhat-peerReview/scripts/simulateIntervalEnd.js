const hre = require("hardhat");
const XLSX = require("xlsx"); // Import the xlsx package
const path = require("path");



async function simulateIntervalEnd(intervalName) {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed contract address
  //const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // PARALLEL TEST CONTRACT

  const contract = await hre.ethers.getContractAt("PeerReview", contractAddress);

  const accounts = await hre.ethers.getSigners();
  let totalGasUsed = BigInt(0);
  const intervalResults = []; // Store results for this interval
  let totalInteractions = 0;


  for (let i = 0; i < 50; i++) {
    const user = accounts[i];
    // Retrieve punishment factor
    const P_t_i = await contract.calculatePunishmentFactor(user.address);

    // debug
    const interactions = await contract.getUserInteractions(user.address);

    //console.log(`\nUser ${i + 1} (${user.address}) Interactions:`);

    // Loop through each interaction entry for the user
    for (let j = 0; j < interactions.length; j++) {
      const interaction = interactions[j];
      totalInteractions++;
      //console.log(`  Interaction ${j + 1}:`);
      //console.log(`    Target User: ${interaction.user}`);
      //console.log(`    Honesty: ${interaction.honesty}`);
    }
    
    
    // Retrieve gain summand and intermediate values (assuming contract exposes functions for detailed calculation)
    const userData = await contract.users(user.address);
    const initialReputation = userData.reputationScore;
    //console.log(`Initial Reputation: ${initialReputation.toString()}`);
    const activeTime = userData.activeTime;

    // Calculate scaled reputation and f(x, active_time) values
    const scaledX = (initialReputation * P_t_i) / BigInt(1000000); // Assuming SCALING_FACTOR is 1000000
    const gainSummand = await contract.calculateGainSummand(user.address, P_t_i);
    //console.log(`Gain Summand: ${gainSummand.toString()}`);
    const fValue = await contract.f(scaledX, activeTime); // Assuming f() is public for testing purposes

    // Update reputation
    //const updateTx = await contract.connect(user).updateReputation(user.address);
    //await updateTx.wait();
    //const newReputation = (await contract.users(user.address)).reputationScore;
    //console.log(`New Reputation: ${newReputation.toString()}`);
    
  

    // Log all intermediate and final values
    //GAS USED ARIZALI ONU DÜZELTECEĞİZ AŞŞAĞIDA HESAPLANIYOR İLK
    //console.log(`User ${i + 1} (${user.address}) - Gas Used: ${gasUsed.toString()}`);
    //console.log(`    Punishment Factor (P_t_i): ${P_t_i.toString()}`);
    //console.log(`    Initial Reputation: ${initialReputation.toString()}`);
    //console.log(`    Scaled Reputation (scaledX): ${scaledX.toString()}`);
    //console.log(`    Active Time: ${activeTime.toString()}`);
    //console.log(`    Gain Summand: ${gainSummand.toString()}`);
    //console.log(`    f(scaledX, activeTime): ${fValue.toString()}`);
    //console.log(`    New Reputation: ${newReputation.toString()}`);

    // Perform upkeep to clear interactions
   
    //await contract.resetActiveTime();



  //totalGasUsed += BigInt(receipt.gasUsed);


    // Store interval data for this user
    const newReputation = (await contract.users(user.address)).reputationScore;

    intervalResults.push({
      Address: user.address,
      InitialReputation: initialReputation.toString(),
      ActiveTime: activeTime.toString(),
      GainSummand: gainSummand.toString(),
      fValue: fValue.toString(),
      NewReputation: newReputation.toString(),
      PunishmentFactor: P_t_i.toString()
    });

  }

  const tx = await contract.performUpkeep("0x");
  const receipt = await tx.wait();
  totalGasUsed += BigInt(receipt.gasUsed);


  


  //console.log("Total Interactions: ", totalInteractions);
  //console.log("Gas used per interaction: ", Number(totalGasUsed)/totalInteractions);
  //console.log(`\nTotal Gas Used for ${intervalName} clearing: ${totalGasUsed.toString()}`);
  //console.log(`\n--- Interval End Simulation Complete for ${intervalName} ---`);

   // Save interval data to an Excel file
   const workbook = XLSX.utils.book_new();
   const worksheet = XLSX.utils.json_to_sheet(intervalResults);
   XLSX.utils.book_append_sheet(workbook, worksheet, intervalName);

   const filePath = path.resolve(__dirname, `interval_${intervalName}_results.xlsx`);
   XLSX.writeFile(workbook, filePath);
  //console.log(`Data written to Excel file at: ${filePath}`);


  console.log(JSON.stringify(intervalResults)); // This will be parsed by automatedTest.js
  return intervalResults; // Return the data for this interval to be used by automatedTest

}

//TEK BAŞINA ÇALIŞACAKSA COMMENTTEN ÇIKAR ALTTAKİ KISMI!
simulateIntervalEnd("monthly")
//  .then(() => console.log("Interval end simulation completed!"))
//  .catch((error) => {
//    console.error(error);
//    process.exit(1);
//  });

module.exports = simulateIntervalEnd
