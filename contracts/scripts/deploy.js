const hre = require("hardhat")

async function main() {
  console.log("Deploying Phenix Token to Base network...")

  // Get the ContractFactory and Signers
  const [deployer] = await hre.ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)

  const balance = await deployer.getBalance()
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH")

  // Deploy the contract
  const PhenixToken = await hre.ethers.getContractFactory("PhenixToken")
  const phenixToken = await PhenixToken.deploy()

  await phenixToken.deployed()

  console.log("Phenix Token deployed to:", phenixToken.address)
  console.log("Transaction hash:", phenixToken.deployTransaction.hash)

  // Wait for a few confirmations
  console.log("Waiting for confirmations...")
  await phenixToken.deployTransaction.wait(5)

  // Verify the contract on Basescan
  if (hre.network.name !== "hardhat") {
    console.log("Verifying contract on Basescan...")
    try {
      await hre.run("verify:verify", {
        address: phenixToken.address,
        constructorArguments: [],
      })
      console.log("Contract verified successfully")
    } catch (error) {
      console.log("Verification failed:", error.message)
    }
  }

  console.log("\n=== Deployment Summary ===")
  console.log("Network:", hre.network.name)
  console.log("Contract Address:", phenixToken.address)
  console.log("Deployer:", deployer.address)
  console.log("Total Supply: 1,000,000,000 PHX")
  console.log("=========================")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
