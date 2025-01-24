const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PeerReview Callback Gas Test", function () {
    let peerReview;

    beforeEach(async function () {
        const PeerReview = await ethers.getContractFactory("PeerReview");
        peerReview = await PeerReview.deploy(/* constructor args */);
        await peerReview.waitForDeployment();

        // Set subscription ID
        await peerReview.setSubscriptionId(4103);

        // Set JavaScript source code
        const jsSourceCode = `
            const review = args[0];
            return Functions.encodeString(review === "Honest" ? "true" : "false");
        `;
        await peerReview.updateSourceCode(jsSourceCode);
    });

    it("should measure the gas usage of fulfillRequest via Chainlink mock", async function () {
        // Mock Chainlink request ID and response
        const requestId = ethers.keccak256(ethers.toUtf8Bytes("testRequestId"));
        const abiCoder = new ethers.AbiCoder();
        const response = abiCoder.encode(["string"], ["Honest"]);
        const error = "0x";

        // Trigger a request
        await peerReview.requestHonestyEvaluation(1, "Test review");

        // Mock the Chainlink callback (from the DON)
        const tx = await peerReview.callStatic.fulfillRequest(requestId, response, error);

        // Fetch transaction receipt
        const receipt = await tx.wait();
        console.log(`Gas Used: ${receipt.gasUsed.toString()}`);

        // Ensure gas usage is within limits
        expect(receipt.gasUsed).to.be.lessThan(300000);
    });
});
