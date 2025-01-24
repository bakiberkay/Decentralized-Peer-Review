async function verifyEvaluationResult(contractAddress, reviewId) {
    const [deployer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PeerReview", contractAddress, deployer);

    const isHonest = await contract.reviewHonestyResults(reviewId);
    const reason = await contract.reviewHonestyReasons(reviewId);

    console.log(`Review ID: ${reviewId}`);
    console.log(`Honesty: ${isHonest ? "Yes" : "No"}`);
    console.log(`Reason: ${reason}`);

}

verifyEvaluationResult("0x3d0D2F202Fd195aB1De6553a64882b993Dd6FF44", 9).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

