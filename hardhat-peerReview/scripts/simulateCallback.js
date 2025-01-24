const { ethers } = require("hardhat");

async function simulateCallback(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    try {
        // Replace with a valid requestId and response data
        const requestId = "0xa98fa2cc3bdfe2ea44c04f71e242faab8dfa6d160a52a9d40239005e5be0e891";
        const response = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["Honest"]);
        const error = "0x"; // Empty error for simulation

        // Simulate the callback
        const tx = await contract.fulfillRequest(requestId, response, error);
        console.log("Callback executed successfully:", tx);
    } catch (error) {
        console.error("Callback failed:", error.message);

        if (error.error) {
            console.error("Error Details:", error.error);
        }
        if (error.data) {
            console.error("Error Data:", error.data);
        }
    }
}

simulateCallback("0xf7a170b3007EA163B90EF06F4f0fF63208a2e2c5").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
