const { ethers } = require("hardhat");

async function requestHonestyEvaluation(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    const reviewId = 9; // Example review ID
    const reviewText = "This is a review text with some placerholder words that should return true"; // Example review
    try {
        // Send the transaction without explicitly setting gas limit
        const tx = await contract.requestHonestyEvaluation(reviewId, reviewText);

        // Log the transaction hash
        console.log(`Transaction Hash: ${tx.hash}`);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log(receipt.gasUsed.toString(), "gas used");
        //console.log(receipt.logs);
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`Honesty evaluation requested for review ID: ${reviewId}`);
    } catch (error) {
        // Handle errors
        console.error("Transaction failed:");
        console.error(error.message);

        // Log revert reason if available
        if (error.error && error.error.message) {
            console.error("Revert Reason:", error.error.message);
        }
    }
}

requestHonestyEvaluation("0x3d0D2F202Fd195aB1De6553a64882b993Dd6FF44").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
