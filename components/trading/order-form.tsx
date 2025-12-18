'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function OrderForm({ symbol = 'BTC-USD', currentPrice = 0, onSuccess }: { symbol: string, currentPrice: number, onSuccess?: () => void }) {
  // Normalize symbol to "BTC-USD" for DB/API, display might be "BTC/USD"
  const normalizedSymbol = symbol.replace('/', '-');
  const supabase = createClient();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LIMIT'>('MARKET');
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [assetBalance, setAssetBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fees
  const BUY_FEE = 0.006; // 0.6%
  const SELL_FEE = 0.011; // 1.1%

  // Fetch Balances
  useEffect(() => {
    const fetchBalances = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get USD Balance from profiles
      const { data: profile } = await supabase.from('profiles').select('balance_usd').eq('id', user.id).single();
      if (profile) setBalance(profile.balance_usd);

      // 2. Get Asset Holdings (from wallets)
      const assetSymbol = normalizedSymbol.split('-')[0] // Assume symbol is "BTC-USD"
      const { data: wallet } = await supabase.from('wallets').select('available_balance').eq('user_id', user.id).eq('asset_symbol', assetSymbol).single();
      if (wallet) setAssetBalance(Number(wallet.available_balance));
    };
    fetchBalances();
  }, [normalizedSymbol]);

  // Handle Percentage Allocation
  const handlePercentage = (pct: number) => {
    if (side === 'BUY') {
      const maxUsd = balance * pct;
      setAmountUSD(maxUsd.toFixed(2));
    } else {
      // For Sell, we calculate USD value of asset holdings
      const maxAssetValue = assetBalance * currentPrice * pct;
      setAmountUSD(maxAssetValue.toFixed(2));
    }
  };

  // Execute Order
  const handleExecute = async () => {
    if (!amountUSD) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Determine Execution Price and Quantity
      // Input is usually Amount in USD.
      // If Market Buy, Qty = AmountUSD / CurrentPrice (approx, backend uses exact matching)
      // If Limit Buy, Qty = AmountUSD / LimitPrice.
      // API expects 'quantity' (in Asset units) and 'price'.
      
      const price = orderType === 'MARKET' 
        ? (side === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95) 
        : parseFloat(limitPrice);
      const quantity = parseFloat(amountUSD) / price;

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      // Call API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            symbol: normalizedSymbol,
            order_type: side.toLowerCase(), // 'buy' or 'sell'
            type: orderType.toLowerCase(),
            price: Number(price), // Force number type
            quantity: Number(quantity) // Force number type
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Order execution failed");
      }
      
      // Call onSuccess to refresh parent/list if provided
      if (onSuccess) onSuccess();

      alert(orderType === 'MARKET' ? "Order Filled Successfully!" : "Limit Order Placed!");
      
      // Refresh
      if (onSuccess) onSuccess();
      // Refetch balances triggers via effect if needed
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Execution Failed: ${err.message}`);
      } else {
         alert(`Execution Failed: An unknown error occurred`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedFee = parseFloat(amountUSD || '0') * (side === 'BUY' ? BUY_FEE : SELL_FEE);
  const total = parseFloat(amountUSD || '0');

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 font-mono text-sm">
      {/* TABS */}
      <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
        {['LIMIT', 'MARKET', 'STOP_LIMIT'].map(t => (
          <button 
            key={t}
            onClick={() => setOrderType(t as "LIMIT" | "MARKET" | "STOP_LIMIT")}
            className={`px-3 py-1 rounded text-xs ${orderType === t ? 'bg-[#D4AF37] text-black font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* BUY/SELL TOGGLE */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 rounded font-bold ${side === 'BUY' ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-500'}`}
        >
          BUY
        </button>
        <button 
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 rounded font-bold ${side === 'SELL' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500'}`}
        >
          SELL
        </button>
      </div>

      {/* BALANCE INFO */}
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Avail: {side === 'BUY' ? `$${balance.toFixed(2)}` : `${assetBalance.toFixed(6)} ${symbol.split('-')[0]}`}</span>
        <span className="text-yellow-500 cursor-pointer hover:text-yellow-400">Deposit Funds +</span>
      </div>

      {/* INPUTS */}
      <div className="space-y-3">
        {orderType !== 'MARKET' && (
           <div className="flex items-center bg-white/5 border border-white/10 rounded px-3 py-2">
             <span className="text-gray-500 w-16">Price</span>
             <input 
               type="number" 
               value={limitPrice} 
               onChange={(e) => setLimitPrice(e.target.value)}
               className="bg-transparent w-full outline-none text-right text-white" 
               placeholder="0.00"
             />
             <span className="text-gray-500 ml-2">USD</span>
           </div>
        )}
        
        <div className="flex items-center bg-white/5 border border-white/10 rounded px-3 py-2">
           <span className="text-gray-500 w-16">Amount</span>
           <input 
             type="number" 
             value={amountUSD} 
             onChange={(e) => setAmountUSD(e.target.value)}
             className="bg-transparent w-full outline-none text-right text-white" 
             placeholder="0.00"
           />
           <span className="text-gray-500 ml-2">USD</span>
        </div>

        {/* PERCENTAGE SLIDER */}
        <div className="grid grid-cols-4 gap-1">
          {[0.25, 0.50, 0.75, 1].map(pct => (
            <button 
              key={pct} 
              onClick={() => handlePercentage(pct)}
              className="bg-white/5 hover:bg-white/10 text-xs py-1 rounded text-gray-400"
            >
              {pct * 100}%
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mt-4 space-y-1 text-xs text-gray-400 border-t border-white/10 pt-2">
        <div className="flex justify-between">
            <span>Fee ({side === 'BUY' ? '0.6%' : '1.1%'})</span>
            <span>${calculatedFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-bold text-sm">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <button 
        disabled={isLoading}
        onClick={handleExecute}
        className={`w-full mt-4 py-3 rounded font-bold text-black transition-all ${
            side === 'BUY' ? 'bg-[#D4AF37] hover:bg-[#B5952F]' : 'bg-[#FF5252] hover:bg-[#D32F2F]'
        }`}
      >
        {isLoading ? 'PROCESSING...' : `${side} ${symbol.split('-')[0]}`}
      </button>
    </div>
  );
}
