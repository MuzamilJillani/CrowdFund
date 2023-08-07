pragma solidity ^0.8.0;

contract CrowdFund {
    // state variables
    address owner;
    uint ownerPool;

    mapping(uint => Campaign) campaigns;
    uint nextCampaignId;

    // structs
    struct Campaign {
        address beneficiary;
        uint goal;
        uint deadline;
        mapping(address => uint) contributions;
        mapping(address => bool) isContributor;
        uint totalCollected;
    }

    // constructors
    constructor() {
        owner = msg.sender;
    }

    // events
    event CampaignStarted(
        address indexed beneficiary,
        uint goalAmount,
        uint deadline,
        uint timestamp
    );
    event Contribution(
        address indexed contributor,
        uint indexed campaignId,
        uint amount,
        uint timestamp
    );
    event GoalAchieved(
        uint indexed campaignId,
        uint goalAmount,
        uint amountCollected,
        uint timestamp
    );
    event Refund(
        address indexed contributor,
        uint indexed campaignId,
        uint refundAmount,
        uint timestamp
    );
    event CampaignAmountWithdraw(
        uint campaignId,
        uint goalAmount,
        uint timestamp
    );
    event OwnerPoolWithdraw(uint amount, uint timestamp);

    modifier onlyOwner() {
        require(owner == msg.sender, "You are not the owner!");
        _;
    }

    modifier campaignExists(uint _campaignId) {
        require(
            getCampaignBeneficiary(_campaignId) != address(0),
            "Campaign does not exist!"
        );
        _;
    }

    modifier canFund(uint _campaignId) {
        require(
            getCampaignBeneficiary(_campaignId) != msg.sender,
            "You can't fund your own campaign"
        );
        require(!isDeadlineEnded(_campaignId), "Campaign is over");
        require(!isGoalAchieved(_campaignId), "Goal amount Achieved");
        _;
    }

    function startCampaign(
        address _beneficiary,
        uint _goal,
        uint _deadline
    ) public onlyOwner {
        require(_deadline > block.timestamp, "deadline can't be in the past");
        uint campaignId = nextCampaignId;
        Campaign storage campaign = campaigns[campaignId];
        campaign.beneficiary = _beneficiary;
        campaign.goal = _goal;
        campaign.deadline = _deadline;

        nextCampaignId++;

        emit CampaignStarted(_beneficiary, _goal, _deadline, block.timestamp);
    }

    function fundCampaign(
        uint _campaignId
    ) public payable campaignExists(_campaignId) canFund(_campaignId) {
        campaigns[_campaignId].contributions[msg.sender] += msg.value;
        campaigns[_campaignId].totalCollected += msg.value;
        campaigns[_campaignId].isContributor[msg.sender] = true;

        if (isGoalAchieved(_campaignId)) {
            emit GoalAchieved(
                _campaignId,
                campaigns[_campaignId].goal,
                campaigns[_campaignId].totalCollected,
                block.timestamp
            );
        }

        emit Contribution(msg.sender, _campaignId, msg.value, block.timestamp);
    }

    function claimRefund(uint _campaignId) public campaignExists(_campaignId) {
        require(isDeadlineEnded(_campaignId), "Campaign not ended yet");
        require(!isGoalAchieved(_campaignId), "Goal achieved, can't refund");
        require(
            isContributor(_campaignId),
            "You are not a contributor to this campaign"
        );
        require(
            campaigns[_campaignId].contributions[msg.sender] != 0,
            "You have no contribution to get refund"
        );
        uint refundAmount = campaigns[_campaignId].contributions[msg.sender];

        campaigns[_campaignId].contributions[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: refundAmount}("");
        require(sent);
        emit Refund(msg.sender, _campaignId, refundAmount, block.timestamp);
    }

    function withdrawAmount(
        uint _campaignId
    ) public campaignExists(_campaignId) {
        require(isGoalAchieved(_campaignId), "Goal not achieved");
        require(
            getCampaignBeneficiary(_campaignId) == msg.sender,
            "You are not the beneficiary of this campaign"
        );

        uint amount = campaigns[_campaignId].goal;
        ownerPool += (campaigns[_campaignId].totalCollected - amount);

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent);
        delete campaigns[_campaignId];
        emit CampaignAmountWithdraw(_campaignId, amount, block.timestamp);
    }

    function withdrawOwnerPool() external onlyOwner {
        uint amount = ownerPool;
        ownerPool = 0;

        (bool sent, ) = payable(owner).call{value: amount}("");
        require(sent);

        emit OwnerPoolWithdraw(amount, block.timestamp);
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getCampaignBeneficiary(
        uint _campaignId
    ) public view returns (address) {
        return campaigns[_campaignId].beneficiary;
    }

    function getCampaignGoal(uint _campaignId) public view returns (uint) {
        return campaigns[_campaignId].goal;
    }

    function getTotalAmountCollected(
        uint _campaignId
    ) public view returns (uint) {
        return campaigns[_campaignId].totalCollected;
    }

    function getCampaignDeadline(uint _campaignId) public view returns (uint) {
        return campaigns[_campaignId].deadline;
    }

    function isDeadlineEnded(uint _campaignId) public view returns (bool) {
        return getCampaignDeadline(_campaignId) < block.timestamp;
    }

    function isGoalAchieved(uint _campaignId) public view returns (bool) {
        return
            getTotalAmountCollected(_campaignId) >=
            getCampaignGoal(_campaignId);
    }

    function isContributor(uint _campaignId) public view returns (bool) {
        return campaigns[_campaignId].isContributor[msg.sender];
    }
}
