const hre = require("hardhat");

async function main() {
  const Governance = await hre.ethers.getContractFactory("SovereignGovernance");
  const contract = await Governance.deploy();
  
  await contract.waitForDeployment();
  
  console.log("SovereignGovernance deployed to:", contract.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
