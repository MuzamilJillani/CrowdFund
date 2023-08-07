const fs = require("fs/promises");
const hre = require("hardhat");

async function main() {
  const crowdFund = await hre.ethers.deployContract("CrowdFund");

  await crowdFund.waitForDeployment();

  console.log(
    `CrowdFund deployed to ${crowdFund.target} by ${crowdFund.runner.address}`
  );

  await writeDeploymentInfo(crowdFund);
}

const writeDeploymentInfo = async (contract, filename = 'deployment.json') => {
  const data = {
    contract : {
      address : contract.target,
      signerAddress : contract.runner.address,
      abi : contract.interface.format()
    }
  }
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(`${filename}`, content, {encoding : "utf-8"});

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
