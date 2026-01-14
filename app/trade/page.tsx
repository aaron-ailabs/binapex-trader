import { createClient } from "@/lib/supabase/server"
import { BinaryOptionsInterface } from "@/components/trading/binary-options-interface"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function TradePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch initial balance server-side for immediate display
    let initialBalance = 0;
    const { data: wallets } = await supabase
        .from('wallets')
        .select('balance, locked_balance, asset')
        .eq('user_id', user.id)

    if (wallets) {
        wallets.forEach(w => {
            if (w.asset === 'USD' || w.asset === 'USDT') {
                initialBalance += Number(w.balance) - Number(w.locked_balance || 0)
            }
        })
    }

    return (
        <main className="min-h-screen bg-black text-white pb-20 md:pb-0">
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader2 className="animate-spin text-amber-500" /></div>}>
                <BinaryOptionsInterface initialBalance={initialBalance} />
            </Suspense>
        </main>
    )
}
