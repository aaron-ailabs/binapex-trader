'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function UserDashboard({ symbol }: { symbol?: string }) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      // Query limit_orders and join trading_pairs to get symbol
      const { data } = await supabase
        .from('limit_orders')
        .select(`
          *,
          trading_pairs (
            symbol
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (data) setOrders(data);
    };
    
    fetchOrders(); // Initial fetch
    
    // Realtime subscription
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'limit_orders',
        },
        (payload) => {
           // New order received
           fetchOrders()
        }
      )
      .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'limit_orders',
        },
        (payload) => {
            fetchOrders()
        }
      )
      .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, []);

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 font-mono text-sm mt-4">
      <h3 className="text-[#D4AF37] font-bold mb-4">My Orders</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-gray-400">
          <thead className="text-xs uppercase bg-white/5 text-gray-200">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Side</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Filled</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => {
              const pairSymbol = order.trading_pairs?.symbol || '---';
              const amountUSD = (Number(order.price) * Number(order.amount)).toFixed(2);
              
              return (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2">{new Date(order.created_at).toLocaleTimeString()}</td>
                  <td className="px-4 py-2 font-bold text-white">{pairSymbol}</td>
                  <td className={`px-4 py-2 ${order.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                      {order.side.toUpperCase()}
                  </td>
                  <td className="px-4 py-2">${Number(order.price).toFixed(2)}</td>
                  <td className="px-4 py-2">{Number(order.amount).toFixed(6)}</td>
                  <td className="px-4 py-2">{Number(order.filled_amount).toFixed(6)}</td>
                  <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                          order.status === 'filled' ? 'bg-green-500/10 text-green-500' : 
                          order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                      }`}>
                          {order.status.toUpperCase()}
                      </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {orders.length === 0 && <div className="text-center py-4 text-gray-600">No trading history found.</div>}
      </div>
    </div>
  );
}
