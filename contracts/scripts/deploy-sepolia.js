/**
 * Deploy to Sepolia Testnet
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-sepolia.js --network sepolia
 * 
 * Prerequisites:
 *   1. Get Sepolia ETH from faucet: https://sepoliafaucet.com
 *   2. Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env
 *   3. Set ETHERSCAN_API_KEY for verification
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SentimentOracle to Sepolia...\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (chainId: ${network.chainId})`);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error("❌ Deployer has no ETH! Get some from a faucet first.");
    console.log("   Faucet: https://sepoliafaucet.com");
    process.exit(1);
  }

  // Deploy contract
  console.log("📦 Deploying SentimentOracle...");
  const SentimentOracle = await hre.ethers.getContractFactory("SentimentOracle");
  const oracle = await SentimentOracle.deploy();
  await oracle.waitForDeployment();

  const contractAddress = await oracle.getAddress();
  console.log(`✅ SentimentOracle deployed to: ${contractAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `sepolia.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Deployment info saved to: ${deploymentFile}`);

  // Wait for confirmations before verification
  console.log("\n⏳ Waiting for block confirmations...");
  await oracle.deploymentTransaction().wait(5);

  // Verify on Etherscan
  console.log("\n🔍 Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Etherscan!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.log(`⚠️ Verification failed: ${error.message}`);
      console.log("   You can verify manually at https://sepolia.etherscan.io");
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Contract:  ${contractAddress}`);
  console.log(`Network:   Sepolia (chainId: 11155111)`);
  console.log(`Explorer:  https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("=".repeat(60));
  
  console.log("\n📌 Add this to your backend .env:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`WEB3_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`);
  console.log(`CHAIN_ID=11155111`);
  console.log(`NETWORK_NAME=sepolia`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
