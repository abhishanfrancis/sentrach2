const hre = require("hardhat");

async function main() {
  console.log("Deploying SentimentOracle...");
  
  const SentimentOracle = await hre.ethers.getContractFactory("SentimentOracle");
  const oracle = await SentimentOracle.deploy();
  
  await oracle.waitForDeployment();
  const address = await oracle.getAddress();
  
  console.log(`SentimentOracle deployed to: ${address}`);
  console.log(`\nAdd to backend/.env:\nCONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
