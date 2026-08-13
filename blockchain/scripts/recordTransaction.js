const { ethers } = require('ethers');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = new ethers.JsonRpcProvider(args.rpcUrl || 'http://127.0.0.1:8545');
  const wallet = new ethers.Wallet(args.privateKey, provider);

  const abi = [
    'function recordTransaction(string memory transactionId, string memory fromAccount, string memory toAccount, uint256 amount, string memory transactionType, uint256 timestamp) public returns (bytes32)'
  ];

  const contract = new ethers.Contract(args.contractAddress, abi, wallet);
  const tx = await contract.recordTransaction(
    args.transactionId,
    args.fromAccount,
    args.toAccount,
    BigInt(args.amount || '0'),
    args.transactionType || 'TRANSFER',
    BigInt(args.timestamp || '0')
  );

  const receipt = await tx.wait();
  console.log(receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
