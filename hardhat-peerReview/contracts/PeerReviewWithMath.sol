// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// WILL REVERT CHAINLINK IMPORTS AFTER TESTING

//import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";


import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";


//contract PeerReview is AutomationCompatibleInterface {
contract PeerReview is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    uint256 public currentInterval = 0;

    // State variables
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;

    string public sourceCode; // JavaScript source for Chainlink Functions
    mapping(uint256 => bool) public reviewHonestyResults;
    mapping(uint256 => uint256) public reviewHonestyReasons;

    event GasUsage(string step, uint256 gasLeft);


    event HonestyEvaluationRequested(uint256 reviewId, string reviewText);
    event HonestyEvaluationCompleted(uint256 reviewId, bool isHonest, uint256 reason);

    // Router address - Hardcoded for Sepolia
    address private constant router = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    // donID - Hardcoded for Sepolia
    bytes32 private constant donID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;


    constructor() FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    /**
     * @notice Set the Chainlink subscription ID.
     */
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    /**
     * @notice Update the JavaScript source code for honesty evaluation.
     */
    function updateSourceCode(string memory newSourceCode) external onlyOwner {
        sourceCode = newSourceCode;
    }

    /**
     * @notice Request an honesty evaluation for a given peer review.
     * @param reviewId The ID of the review to evaluate.
     * @param reviewText The content of the peer review.
     * @return requestId The ID of the request.
     */

    function requestHonestyEvaluation(
    uint256 reviewId,
    string calldata reviewText
) external onlyOwner returns (bytes32 requestId) {
    emit GasUsage("Start", gasleft());
    FunctionsRequest.Request memory req;
    req.initializeRequestForInlineJavaScript(sourceCode); // Initialize the request with JS code
    emit GasUsage("Initialize", gasleft());

    // Declare and initialize a dynamic array for arguments
    string[] memory arguments = new string[](2);
    arguments[0] = toString(reviewId); // Convert reviewId to string
    arguments[1] = reviewText;         // Add reviewText
    emit GasUsage("Arguments", gasleft());

    req.setArgs(arguments); // Pass the dynamic array to setArgs
    emit GasUsage("SetArgs", gasleft());

    // Send the request and store the request ID
    s_lastRequestId = _sendRequest(
        req.encodeCBOR(),
        subscriptionId,
        gasLimit,
        donID
    );
    emit GasUsage("SendRequest", gasleft());

    emit HonestyEvaluationRequested(reviewId, reviewText);
    return s_lastRequestId;
}


     /**
     * @notice Callback function for fulfilling a request.
     * @param requestId The ID of the request to fulfill.
     * @param response The HTTP response data.
     * @param err Any errors from the Functions request.
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert("Unexpected request ID");
        }

        emit GasUsage("Fulfill reached!", gasleft());
        (uint256 reviewId, bool isHonest, uint256 reason) = abi.decode(response, (uint256, bool, uint256));
        reviewHonestyResults[reviewId] = isHonest;
        reviewHonestyReasons[reviewId] = reason;
        emit GasUsage("End fulfill", gasleft());

        emit HonestyEvaluationCompleted(reviewId, isHonest, reason);
        s_lastResponse = response;
        s_lastError = err;
    }
    
    /**
     * @notice Helper function to convert uint256 to string.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }


    enum Role { None, Chair, Reviewer, Author }
    enum PaperStatus { Pending, Accepted, RevisionNeeded, Rejected }

    struct User {
        address userAddress;
        uint reputationScore;
        string[] tags;
        uint activeTime;
        bool activeInCurrentInterval; // To track if the user was active in the current interval
        
    }

    struct Paper {
        uint id;
        string title;
        address author;
        string ipfsHash;
        bool reviewed;
        address[] reviewers;
        mapping(address => uint) ratings;
        string[] tags;
        PaperStatus status;

    }

    struct Conference {
        uint id;
        address chair;
        string name;
        string location;
        mapping(address => Role) roles;
        mapping(uint => Paper) papers;
        uint paperCount;
        string[] tags;

    }

    struct Interaction {
        address user;
        bool honesty;
        uint256 timestamp;

    }

    mapping(address => User) public users;
    address[] public registeredUsers;
    mapping(uint => Conference) public conferences;
    uint public conferenceCount;
    mapping(address => Interaction[]) public interactions;
    uint256 constant SCALING_FACTOR = 1000000;
    uint256 constant SCALING_FACTOR_SMALL = 100;

    uint public lastCleared;
    uint public clearInterval;


    event UserRegistered(address user);
    event ConferenceCreated(uint conferenceId, string name, address chair);
    event RoleAssigned(uint conferenceId, address user, Role role);
    event PaperSubmitted(uint conferenceId, uint paperId, address author, string ipfsHash);
    event ReviewSubmitted(uint conferenceId, uint paperId, address reviewer, string review);
    event InteractionRecorded(address indexed user, address indexed otherUser, bool honesty);
    event PaperEvaluated(uint conferenceId, uint paperId, PaperStatus status);
    event ReputationUpdated(address indexed user, uint newReputationScore);

    modifier onlyChair(uint conferenceId) {
        require(conferences[conferenceId].roles[msg.sender] == Role.Chair, "Only Chair can perform this action");
        _;
    }

    //constructor(uint initialInterval) {
    //    clearInterval = initialInterval;
    //}

    function registerUser(string[] memory tags) public {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        users[msg.sender] = User({
            userAddress: msg.sender,
            reputationScore: 5 * SCALING_FACTOR / 10, // Initial reputation score of 0.5
            tags: tags,
            activeTime: 0,
            activeInCurrentInterval: false
        });
        registeredUsers.push(msg.sender);
        emit UserRegistered(msg.sender);
    }

    function createConference(string memory name, string memory location, string[] memory tags) public {
        conferenceCount++;
        conferences[conferenceCount].id = conferenceCount;
        conferences[conferenceCount].chair = msg.sender;
        conferences[conferenceCount].name = name;
        conferences[conferenceCount].tags = tags;
        conferences[conferenceCount].location = location;
        conferences[conferenceCount].roles[msg.sender] = Role.Chair;
        emit ConferenceCreated(conferenceCount, name, msg.sender);
        emit RoleAssigned(conferenceCount, msg.sender, Role.Chair);

    }

    function assignRole(uint conferenceId, address user, Role role) public onlyChair(conferenceId) {
        require(users[user].userAddress != address(0), "User not registered");
        conferences[conferenceId].roles[user] = role;
        emit RoleAssigned(conferenceId, user, role);
    }

    function submitPaper(uint conferenceId, string calldata ipfsHash, string calldata title, string[] calldata tags) public {
        Conference storage conference = conferences[conferenceId];
        uint paperId = ++conference.paperCount;

        Paper storage paper = conference.papers[paperId];
        paper.id = paperId;
        paper.author = msg.sender;
        paper.tags = tags;
        paper.title = title;
        paper.ipfsHash = ipfsHash;
        paper.reviewed = false;

        // Automatically assign the author role when a paper is submitted
        if (conference.roles[msg.sender] == Role.None) {
            conference.roles[msg.sender] = Role.Author;
            emit RoleAssigned(conferenceId, msg.sender, Role.Author);
        }
        //incrementActiveTime(msg.sender);

        // Should check if the interaction is honest first
        recordInteraction(msg.sender, true);

     
        emit PaperSubmitted(conferenceId, paperId, msg.sender, ipfsHash);
    }

    function submitReview(uint conferenceId, uint paperId, uint8 rating, string memory reviewIpfsHash) public {
        require(conferences[conferenceId].roles[msg.sender] == Role.Reviewer, "Only Reviewers can submit reviews");
        require(conferences[conferenceId].papers[paperId].id != 0, "Paper does not exist");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(bytes(reviewIpfsHash).length != 0, "Review IPFS hash cannot be empty");

        Paper storage paper = conferences[conferenceId].papers[paperId];
        paper.ratings[msg.sender] = rating;
        paper.reviewed = true; //SHOULD THIS BE TRUE AFTER A NUMBER OF REVIEWS?
        //incrementActiveTime(msg.sender);

        // Should check if the interaction is honest first
        recordInteraction(paper.author, true);
        emit ReviewSubmitted(conferenceId, paperId, msg.sender, reviewIpfsHash);

        //ACCEPTENCE MECHANIC NOT IMPLEMENTED YET
    }

    function recordInteraction(address otherUser, bool honesty) public {
        User storage userData = users[msg.sender];
        interactions[msg.sender].push(Interaction({user: otherUser, honesty: honesty, timestamp: block.timestamp}));
        if (!userData.activeInCurrentInterval) {
            incrementActiveTime(msg.sender);
        }
        userData.activeInCurrentInterval = true;
        emit InteractionRecorded(msg.sender, otherUser, honesty);
    }

    /*function clearInteractions() public {
        for (uint i = 0; i < registeredUsers.length; i++) {
            delete interactions[registeredUsers[i]];
    }
    }*/

/*function clearInteractions() public {
    address[] memory localUsers = registeredUsers;
    uint256 length = localUsers.length;
    
    for (uint256 i = 0; i < length;) {
        // Storage pointer beneficial here since we access array multiple times
        Interaction[] storage userInteractions = interactions[localUsers[i]];
        uint256 interactionLength = userInteractions.length;
        
        // Batch pop operations using unchecked for gas savings
        while (interactionLength > 0) {
            unchecked {
                --interactionLength;
            }
            userInteractions.pop();
        }
        
        unchecked { ++i; }
    }
}*/

function clearInteractions() public {
    address[] memory localUsers = registeredUsers;
    uint256 length = localUsers.length;
    
    for (uint256 i = 0; i < length; i++) {
        interactions[localUsers[i]] = new Interaction[](0);
    }
}











    

    function getUserInteractions(address user) public view returns (Interaction[] memory) {
        return interactions[user];
    }    

    function calculatePunishmentFactor(address user) public view returns (uint256) {
        Interaction[] storage userInteractions = interactions[user];
        //if (userInteractions.length == 0) {
        //    return SCALING_FACTOR; // No interactions, no punishment or gain
        //}

        uint256 sumR_H_k = 0;
        uint256 sumR_k = 0;
        uint256 thePunisher = 0; // To avoid division by zero

        for (uint256 i = 0; i < userInteractions.length; i++) {
            address interactingUser = userInteractions[i].user;
            uint256 reputation = users[interactingUser].reputationScore;

            sumR_k += reputation;
            if (userInteractions[i].honesty) {
                sumR_H_k += reputation;
            }
            if (userInteractions[i].honesty == false) {
                thePunisher++;
            }
        }

        if (sumR_k == 0) {
            return SCALING_FACTOR; // Avoid division by zero
        }

        uint256 offset = (5 - thePunisher) * SCALING_FACTOR;
        uint256 numerator = (offset + sumR_H_k) * SCALING_FACTOR;
        uint256 denominator = offset + sumR_k;
        return numerator / denominator;
    }

    //lazım mı bilmiyorum
    //function setClearInterval(uint newInterval) external {
    //    clearInterval = newInterval;
    //}


//CHAINLIK FUNCTIONS, ADD THE "OVERRIDE" KEYWORD AFTER TESTING!!!
    //function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData) {
    //upkeepNeeded = (block.timestamp >= lastCleared + clearInterval && isSundayEvening());
    //performData = ""; //We assigned an empty array to suppress unnamed return variable warning
//}

function performUpkeep(bytes calldata) external {
    //GET RID OF THIS COMMENT AFTER TESTING IT CHECKS FOR TIME, 
    //require(block.timestamp >= lastCleared + clearInterval, "Too early for upkeep");

     // Might be highly expensive: Update reputation for all registered users
    //for (uint i = 0; i < registeredUsers.length; i++) {
    //    address userAddress = registeredUsers[i];
    //    updateReputation(userAddress);
    //}
    
    //updateReputation();

    //clearInteractions();
    resetActiveTime();
    lastCleared = block.timestamp;
    currentInterval++;

}


    function getCurrentInterval() public view returns (uint256) {
        return currentInterval;
    }

    function isSundayEvening() internal view returns (bool) {
        uint dayOfWeek = (block.timestamp / 1 days + 4) % 7;
        uint timeOfDay = block.timestamp % 1 days;
        return dayOfWeek == 0 && timeOfDay >= 23 hours + 59 minutes;
    }

    //function updateReputation(address user) public {
    //    
    //    uint256 P_t_i = calculatePunishmentFactor(user);
    //    uint256 gain_summand = calculateGainSummand(user, P_t_i);
    //
    //    users[user].reputationScore = (users[user].reputationScore * P_t_i / SCALING_FACTOR) + gain_summand;
    //    emit ReputationUpdated(user, users[user].reputationScore);
    //}

    /*function updateReputation() public {

        for (uint i = 0; i < registeredUsers.length; i++) {
            if (users[registeredUsers[i]].activeInCurrentInterval) {
        address user = registeredUsers[i];
        uint256 P_t_i = calculatePunishmentFactor(user);
        uint256 gain_summand = calculateGainSummand(user, P_t_i);

        users[user].reputationScore = (users[user].reputationScore * P_t_i / SCALING_FACTOR) + gain_summand;
        emit ReputationUpdated(user, users[user].reputationScore);
           }
        
    }
        
    }*/


    /*function updateReputation() public {

    // Cache registeredUsers in memory to avoid repeated storage reads
    address[] memory localRegisteredUsers = registeredUsers;

    uint256 length = localRegisteredUsers.length;

    for (uint i = 0; i < length; i++) {
        if (users[localRegisteredUsers[i]].activeInCurrentInterval) {
      
        address user = localRegisteredUsers[i]; // Read from memory instead of storage

        // Calculate factors directly
        uint256 P_t_i = calculatePunishmentFactor(user); 
        uint256 gain_summand = calculateGainSummand(user, P_t_i);

        // Cache user data locally to minimize storage access
        //uint256 reputationScore = users[user].reputationScore; // Read from storage once

        // Perform calculations in memory
        //reputationScore = (reputationScore * P_t_i / SCALING_FACTOR) + gain_summand;

        // Write updated reputation score back to storage once
        //users[user].reputationScore = reputationScore;


        users[user].reputationScore = (users[user].reputationScore * P_t_i / SCALING_FACTOR) + gain_summand;

        emit ReputationUpdated(user, users[user].reputationScore);
        //emit ReputationUpdated(user, reputationScore);
    }
      } 
}*/

function updateReputation() public {
    // Cache array length to avoid multiple storage reads
    //address [] memory localRegisteredUsers = registeredUsers;
    uint256 length = registeredUsers.length;
    
    for (uint256 i = 0; i < length; i++) {
        address user = registeredUsers[i];
        
        // Create storage pointer first - this is more gas efficient
        // as it avoids calculating storage location twice
        User storage userInfo = users[user];
        
        if (userInfo.activeInCurrentInterval) {
            // Cache reputation score to avoid multiple SLOAD operations
            uint256 currentScore = userInfo.reputationScore;
            
            // Calculate factors
            uint256 punishmentFactor = calculatePunishmentFactor(user);
            
            // Perform multiplication before division to maintain precision
            uint256 newScore = (currentScore * punishmentFactor);
            newScore = newScore / SCALING_FACTOR;
            newScore += calculateGainSummand(user, punishmentFactor);

            // Single SSTORE operation
            userInfo.reputationScore = newScore;
            emit ReputationUpdated(user, newScore);

            
           
        }
    }
}

    


    function calculateGainSummand(address user, uint256 P_t_i) public view returns (uint256) {
        //if (!users[user].activeInCurrentInterval) {
        //return 0; // No gain summand if the user was not active
        //}
        uint256 x = users[user].reputationScore;
        uint256 scaledX = x * P_t_i / SCALING_FACTOR;

        uint256 gain_summand = f(scaledX, users[user].activeTime);
        return gain_summand;
    }

    function f(uint256 x, uint256 active_time) public pure returns (uint256) {
        //uint256 g_t_i = g(active_time);
        // DİKKAT NORMALDE BÖLÜ 10 BEN ELLEDİM ONA GÖRE!
        //TAM GAIN ALAMADIGIM ICIN BİR DE ÇARPI 10 KOYDUM ONU YOK ET!!!!!!!!
        uint256 alpha = SCALING_FACTOR / 200; // Alpha is 0.1 scaled by SCALING_FACTOR
        uint256 numerator = alpha * 4 * x * (1000000 - x) * (1000000 + (active_time * SCALING_FACTOR / 15));
        uint256 denominator = SCALING_FACTOR * SCALING_FACTOR * SCALING_FACTOR;

        return numerator / denominator;
        }



    function getUserTags(address user) public view returns (string[] memory) {
    return users[user].tags;
}

    // DİKKAT CAP ATMAYA ÇALIŞTIM
    function incrementActiveTime(address user) public {
        //if (!users[user].activeInCurrentInterval) {
        uint currentActiveTime = users[user].activeTime;
            if (currentActiveTime < 30) {
                users[user].activeTime = currentActiveTime + 1;
            }        //    users[user].activeInCurrentInterval = true;
        //}
    }

    function resetActiveTime() public {
        for (uint i = 0; i < registeredUsers.length; i++) {
            users[registeredUsers[i]].activeInCurrentInterval = false;
        }
    }

    function getConferenceIds() public view returns (uint[] memory) {
        uint[] memory conferenceIds = new uint[](conferenceCount);
        for (uint i = 1; i <= conferenceCount; i++) {
            conferenceIds[i - 1] = i;
        }
        return conferenceIds;
    }

    function getConferenceDetails(uint conferenceId) public view returns (uint, address, string memory, string memory, string[] memory) {
        Conference storage conference = conferences[conferenceId];
        return (conference.id, conference.chair, conference.name, conference.location, conference.tags);
    }

    function getPaperIpfsHashes(uint conferenceId) public view returns (string[] memory) {
    Conference storage conference = conferences[conferenceId];
    string[] memory ipfsHashes = new string[](conference.paperCount);
    for (uint i = 1; i <= conference.paperCount; i++) {
        ipfsHashes[i - 1] = conference.papers[i].ipfsHash;
    }
    return ipfsHashes;
}

//THIS PART IS WORK ON PROGRESS
//ONLY CHAIR KISMINDA PROBLEM VAR ŞUAN NİYE ANLAYAMIYORUM

function assignReviewers(uint conferenceId, uint paperId) public onlyChair(conferenceId) {
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];
    require(paper.id != 0, "Paper does not exist");

    uint maxReviewers = 3; // Number of reviewers to assign
    address[] memory potentialReviewers = new address[](registeredUsers.length);
    uint count = 0;

    User storage author = users[paper.author]; // Get the author's reputation score

    for (uint i = 0; i < registeredUsers.length; i++) {
        address userAddress = registeredUsers[i];
        User storage user = users[userAddress];
        
        // Calculate tag similarity between the user and the paper
        uint tagSimilarity = calculateTagSimilarity(user.tags, paper.tags);
        
        // Check if user has a similar reputation score and is not the author
        if (user.reputationScore >= author.reputationScore * 9 / 10 && user.reputationScore <= author.reputationScore * 11 / 10 && userAddress != paper.author) {
            // Randomness factor
            uint randomness = uint(keccak256(abi.encodePacked(block.timestamp, userAddress))) % 100;
            if (tagSimilarity > 50 && randomness < 100) {
                potentialReviewers[count] = userAddress;
                count++;
            }
        }
    }
    
    // Shuffle potential reviewers for randomness
    for (uint i = 0; i < count; i++) {
        uint n = i + uint(keccak256(abi.encodePacked(block.timestamp))) % (count - i);
        address temp = potentialReviewers[n];
        potentialReviewers[n] = potentialReviewers[i];
        potentialReviewers[i] = temp;
    }
    
    for (uint i = 0; i < maxReviewers && i < count; i++) {
        paper.reviewers.push(potentialReviewers[i]);
        assignRole(conferenceId, potentialReviewers[i], Role.Reviewer);
    }
}


function calculateTagSimilarity(string[] memory userTags, string[] memory paperTags) internal pure returns (uint256) {
    uint256 userTagsLength = userTags.length;
    uint256 paperTagsLength = paperTags.length;

    // Handle edge cases where one or both sets are empty
    if (userTagsLength == 0 || paperTagsLength == 0) {
        return 0; // No similarity if either has no tags
    }

    uint256 matches = 0;

    // Check user tags against the "set" of paper tags
    for (uint256 i = 0; i < userTagsLength; i++) {
        for (uint256 j = 0; j < paperTagsLength; j++) {
            if (keccak256(bytes(userTags[i])) == keccak256(bytes(paperTags[j]))) {
                matches++;
                break; // exit inner loop after first match
            
            }
        }
    }

    // Calculate similarity as the percentage of matches based on the smaller of the two sets
    uint256 smallerSetSize = userTagsLength < paperTagsLength ? userTagsLength : paperTagsLength;
    return (matches * 100) / smallerSetSize;
}


function getPaperReviewers(uint conferenceId, uint paperId) public view returns (address[] memory) {
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];
    
    require(paper.id != 0, "Paper does not exist");
    
    return paper.reviewers;
}

/*function getEvaluatePaperIntermediaryValues(uint conferenceId, uint paperId) public view returns (uint256, uint256, uint256, uint256[] memory, uint256[] memory, uint256[] memory) {
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];
    require(paper.id != 0, "Paper does not exist");
    require(paper.reviewers.length > 0, "No reviews submitted for this paper");

    uint256[] memory scores = new uint256[](paper.reviewers.length);
    uint256[] memory reputations = new uint256[](paper.reviewers.length);
    uint256[] memory tagSimilarities = new uint256[](paper.reviewers.length);

    uint256 weightedSum = 0;
    uint256 totalWeight = 0;

    for (uint i = 0; i < paper.reviewers.length; i++) {
        address reviewer = paper.reviewers[i];
        scores[i] = paper.ratings[reviewer];
        reputations[i] = users[reviewer].reputationScore;
        tagSimilarities[i] = calculateTagSimilarity(users[reviewer].tags, paper.tags);

        if (scores[i] > 0 && tagSimilarities[i] > 0) {
            uint256 weight = (reputations[i] * tagSimilarities[i]) / SCALING_FACTOR;
            weightedSum += scores[i] * weight;
            totalWeight += weight;
        }
    }
    uint256 averageScore = weightedSum * SCALING_FACTOR / totalWeight;

    return (averageScore, weightedSum, totalWeight, scores, reputations, tagSimilarities);
}*/

function evaluatePaper(uint conferenceId, uint paperId) public{
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];
    require(paper.id != 0, "Paper does not exist");
    require(paper.reviewers.length > 0, "No reviews submitted for this paper");

    // Initialize variables for weighted score calculation
    uint256 weightedSum = 0;
    uint256 totalWeight = 0;

    for (uint i = 0; i < paper.reviewers.length; i++) {
        address reviewer = paper.reviewers[i];
        uint256 score = paper.ratings[reviewer];
        uint256 reputation = users[reviewer].reputationScore;

        // Calculate tag similarity (normalized to [0, SCALING_FACTOR])
        uint256 tagSimilarity = calculateTagSimilarity(users[reviewer].tags, paper.tags); 

        if (score > 0 && tagSimilarity > 0) {
            // Combine reputation and tag similarity into a weight
            uint256 weight = (reputation * tagSimilarity) / SCALING_FACTOR; // Normalize combined weight
            weightedSum += score * weight;
            totalWeight += weight;
        }
    }

    require(totalWeight > 0, "No valid reviews for this paper");

    // Calculate weighted average
    uint256 averageScore = weightedSum * SCALING_FACTOR / totalWeight;

    // Assign status based on average score
    if (averageScore >= 4 * SCALING_FACTOR) { // Equivalent to >= 4
        paper.status = PaperStatus.Accepted;
    } else if (averageScore >= 5 * SCALING_FACTOR / 2) { // Equivalent to >= 2.5
        paper.status = PaperStatus.RevisionNeeded;
    } else {
        paper.status = PaperStatus.Rejected;
    }

    emit PaperEvaluated(conferenceId, paperId, paper.status);
    
}

function getPaperStatus(uint conferenceId, uint paperId) public view returns (PaperStatus) {
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];
    return paper.status;
}


function getUserRole(uint conferenceId, address user) public view returns (Role) {
    Conference storage conference = conferences[conferenceId];
    return conference.roles[user];
}


function revertToChair(uint conferenceId, address user, Role role) public {
    require(users[user].userAddress != address(0), "User not registered");
        conferences[conferenceId].roles[user] = role;
        emit RoleAssigned(conferenceId, user, role);
} 

function getPaperDetails(uint conferenceId, uint paperId) public view returns (string[] memory) {
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];

    return paper.tags;
}

/*function getPaperScores(uint conferenceId, uint paperId) public view returns (uint[] memory) {
    Conference storage conference = conferences[conferenceId];
    Paper storage paper = conference.papers[paperId];
    uint[] memory scores = new uint[](paper.reviewers.length);

    for (uint i = 0; i < paper.reviewers.length; i++) {
        address reviewer = paper.reviewers[i];
        scores[i] = paper.ratings[reviewer];
    }

    return scores;
}*/



function calculateWeightedScore(uint conferenceId, uint paperId) public view returns (uint256) {
    Paper storage paper = conferences[conferenceId].papers[paperId];
    require(paper.reviewers.length > 0, "No reviewers assigned to this paper.");

    uint256 weightedSum = 0;
    uint256 totalWeight = 0;

    for (uint i = 0; i < paper.reviewers.length; i++) {
        address reviewer = paper.reviewers[i];
        uint256 score = paper.ratings[reviewer];
        
        if (score > 0) { // Only include reviewers who have given a score
            uint256 reputation = users[reviewer].reputationScore;
            uint256 confidence = calculateTagSimilarity(users[reviewer].tags, paper.tags); // Confidence score

            weightedSum += score * reputation * confidence;
            totalWeight += reputation * confidence;
        }
    }

    require(totalWeight > 0, "Total weight cannot be zero.");
    return (weightedSum * SCALING_FACTOR) / totalWeight;
}


function getRegisteredUsers() public view returns (address[] memory) {
    return registeredUsers;
}


//WEIGHTED SCORE FORMULU ZATEN PAPERDA DA Bİ ARIZALI ONA BİR EL AT,
//SIMILARITY VE REPUTATIONA GORE WEIGHTLENSE SADECE YETERLI ZATEN


}
