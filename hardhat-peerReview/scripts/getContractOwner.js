const { ethers } = require("hardhat");

async function getContractOwner(contractAddress) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    try {
        const owner = await contract.owner();
        console.log(`Contract Owner: ${owner}`);
    } catch (error) {
        console.error("Failed to retrieve contract owner:", error.message);
    }
}

getContractOwner("0x615F0652BC3d3bD8A06374F63EB2DF4790Ad1893").catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
