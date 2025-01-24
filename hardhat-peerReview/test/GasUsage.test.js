const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PeerReview Contract - Gas Usage", function () {
  let peerReviewContract;
  let owner, user;

  beforeEach(async function () {
    // Deploy the contract
    const PeerReview = await ethers.getContractFactory("PeerReview");
    peerReviewContract = await PeerReview.deploy(); // 1 week interval
    await peerReviewContract.waitForDeployment();

    [owner, user] = await ethers.getSigners();
  });

  it("should measure gas for user registration", async function () {
    // User registration
    const userTags = ["AI", "Blockchain"];
    const registerTx = await peerReviewContract.connect(user).registerUser(userTags);
    const registerReceipt = await registerTx.wait();
    console.log("Gas used for user registration:", registerReceipt.gasUsed.toString());

    // Verify the user is registered
    const registeredUser = await peerReviewContract.users(user.address);
    expect(registeredUser.userAddress).to.equal(user.address);
  });

  it("should measure gas for creating a conference", async function () {
    // Conference creation
    const conferenceName = "Blockchain Conference";
    const conferenceLocation = "New York";
    const conferenceTags = ["Blockchain", "Decentralization"];
    const createConferenceTx = await peerReviewContract
      .connect(owner)
      .createConference(conferenceName, conferenceLocation, conferenceTags);
    const createConferenceReceipt = await createConferenceTx.wait();
    console.log("Gas used for conference creation:", createConferenceReceipt.gasUsed.toString());

    // Verify the conference is created
    const conference = await peerReviewContract.getConferenceDetails(1);
    expect(conference[1]).to.equal(owner.address); // Check chair address
    expect(conference[2]).to.equal(conferenceName); // Check conference name
    expect(conference[3]).to.equal(conferenceLocation); // Check location
  });

  it("should measure gas for user registering and submitting a paper to a conference", async function () {
    // Register the user
    const userTags = ["AI", "Blockchain"];
    await peerReviewContract.connect(user).registerUser(userTags);

    // Create a conference
    const conferenceName = "Blockchain Conference";
    const conferenceLocation = "New York";
    const conferenceTags = ["Blockchain", "Decentralization"];
    await peerReviewContract.connect(owner).createConference(conferenceName, conferenceLocation, conferenceTags);

    // Submit a paper
    const paperIpfsHash = "QmExampleHash";
    const paperTags = ["AI", "Blockchain"];
    const submitPaperTx = await peerReviewContract.connect(user).submitPaper(1, paperIpfsHash, "example", paperTags);
    const submitPaperReceipt = await submitPaperTx.wait();
    console.log("Gas used for paper submission:", submitPaperReceipt.gasUsed.toString());

    // Verify the paper is submitted
    const paperDetails = await peerReviewContract.getPaperDetails(1, 1);
    expect(paperDetails).to.deep.equal(paperTags);
  });

  it("should measure gas for giving review" , async function () {
    const userTags = ["AI", "Blockchain"];
    await peerReviewContract.connect(user).registerUser(userTags);

    const conferenceName = "Blockchain Conference";
    const conferenceLocation = "New York";
    const conferenceTags = ["Blockchain", "Decentralization"];
    await peerReviewContract.connect(owner).createConference(conferenceName, conferenceLocation, conferenceTags);

    // Submit a paper
    const paperIpfsHash = "QmExampleHash";
    const paperTags = ["AI", "Blockchain"];
    const submitPaperTx = await peerReviewContract.connect(user).submitPaper(1, paperIpfsHash, "example", paperTags);
    const submitPaperReceipt = await submitPaperTx.wait();
    console.log("Gas used for paper submission:", submitPaperReceipt.gasUsed.toString());

    // Verify the paper is submitted
    const paperDetails = await peerReviewContract.getPaperDetails(1, 1);
    expect(paperDetails).to.deep.equal(paperTags);

    // Give review
    const review = "This paper is excellent!";
    
});

});
