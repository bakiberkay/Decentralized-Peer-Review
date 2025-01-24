const { ethers } = require("hardhat");

async function getSubscriptionId(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    try {
        const subscriptionId = await contract.subscriptionId();
        console.log(`Subscription ID: ${subscriptionId}`);
    } catch (error) {
        console.error("Failed to retrieve Subscription ID:", error.message);
    }
}

getSubscriptionId("0xAbb7771022d4960A7364dc117da9C09c895D6599").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
