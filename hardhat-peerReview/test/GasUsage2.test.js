const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PeerReview Contract - submitReview", function () {
  let peerReviewContract;
  let owner, author, reviewer, reviewer2, user1;

  beforeEach(async function () {
    const PeerReview = await ethers.getContractFactory("PeerReview");
    peerReviewContract = await PeerReview.deploy(); // 1 week interval
    await peerReviewContract.waitForDeployment();

    [owner, author, reviewer, reviewer2, user1] = await ethers.getSigners();

    // Register users
    await peerReviewContract.connect(author).registerUser(["AI", "Blockchain"]);
    await peerReviewContract.connect(reviewer).registerUser(["AI", "Blockchain", "Ethereum"]);
    await peerReviewContract.connect(user1).registerUser(["Physics", "Chemistry"]);
    await peerReviewContract.connect(reviewer2).registerUser(["AI", "ML" , "Blockchain"]);

    // Create a conference
    await peerReviewContract.connect(owner).createConference("AI Conference", "London", ["AI", "ML"]);

    // Submit a paper
    await peerReviewContract
      .connect(author)
      .submitPaper(1, "QmExamplePaperHash", "example", ["AI","Blockchain", "Ethereum"]);

    // Assign reviewer role to the reviewers
    await peerReviewContract.connect(owner).assignReviewers(1,1);
    console.log("Reviewers:", await peerReviewContract.getPaperReviewers(1,1));
    await peerReviewContract.connect(owner).assignRole(1, reviewer.address, 2); // 2 = Role.Reviewer




  });

  it("should allow a reviewer to submit a review and measure gas usage", async function () {
    const paperId = 1;
    const conferenceId = 1;
    const rating = 4;
    const reviewIpfsHash = "QmExampleReviewHash";

    const submitReviewTx = await peerReviewContract
      .connect(reviewer)
      .submitReview(conferenceId, paperId, rating, reviewIpfsHash);
    const submitReviewReceipt = await submitReviewTx.wait();

    console.log("Gas used for submitReview:", submitReviewReceipt.gasUsed.toString());

    const paperReviewers = await peerReviewContract.getPaperReviewers(conferenceId, paperId);
    expect(paperReviewers).to.include(reviewer.address);
  });

  it("should fail if the reviewer is not assigned", async function () {
    const signers = await ethers.getSigners();
    const invalidReviewer = signers[5]; // Use the fifth signer
    await peerReviewContract.connect(invalidReviewer).registerUser(["Physics"]);

    await expect(
      peerReviewContract
        .connect(invalidReviewer)
        .submitReview(1, 1, 4, "QmInvalidHash")
    ).to.be.revertedWith("Only Reviewers can submit reviews");
  });

  it("should fail if the rating is out of bounds", async function () {
    await expect(
      peerReviewContract
        .connect(reviewer)
        .submitReview(1, 1, 6, "QmInvalidHash") // Rating > 5
    ).to.be.revertedWith("Rating must be between 1 and 5");

    await expect(
      peerReviewContract
        .connect(reviewer)
        .submitReview(1, 1, 0, "QmInvalidHash") // Rating < 1
    ).to.be.revertedWith("Rating must be between 1 and 5");
  });

  it("should fail if the paper does not exist", async function () {
    await expect(
      peerReviewContract
        .connect(reviewer)
        .submitReview(1, 999, 4, "QmInvalidHash") // Non-existent paperId
    ).to.be.revertedWith("Paper does not exist");
  });

  it("should fail if the IPFS hash is empty", async function () {
    await expect(
      peerReviewContract
        .connect(reviewer)
        .submitReview(1, 1, 4, "") // Empty IPFS hash
    ).to.be.revertedWith("Review IPFS hash cannot be empty");
  });

  it("should evaluate the paper" , async function () {
    const paperId = 1;
    const conferenceId = 1;
    const rating = 5;
    const rating2 = 3;
    const reviewIpfsHash = "QmExampleReviewHash";

    const submitReviewTx = await peerReviewContract
      .connect(reviewer)
      .submitReview(conferenceId, paperId, rating, reviewIpfsHash);

    const submitReviewTx2 = await peerReviewContract
      .connect(reviewer2)
      .submitReview(conferenceId, paperId, rating2, reviewIpfsHash);

    const evaluatePaperTx = await peerReviewContract.evaluatePaper(conferenceId, paperId);
    const evaluatePaperReceipt = await evaluatePaperTx.wait();
    console.log("Gas used for evaluatePaper:", evaluatePaperReceipt.gasUsed.toString());

    const paperDetails = await peerReviewContract.getPaperDetails(conferenceId, paperId);
    console.log("Paper Details:", paperDetails);
    const paperStatus = await peerReviewContract.getPaperStatus(conferenceId, paperId);
    console.log("Paper Status:", paperStatus);
    expect(paperStatus).to.equal(1); // Paper status should be 1 (Accepted)
    const paperScores = await peerReviewContract.getPaperScores(conferenceId, paperId);
    console.log("Paper Scores:", paperScores);

      // Fetch intermediary values
      const [average, weightedSum, totalWeight, scores, reputations, tagSimilarities] = await peerReviewContract.getEvaluatePaperIntermediaryValues(1, 1);


      console.log("Scores:", scores.map(s => s.toString()));
      console.log("Reputations:", reputations.map(r => r.toString()));
      console.log("Tag Similarities:", tagSimilarities.map(t => t.toString()));
      console.log("Total Weight:", totalWeight.toString());
      console.log("Weighted Sum:", weightedSum.toString());
      console.log("Average:", average.toString());
  });


    
});
