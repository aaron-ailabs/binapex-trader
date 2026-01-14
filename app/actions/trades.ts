'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export type Trade = Database['public']['Tables']['orders']['Row'];

export async function getActiveTrades(): Promise<{ data: Trade[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'OPEN')
    .eq('type', 'binary')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active trades:', error);
    return { data: null, error: 'Failed to fetch active trades' };
  }

  return { data, error: null };
}

export async function getTradeHistory(): Promise<{ data: Trade[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['WIN', 'LOSS'])
    .eq('type', 'binary')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching trade history:', error);
    return { data: null, error: 'Failed to fetch trade history' };
  }

  return { data, error: null };
}

export async function getOpenLimitOrders(): Promise<{ data: any[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('limit_orders')
    .select('*, trading_pairs(symbol)')
    .eq('user_id', user.id)
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching limit orders:', error);
    return { data: null, error: 'Failed to fetch limit orders' };
  }

  return { data, error: null };
}
