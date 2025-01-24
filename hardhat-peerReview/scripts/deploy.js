const hre = require("hardhat");

async function main() {

  //const initialInterval = 604800; // 1 week BUNU TEST EDECEĞİZ  
  const PeerReview = await hre.ethers.getContractFactory("PeerReview");
  const peerReview = await PeerReview.deploy();


  await peerReview.waitForDeployment();

  const address = await peerReview.getAddress();

  console.log("Contract deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  