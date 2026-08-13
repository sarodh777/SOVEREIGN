const hre = require("hardhat");

async function main() {
  const BankLedger = await hre.ethers.getContractFactory("BankLedger");
  const contract = await BankLedger.deploy();

  await contract.waitForDeployment();

  console.log("BankLedger deployed to:", contract.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
