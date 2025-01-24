const { ethers } = require("hardhat");

async function getLastReq(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    try {
        const s_lastRequestId = await contract.s_lastRequestId();
        console.log(`Last Request ID: ${s_lastRequestId}`);
    } catch (error) {
        console.error("Failed to retrieve req id:", error.message);
    }
}

getLastReq("0xf7a170b3007EA163B90EF06F4f0fF63208a2e2c5").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
