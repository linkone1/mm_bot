const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const lodash = require('lodash');

// Set up Solana connection
const connection = new Connection('https://api.devnet.solana.com');

// Load the list of wallets from a file
const walletsFile = fs.readFileSync('/home/linkan/my_solana_wallets.json', 'utf-8');
const walletKeys = JSON.parse(walletsFile);

// Define your mint address (use a random contract address for testing)
const mintAddress = new PublicKey('GC4QFPbkFXdf9qXDwcvnPUKqJJsGHTy8bGvgHE9Spump');

// Load Keypairs from the list of wallets
const wallets = walletKeys.map(key => Keypair.fromSecretKey(Uint8Array.from(key.secret_key)));

// Function to buy and sell tokens for each wallet
async function tradeTokens(wallet) {
  // Generate random buy/sell actions
  const actions = lodash.shuffle([['buy', 0.1], ['buy', 0.3], ['sell', 0.2]]);
  for (const [action, amount] of actions) {
    // Execute buy/sell transaction
    console.log(`Executing ${action} for ${amount} SOL with mint ${mintAddress.toString()} using wallet ${wallet.publicKey.toString()}`);

    if (action === 'buy') {
      await buyToken(wallet, amount);
    } else if (action === 'sell') {
      await sellToken(wallet, amount);
    }
  }
}

// Buy token function
async function buyToken(wallet, amount) {
  console.log(`Buying ${amount} SOL worth of tokens using wallet ${wallet.publicKey.toString()}`);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: mintAddress,
      lamports: amount * LAMPORTS_PER_SOL, // Convert SOL to lamports
    })
  );
  const signature = await connection.sendTransaction(transaction, [wallet]);
  console.log(`Transaction successful with signature: ${signature}`);
}

// Sell token function
async function sellToken(wallet, amount) {
  console.log(`Selling ${amount} SOL worth of tokens using wallet ${wallet.publicKey.toString()}`);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: mintAddress,
      lamports: amount * LAMPORTS_PER_SOL, // Convert SOL to lamports
    })
  );
  const signature = await connection.sendTransaction(transaction, [wallet]);
  console.log(`Transaction successful with signature: ${signature}`);
}

// Stop command function to sell all and consolidate funds
async function stopAndConsolidate() {
  console.log(`Executing stop command`);
  for (const wallet of wallets) {
    // Sell all holdings in the wallet
    const balance = await connection.getBalance(wallet.publicKey);
    const amountToSell = balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
    console.log(`Selling ${amountToSell} SOL for wallet ${wallet.publicKey.toString()}`);
    await sellToken(wallet, amountToSell);

    // Transfer all SOL back to the main wallet
    const transferTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: mintAddress, // Change to main wallet address if consolidating
        lamports: balance,
      })
    );
    const signature = await connection.sendTransaction(transferTransaction, [wallet]);
    console.log(`Transferred all SOL back with signature: ${signature}`);
  }
  console.log('Stop command completed.');
}

// Execute trades for each wallet
async function runBot() {
  for (const wallet of wallets) {
    await tradeTokens(wallet);
  }
  console.log('Bot completed trading for all wallets.');
}

// Example usage
runBot().then(() => {
  console.log('Trading completed. You can now stop and consolidate if needed.');
  // Uncomment below line to run the stop command
  stopAndConsolidate();
}).catch((error) => {
  console.error('Error:', error);
});
