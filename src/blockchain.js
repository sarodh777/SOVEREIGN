import { ethers } from 'ethers';

const RPC_URL = import.meta.env.VITE_ETH_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = import.meta.env.VITE_BANKLEDGER_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const ABI = [
  'function recordTransaction(string memory transactionId, string memory fromAccount, string memory toAccount, uint256 amount, string memory transactionType, uint256 timestamp) public returns (bytes32)'
];

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export async function recordBankTransaction({ transactionId, fromAccount, toAccount, amount, transactionType, timestamp }) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const tx = await contract.recordTransaction(
    transactionId,
    fromAccount,
    toAccount,
    BigInt(amount),
    transactionType,
    BigInt(timestamp)
  );

  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getWalletAddress() {
  if (!window.ethereum) {
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer.getAddress();
}
