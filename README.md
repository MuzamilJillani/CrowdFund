# Decentralized Crowdfunding Smart Contract

This project showcases a simple decentralized crowdfunding (crowdsale) smart contract written in Solidity. Users can contribute Ether to a fundraising campaign, and when the campaign reaches its goal, the funds are released to the beneficiary. If the campaign doesn't reach its goal within a specified time frame, contributors can claim a refund.

## Use Case

This smart contract can be used for creating decentralized fundraising campaigns. It ensures transparency, accountability, and automation of fund management.

## Getting Started

Follow these steps to get started with the project on your local machine.

### Prerequisites

- Node.js and npm: Install Node.js and npm by downloading and installing from [nodejs.org](https://nodejs.org/).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MuzamilJillani/CrowdFund.git
   cd CrowdFund
   ```
2. Install Dependencies:
   ```bash
   npm install
   ```
3. Run the Hardhat local network:
   ```bash
   npx hardhat node
   ```
4. Deploy the smart contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
