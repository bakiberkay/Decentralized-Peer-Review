const { ethers } = require("hardhat");

async function main() {

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
  // Get the contract factory and deploy it
  const PeerReview = await ethers.getContractFactory("PeerReview");
  const peerReview = await PeerReview.deploy(60 * 60 * 24 * 7); // Weekly interval
  await peerReview.waitForDeployment();

  console.log("PeerReview deployed to:", peerReview.target);

  // Setup data for testing
  const [chair, author, reviewer1, reviewer2, reviewer3] = await ethers.getSigners();

  // Chair registers
  await peerReview.connect(chair).registerUser(["AI", "Blockchain"]);

  // Chair creates a conference
  await (await peerReview.connect(chair).createConference("AI Conference", "Virtual", ["AI", "Blockchain"])).wait();
  console.log("Conference created by chair");

  // Author registers and submits a paper
  await (await peerReview.connect(author).registerUser(["AI"])).wait();
  console.log("Author registered");
  
  await peerReview.connect(author).submitPaper(1, "ipfsHash1", ["AI", "Blockchain"]);
  console.log("Paper submitted");

  // Reviewers register
  await peerReview.connect(reviewer1).registerUser(["AI", "Machine Learning"]);
  console.log(reviewer1.address);
  await peerReview.connect(reviewer2).registerUser(["Blockchain", "AI"]);
console.log(reviewer2.address);
  await peerReview.connect(reviewer3).registerUser(["AI"]);
  console.log(reviewer3.address);
  console.log("Reviewers registered");

  // Assign reviewers
  await peerReview.connect(chair).assignReviewers(1, 1);
  console.log("Reviewers assigned");

  const reviewers = await peerReview.getPaperReviewers(1, 1);
  console.log("Paper reviewers:", reviewers);

  // Submit reviews
  //await peerReview.connect(reviewer1).submitReview(1, 1, 5, "ipfsReview1");
  //console.log("Review submitted by reviewer1");
  await peerReview.connect(reviewer2).submitReview(1, 1, 4, "ipfsReview2");
  console.log("Review submitted by reviewer2");
  //await peerReview.connect(reviewer3).submitReview(1, 1, 2, "ipfsReview3");
  //console.log("Review submitted by reviewer3");

  await (await peerReview.connect(chair).evaluatePaper(1, 1)).wait();

  // Fetch the status of the paper
  const paperStatus = await peerReview.getPaperStatus(1, 1);

  // Print the status
  console.log("Paper Status:", parsePaperStatus(paperStatus));
}

// Helper function to parse PaperStatus enum
function parsePaperStatus(status) {
  switch (status) {
    case 0:
      return "Accepted";
    case 1:
      return "Revision Needed";
    case 2:
      return "Rejected";
    default:
      return "Unknown Status";
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
