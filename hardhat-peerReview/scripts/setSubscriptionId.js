const { ethers } = require("hardhat");

async function setSubscriptionId(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    const subscriptionId = 4103; // Replace with your actual subscription ID

    const tx = await contract.setSubscriptionId(subscriptionId);
    await tx.wait();

    console.log(`Subscription ID ${subscriptionId} set successfully!`);
}

setSubscriptionId("0x3d0D2F202Fd195aB1De6553a64882b993Dd6FF44").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
