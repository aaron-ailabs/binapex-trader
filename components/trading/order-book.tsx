'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OrderBookEntry {
    price: number;
    amount: number;
    total: number;
}

interface Order {
    id: string;
    price: number;
    amount: number;
    filled_amount: number;
    side: 'BUY' | 'SELL';
    status: string;
}

export function OrderBook({ price, symbol = "BTC-USD" }: { price: number, symbol?: string }) {
  const normalizedSymbol = symbol.replace('/', '-');
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch Initial State
    const fetchBook = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('pair', normalizedSymbol)
            .eq('status', 'OPEN');
        
        if (data) processOrders(data);
    };

    fetchBook();

    // 2. Realtime Subscription
    const channel = supabase
        .channel(`orderbook-${normalizedSymbol}`)
        .on(
            'postgres_changes',
            { 
                event: '*', 
                schema: 'public', 
                table: 'orders', 
                filter: `pair=eq.${normalizedSymbol}` 
            },
            (payload) => {
                // To keep it simple and accurate, we re-fetch on any change
                // Optimizing to incremental updates is better but riskier for consistency without complex state mgmt
                // Given "Reconstruct" mandate, correctness > perf for V1.
                fetchBook();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [normalizedSymbol]);

  const processOrders = (orders: any[]) => {
      const newAsks: Record<number, number> = {};
      const newBids: Record<number, number> = {};

      orders.forEach(o => {
          if (o.status !== 'OPEN') return;
          const remaining = Number(o.amount) - Number(o.filled_amount);
          if (remaining <= 0) return;
          const p = Number(o.price);

          if (o.side === 'SELL') {
              newAsks[p] = (newAsks[p] || 0) + remaining;
          } else {
              newBids[p] = (newBids[p] || 0) + remaining;
          }
      });

      // Sort & Slice
      const sortedAsks = Object.entries(newAsks)
          .map(([p, amt]) => ({ price: parseFloat(p), amount: amt, total: parseFloat(p) * amt }))
          .sort((a, b) => a.price - b.price) // Ascending (Lowest Sell First)
          .slice(0, 15); // Top 15

      const sortedBids = Object.entries(newBids)
          .map(([p, amt]) => ({ price: parseFloat(p), amount: amt, total: parseFloat(p) * amt }))
          .sort((a, b) => b.price - a.price) // Descending (Highest Buy First)
          .slice(0, 15);

      setAsks(sortedAsks.reverse()); // Reverse for display (Highest at top)
      setBids(sortedBids);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-2 font-mono text-xs h-full flex flex-col">
      <h3 className="text-gray-400 mb-2 px-2 flex justify-between items-center">
          <span>Order Book</span>
          <span className="text-[10px] text-gray-600">{symbol}</span>
      </h3>
      
      {/* HEADER */}
      <div className="grid grid-cols-3 text-gray-500 mb-1 px-2 border-b border-white/5 pb-1">
        <div className="text-left">Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* ASKS (Sellers) - RED */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {asks.length === 0 && <div className="text-center text-gray-700 py-4">No Asks</div>}
        {asks.map((ask, i) => (
            <div key={`ask-${i}`} className="grid grid-cols-3 hover:bg-white/5 px-2 cursor-pointer group">
                <span className="text-[#FF5252] text-left group-hover:font-bold">{ask.price.toFixed(2)}</span>
                <span className="text-right text-gray-400">{ask.amount.toFixed(4)}</span>
                <span className="text-right text-gray-500">{(ask.price * ask.amount).toFixed(2)}</span>
            </div>
        ))}
      </div>

      {/* SPREAD INDICATOR */}
      <div className="py-2 text-center text-lg font-bold text-[#D4AF37] border-y border-white/10 my-1 bg-white/5">
        ${price.toFixed(2)} 
        {asks.length > 0 && bids.length > 0 && (
            <span className="text-[10px] block font-normal text-gray-500">
                Spread: ${(asks[asks.length-1].price - bids[0].price).toFixed(2)}
            </span>
        )}
      </div>

      {/* BIDS (Buyers) - GREEN */}
      <div className="flex-1 overflow-hidden">
        {bids.length === 0 && <div className="text-center text-gray-700 py-4">No Bids</div>}
        {bids.map((bid, i) => (
            <div key={`bid-${i}`} className="grid grid-cols-3 hover:bg-white/5 px-2 cursor-pointer group">
                <span className="text-[#4CAF50] text-left group-hover:font-bold">{bid.price.toFixed(2)}</span>
                <span className="text-right text-gray-400">{bid.amount.toFixed(4)}</span>
                <span className="text-right text-gray-500">{(bid.price * bid.amount).toFixed(2)}</span>
            </div>
        ))}
      </div>
    </div>
  );
}
