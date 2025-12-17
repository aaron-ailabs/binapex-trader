'use client';
import { useEffect, useState } from 'react';

// Random noise generator for "Simulated" Order Book
const generateBook = (price: number) => {
    const asks = Array.from({length: 8}, (_, i) => ({
        price: price * (1 + (i + 1) * 0.0005),
        amount: Math.random() * 2,
        total: 0 // calc later
    })).reverse();
    
    const bids = Array.from({length: 8}, (_, i) => ({
        price: price * (1 - (i + 1) * 0.0005),
        amount: Math.random() * 2,
        total: 0
    }));
    return { asks, bids };
};

interface OrderBookEntry {
    price: number
    amount: number
    total: number
}

export function OrderBook({ price }: { price: number }) {
  const [book, setBook] = useState<{asks: OrderBookEntry[], bids: OrderBookEntry[]}>({asks: [], bids: []});

  useEffect(() => {
    if (price > 0) {
        setBook(generateBook(price)); // Initial set
        const interval = setInterval(() => {
            setBook(generateBook(price));
        }, 2000); // Update every 2s to look "alive"
        return () => clearInterval(interval);
    }
  }, [price]);

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-2 font-mono text-xs h-full flex flex-col">
      <h3 className="text-gray-400 mb-2 px-2">Order Book</h3>
      
      {/* HEADER */}
      <div className="grid grid-cols-3 text-gray-500 mb-1 px-2">
        <div className="text-left">Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* ASKS (Sellers) - RED */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {book.asks.map((ask, i) => (
            <div key={i} className="grid grid-cols-3 hover:bg-white/5 px-2 cursor-pointer">
                <span className="text-[#FF5252] text-left">{ask.price.toFixed(2)}</span>
                <span className="text-right text-gray-400">{ask.amount.toFixed(4)}</span>
                <span className="text-right text-gray-500">{(ask.price * ask.amount).toFixed(2)}</span>
            </div>
        ))}
      </div>

      {/* SPREAD */}
      <div className="py-2 text-center text-lg font-bold text-[#D4AF37] border-y border-white/10 my-1 bg-white/5">
        ${price.toFixed(2)} <span className="text-xs text-gray-500 font-normal">≈ ${price.toFixed(2)}</span>
      </div>

      {/* BIDS (Buyers) - GREEN/GOLD */}
      <div className="flex-1 overflow-hidden">
        {book.bids.map((bid, i) => (
            <div key={i} className="grid grid-cols-3 hover:bg-white/5 px-2 cursor-pointer">
                <span className="text-[#4CAF50] text-left">{bid.price.toFixed(2)}</span>
                <span className="text-right text-gray-400">{bid.amount.toFixed(4)}</span>
                <span className="text-right text-gray-500">{(bid.price * bid.amount).toFixed(2)}</span>
            </div>
        ))}
      </div>
    </div>
  );
}
