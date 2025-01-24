const { ethers } = require("hardhat");

async function debugFunctionCall(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    try {
        // Simulate the function call using callStatic
        const result = await contract.requestHonestyEvaluation(1, "This is a test review.");
        console.log("Function call succeeded:", result);
    } catch (error) {
        console.error("Revert Reason:", error.message);

        // Log additional error details if available
        if (error.error) {
            console.error("Error Details:", error.error);
        }
        if (error.data) {
            console.error("Error Data:", error.data);
        }
    }
}

debugFunctionCall("0x615F0652BC3d3bD8A06374F63EB2DF4790Ad1893").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
