'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  signal: string;
  vibe_score: number;
  timestamp: string;
  tx_hash?: string;
}

interface AlertNotificationProps {
  alerts: Alert[];
  onDismiss?: (index: number) => void;
}

export function AlertNotification({ alerts, onDismiss }: AlertNotificationProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show only new alerts (not dismissed)
    const newAlerts = alerts.filter(a => !dismissed.has(a.timestamp));
    setVisibleAlerts(newAlerts.slice(0, 3)); // Show max 3 alerts
  }, [alerts, dismissed]);

  const getAlertStyle = (signal: string) => {
    switch (signal) {
      case 'BULLISH_SIGNAL':
        return {
          bg: 'bg-gradient-to-r from-green-500/20 to-green-600/20',
          border: 'border-green-500/50',
          icon: '🟢',
          color: 'text-green-400',
        };
      case 'BEARISH_SIGNAL':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-red-600/20',
          border: 'border-red-500/50',
          icon: '🔴',
          color: 'text-red-400',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20',
          border: 'border-gray-500/50',
          icon: '⚪',
          color: 'text-gray-400',
        };
    }
  };

  const dismissAlert = (timestamp: string) => {
    setDismissed(prev => new Set(Array.from(prev).concat(timestamp)));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {visibleAlerts.map((alert, index) => {
          const style = getAlertStyle(alert.signal);
          return (
            <motion.div
              key={alert.timestamp}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`${style.bg} ${style.border} border rounded-xl p-4 backdrop-blur-sm shadow-lg`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1">
                  <div className={`font-bold ${style.color}`}>
                    {alert.signal.replace('_', ' ')}
                  </div>
                  <div className="text-white text-sm">
                    Vibe Score: {(alert.vibe_score * 100).toFixed(0)}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {formatTime(alert.timestamp)}
                  </div>
                  {alert.tx_hash && (
                    <div className="text-blue-400 text-xs mt-1 truncate">
                      TX: {alert.tx_hash.slice(0, 10)}...
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismissAlert(alert.timestamp)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Alert banner component for the dashboard
export function AlertBanner({ latestAlert }: { latestAlert?: Alert }) {
  if (!latestAlert || latestAlert.signal === 'NEUTRAL') return null;

  const style = latestAlert.signal === 'BULLISH_SIGNAL'
    ? 'from-green-500/30 to-green-600/30 border-green-500/50'
    : 'from-red-500/30 to-red-600/30 border-red-500/50';

  const icon = latestAlert.signal === 'BULLISH_SIGNAL' ? '🚀' : '⚠️';
  const message = latestAlert.signal === 'BULLISH_SIGNAL'
    ? 'Bullish sentiment detected! Market mood is positive.'
    : 'Bearish sentiment detected! Market mood is negative.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${style} border rounded-xl p-4 mb-4`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="text-white font-semibold">{message}</div>
          <div className="text-gray-300 text-sm">
            Current vibe: {(latestAlert.vibe_score * 100).toFixed(0)} | {new Date(latestAlert.timestamp).toLocaleTimeString()}
          </div>
        </div>
        {latestAlert.tx_hash && (
          <a
            href={`https://etherscan.io/tx/${latestAlert.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View TX →
          </a>
        )}
      </div>
    </motion.div>
  );
}
