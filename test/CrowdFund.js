const { expect } = require("chai");
const { ethers } = require("hardhat");

const getTime = async () => {
  const blockNumber = await  ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  return block.timestamp;
}

describe("CrowdFund", function () {
  let owner;
  let addr1;
  let addr2;
  let contract;

  before( async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const CrowdFund = await ethers.getContractFactory("CrowdFund");
    contract = await CrowdFund.deploy();
  });

  describe("deployment", () => {
    it("should deploy and asign deployer of contract as owner", async () => {
      const addr = await contract.getOwner();
      expect(await addr).to.be.equal(owner.address);
    });
  });
  
  describe("Starting a Campaign", () => {
    it("non-owner cannot start a campaign", async () => {
      await expect(contract.connect(addr1).startCampaign(addr2.address, 1000, (await getTime()) + 3600)).to.be.reverted;; 
    });
    it("should not start campaign with deadline in the past", async () => {
      await expect(contract.startCampaign(addr1.address, 1000, (await getTime()) - 1)).to.be.reverted;
    })
    it("should start campaign by owner", async () => {
      expect(await contract.startCampaign(addr1.address, 1000, (await getTime()) + 3600)).to.emit(contract, "CampaignStarted");
    });
  });

  describe("Funding Campaign", () => {
    it("should not allow Beneficiary to fund its own campaign", async () => {
      await expect(contract.connect(addr1).fundCampaign(0, {value : "100"})).to.be.revertedWith("You can't fund your own campaign");
    });
    it("should not allow Contributor to fund invalid campaign", async () => {
      await expect(contract.connect(addr2).fundCampaign(1, {value : "100"})).to.be.revertedWith("Campaign does not exist!");
    });
    it("should allow funding a campaign", async () =>{
      await expect(contract.connect(addr2).fundCampaign(0, {value: "100"})).to.emit(contract, "Contribution");
    });
    it("should emit GoalAchieved event upon achieving goal", async () => {
      await expect(contract.connect(addr2).fundCampaign(0, {value: "1000"})).to.emit(contract, "GoalAchieved");
    });
    it("should not allow further funding after achieving goal", async () => {
      await expect(contract.connect(addr2).fundCampaign(0, {value: "1"})).to.be.revertedWith("Goal amount Achieved");
    });
    it("should not allow funding after deadline passed", async () => {
      await ethers.provider.send("evm_mine", [await getTime() + 10000]);
      await expect(contract.connect(addr2).fundCampaign(0, {value : "100"})).to.be.revertedWith("Campaign is over");
    });
  });

  describe("Refund after Unsuccesfull Campaigns", () => {
    it("should not allow refund claim for invalid campaigns", async () => {
      await expect(contract.connect(addr2).claimRefund(1)).to.be.revertedWith("Campaign does not exist!");
    });
    it("should not allow refund before deadline", async () => {
      await contract.startCampaign(addr1.address, 1000, await getTime() + 3600);
      await expect(contract.connect(addr2).fundCampaign(1, {value : "100"})).to.changeEtherBalances([contract, addr2], ["100","-100"]);
      await expect(contract.connect(addr2).claimRefund(1)).to.be.revertedWith("Campaign not ended yet");
    });
    it("should not allow refund if goal achieved", async () => {
      await expect(contract.connect(addr2).claimRefund(0)).to.be.revertedWith("Goal achieved, can't refund");
    })
    it("should not allow non-contributor to claim refund", async () => {
      await ethers.provider.send('evm_mine', [await getTime() + 10000]);
      await expect(contract.claimRefund(1)).to.be.revertedWith("You are not a contributor to this campaign");
    });
    it("should allow refund to contributor when campaign unsuccessful", async () => {
      await expect(contract.connect(addr2).claimRefund(1)).to.changeEtherBalances([contract, addr2],["-100", "100"]);
    });
    it("should not allow to get a refund again", async () => {
      await expect(contract.connect(addr2).claimRefund(1)).to.be.revertedWith("You have no contribution to get refund");
    })
  });

  describe("Withdraw Funding", () => {
    it("should not allow withdraw from an invalid campaign", async () => {
      await expect(contract.connect(addr1).withdrawAmount(2)).to.be.revertedWith("Campaign does not exist!");
    })
    it("should not allow withdraw when goal not achieved", async () => {
      await contract.startCampaign(addr1.address, 1000, await getTime() + 100);
      await contract.connect(addr2).fundCampaign(2, {value : "100"});
      await expect(contract.connect(addr1).withdrawAmount(2)).to.be.revertedWith("Goal not achieved");
    })
    it("should not allow non-beneficiary to withdraw funds", async () => {
      await expect(contract.connect(addr2).withdrawAmount(0)).to.be.revertedWith("You are not the beneficiary of this campaign");
    });
    it("should allow beneficiary withdraw when campaign is success", async () => {
      await expect(contract.connect(addr1).withdrawAmount(0)).to.changeEtherBalances([contract, addr1], ["-1000","1000"]);
    });
    it("should not allow beneficiary withdraw same funds again", async () => {
      await expect(contract.connect(addr1).withdrawAmount(0)).to.be.revertedWith("Campaign does not exist!");
    })
  });
  
  describe("Withdraw Owner Pool", () => {
    it("non-owner cannot withdraw owner pool", async () => {
      await expect(contract.connect(addr1).withdrawOwnerPool()).to.be.revertedWith("You are not the owner!");
    })
    it("should allow owner to withdraw owner pool", async () => {
      await expect(contract.withdrawOwnerPool()).to.changeEtherBalances([contract,owner],["-100","100"]);
    })
  })


});
