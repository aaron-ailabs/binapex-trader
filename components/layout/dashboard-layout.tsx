"use client"

import type React from "react"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { UserNotificationBell } from "@/components/notifications/user-notification-bell"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  HeadphonesIcon,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Trade", href: "/trade", icon: TrendingUp },
  { name: "Deposit", href: "/deposit", icon: ArrowDownToLine },
  { name: "Withdrawal", href: "/withdrawal", icon: ArrowUpFromLine },
  { name: "History", href: "/history", icon: History },
  { name: "Support", href: "/support", icon: HeadphonesIcon },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

import { motion, AnimatePresence } from "framer-motion"

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("bonus_balance, wallets(balance, asset)")
        .eq("id", user.id)
        .single()

      if (profile) {
        const wallets = profile.wallets as { asset: string; balance: number }[] | null
        const walletBal = wallets?.reduce((acc, curr) => {
          if (curr.asset === "USD" || curr.asset === "USDT") {
            return acc + Number(curr.balance)
          }
          return acc
        }, 0) || 0

        const bonusBal = Number(profile.bonus_balance ?? 0)
        setBalance(walletBal + bonusBal)
      }
    }

    fetchBalance()
    const handleWalletUpdate = () => fetchBalance()
    window.addEventListener('wallet_update', handleWalletUpdate)
    return () => window.removeEventListener('wallet_update', handleWalletUpdate)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-black/60 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Logo layout="horizontal" width={32} height={32} />
          </motion.div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto content-start">
          {SIDEBAR_ITEMS.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <motion.div
                key={item.href}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div
                    className={cn(
                      "group relative flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-medium overflow-hidden",
                      isActive
                        ? "text-[#EBD062] bg-[#EBD062]/10 shadow-[0_0_20px_rgba(235,208,98,0.05)] border border-[#EBD062]/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-[#EBD062]" : "")} />
                    <span className="tracking-wide">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicatorTrader"
                        className="absolute left-0 w-1.5 h-6 bg-[#EBD062] rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="p-6 space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 glass-morphism relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#EBD062]/5 blur-2xl rounded-full -translate-y-12 translate-x-12 group-hover:bg-[#EBD062]/10 transition-colors" />
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1.5">Total Assets</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-[#EBD062]">$</span>
              <span className="text-2xl font-bold tracking-tight text-white">
                {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
          </motion.div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start h-12 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={20} className="mr-3 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium tracking-wide">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#050505]">
        {/* Header */}
        <header className="sticky top-0 z-40 h-20 px-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <Logo layout="icon" width={28} height={28} />
            </div>
            <h2 className="text-lg font-semibold text-white/90 hidden md:block">
              {SIDEBAR_ITEMS.find(i => pathname.startsWith(i.href))?.name || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-white/5 border border-white/10">
              <UserNotificationBell />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/5 md:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-6 md:p-10 max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
