const { ethers } = require("hardhat");

async function getSourceCode(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    try {
        const jsSourceCode = await contract.sourceCode();
        console.log("JavaScript Source Code:");
        console.log(jsSourceCode);
    } catch (error) {
        console.error("Failed to retrieve JavaScript Source Code:", error.message);
    }
}

getSourceCode("0x89bf329bc1e4c731230cb2379927aac350d18cd0").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
