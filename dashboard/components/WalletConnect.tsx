'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

interface OnChainData {
  score: number;
  lastUpdated: number;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkName, setNetworkName] = useState<string>('');
  const [onChainData, setOnChainData] = useState<OnChainData | null>(null);
  const [error, setError] = useState<string>('');

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await getNetworkInfo();
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    }
  };

  const getNetworkInfo = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkNames: Record<string, string> = {
          '0x1': 'Ethereum',
          '0x89': 'Polygon',
          '0xa86a': 'Avalanche',
          '0x7a69': 'Hardhat',
          '0x539': 'Localhost',
        };
        setNetworkName(networkNames[chainId] || `Chain ${parseInt(chainId, 16)}`);
      } catch (err) {
        console.error('Error getting network:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await getNetworkInfo();
        onConnect?.(accounts[0]);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected');
      } else {
        setError('Connection failed');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
    setNetworkName('');
    setOnChainData(null);
    onDisconnect?.();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        getNetworkInfo();
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🦊</span>
        Wallet Connection
      </h2>

      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🦊</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connect your wallet to view on-chain sentiment data
              </p>
            </div>

            <motion.button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Connect MetaMask'
              )}
            </motion.button>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-2"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Connected status */}
            <div className="flex items-center justify-between mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Connected</span>
              </div>
              <span className="text-gray-400 text-sm">{networkName}</span>
            </div>

            {/* Address */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                <div className="text-white font-mono">{formatAddress(address)}</div>
              </div>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </div>

            {/* On-chain data placeholder */}
            <div className="p-3 bg-gray-800/50 rounded-lg mb-4">
              <div className="text-xs text-gray-500 mb-2">On-Chain Sentiment</div>
              <div className="text-2xl font-bold text-white">
                {onChainData ? `${onChainData.score}` : '—'}
              </div>
              <div className="text-xs text-gray-500">
                {onChainData 
                  ? `Last updated: ${new Date(onChainData.lastUpdated * 1000).toLocaleString()}`
                  : 'Fetching from contract...'
                }
              </div>
            </div>

            {/* Disconnect button */}
            <button
              onClick={disconnectWallet}
              className="w-full py-2 px-4 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}
