import { parseEther } from "ethers";
import { ethers } from "hardhat";

async function main() {
  const paymentAmount = parseEther("0.01");

  const Contract = await ethers.getContractFactory("IconicMembership");
  const contract = await Contract.deploy(paymentAmount);

  console.log("⏳ Esperando o deploy ser confirmado...");
  await contract.waitForDeployment();

  console.log("✅ Contrato deployado com sucesso!");
  console.log("📬 Endereço:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
