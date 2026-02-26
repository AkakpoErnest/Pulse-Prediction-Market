import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for Pulse Market on Somnia Testnet (Shannon).
 *
 * Deployment order:
 *   1. PulseMarket (core)
 *   2. SomniaEventHandler (reactive settler)
 *   3. PulseMarket.setEventHandler(handler address)
 *
 * After deployment, the addresses are written to:
 *   - contracts/deployments/<network>.json
 *   - frontend/src/lib/deployments/<network>.json (for the frontend)
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║    PULSE MARKET — Deployment Script    ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`Network:  ${network.name} (chainId: ${(await ethers.provider.getNetwork()).chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} STT\n`);

  // ── 1. Deploy PulseMarket ──────────────────────────────────────────────────
  console.log("▸ Deploying PulseMarket...");
  const PulseMarket = await ethers.getContractFactory("PulseMarket");
  const pulseMarket = await PulseMarket.deploy(deployer.address);
  await pulseMarket.waitForDeployment();
  const pulseMarketAddress = await pulseMarket.getAddress();
  console.log(`  ✓ PulseMarket deployed at: ${pulseMarketAddress}`);

  // ── 2. Deploy SomniaEventHandler ──────────────────────────────────────────
  // Pass address(0) as reactiveService for testnet (set later when we have the real address).
  // For production, set REACTIVE_SERVICE_ADDRESS in .env.
  const reactiveServiceAddress =
    process.env.REACTIVE_SERVICE_ADDRESS || ethers.ZeroAddress;

  console.log("▸ Deploying SomniaEventHandler...");
  const SomniaEventHandler = await ethers.getContractFactory("SomniaEventHandler");
  const eventHandler = await SomniaEventHandler.deploy(
    pulseMarketAddress,
    reactiveServiceAddress,
    deployer.address
  );
  await eventHandler.waitForDeployment();
  const eventHandlerAddress = await eventHandler.getAddress();
  console.log(`  ✓ SomniaEventHandler deployed at: ${eventHandlerAddress}`);

  // ── 3. Wire contracts ──────────────────────────────────────────────────────
  console.log("▸ Setting event handler on PulseMarket...");
  const tx = await pulseMarket.setEventHandler(eventHandlerAddress);
  await tx.wait();
  console.log("  ✓ Event handler configured\n");

  // ── 4. Persist deployment addresses ───────────────────────────────────────
  const deploymentData = {
    network:              network.name,
    chainId:              Number((await ethers.provider.getNetwork()).chainId),
    deployer:             deployer.address,
    timestamp:            new Date().toISOString(),
    contracts: {
      PulseMarket:        pulseMarketAddress,
      SomniaEventHandler: eventHandlerAddress,
    },
  };

  // contracts/deployments/
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentData, null, 2)
  );

  // frontend/src/lib/deployments/
  const frontendDeploymentsDir = path.join(
    __dirname,
    "../../frontend/src/lib/deployments"
  );
  if (!fs.existsSync(frontendDeploymentsDir))
    fs.mkdirSync(frontendDeploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendDeploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("╔════════════════════════════════════════╗");
  console.log("║         Deployment Complete!           ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`PulseMarket:        ${pulseMarketAddress}`);
  console.log(`SomniaEventHandler: ${eventHandlerAddress}`);
  console.log(`Explorer: https://shannon-explorer.somnia.network/address/${pulseMarketAddress}\n`);

  // ── 5. Verify on explorer (if not local) ──────────────────────────────────
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("▸ Verifying contracts on explorer (30s delay)...");
    await new Promise((r) => setTimeout(r, 30_000));

    try {
      await run("verify:verify", {
        address: pulseMarketAddress,
        constructorArguments: [deployer.address],
      });
      console.log("  ✓ PulseMarket verified");
    } catch (e: any) {
      console.log("  ⚠ PulseMarket verification failed:", e.message);
    }

    try {
      await run("verify:verify", {
        address: eventHandlerAddress,
        constructorArguments: [
          pulseMarketAddress,
          reactiveServiceAddress,
          deployer.address,
        ],
      });
      console.log("  ✓ SomniaEventHandler verified");
    } catch (e: any) {
      console.log("  ⚠ SomniaEventHandler verification failed:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
