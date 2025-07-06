import React, { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import './App.css';

function App() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const RPC_ENDPOINTS = [
    process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  ];

  const isValidSolanaAddress = (address) => {
    try {
      if (!address || typeof address !== 'string' || address.length < 32 || address.length > 44) {
        return false;
      }
      const publicKey = new PublicKey(address);
      return PublicKey.isOnCurve(publicKey);
    } catch (err) {
      return false;
    }
  };

  const fetchBalance = async () => {
    setError('');
    setBalance(null);
    setLoading(true);

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        if (!isValidSolanaAddress(address)) {
          throw new Error('Invalid Solana address. Please enter a valid base58-encoded public key.');
        }

        console.log(`Attempting to connect to RPC: ${rpcUrl}`);
        const connection = new Connection(rpcUrl, { commitment: 'confirmed', timeout: 30000 });
        const publicKey = new PublicKey(address);

        console.log('Fetching balance...');
        const balanceInLamports = await connection.getBalance(publicKey, 'confirmed');
        const balanceInSOL = balanceInLamports / 1_000_000_000;

        setBalance({ sol: balanceInSOL, lamports: balanceInLamports });
        console.log(`Balance fetched successfully from ${rpcUrl}`);
        return; 
      } catch (err) {
        console.error(`Error with RPC ${rpcUrl}:`, err.message);
        if (err.message.includes('403')) {
          setError(`Access forbidden by RPC (${rpcUrl}). Trying next endpoint...`);
        } else if (err.message.includes('Invalid public key')) {
          setError('Invalid Solana address. Please check the address format.');
          break; 
        } else {
          setError(`Failed to fetch balance from ${rpcUrl}: ${err.message}`);
        }
        
      }
    }


    setError('All RPC endpoints failed. Please try again later or use a custom RPC endpoint.');
    setLoading(false);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    fetchBalance();
  };

  return (
    <div className="App">
      <h1>Solana Balance Checker</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Solana Address:
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value.trim())}
            placeholder="e.g., 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
            style={{ width: '400px', padding: '8px', margin: '10px' }}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Check Balance'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {balance && (
        <div>
          <h3>Balance Details</h3>
          <p>Address: {address}</p>
          <p>Balance: {balance.sol} SOL</p>
          <p>Balance (Lamports): {balance.lamports}</p>
        </div>
      )}
      <p style={{ fontSize: '12px', color: '#666' }}>
        Note: If errors persist, consider using a custom RPC endpoint from QuickNode or Helius.
      </p>
    </div>
  );
}

export default App;