"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-binapex-gold">
              <TrendingUp className="h-5 w-5 text-binapex-dark" />
            </div>
            <span className="text-xl font-bold text-binapex-gold group-hover:text-binapex-gold-dark transition-colors">
              BINAPEX
            </span>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#markets"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Markets
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:bg-white/5 font-medium">
                  Login <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-binapex-darker border-white/10 text-foreground">
                <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-binapex-gold cursor-pointer">
                  <Link href="/login" className="cursor-pointer">
                    Trader Login
                  </Link>
                </DropdownMenuItem>
                {/* 
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/login" className="cursor-pointer text-binapex-gold">
                    Admin Portal
                  </Link>
                </DropdownMenuItem>
                */}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="bg-binapex-gold hover:bg-binapex-gold-light text-binapex-dark font-bold px-6 shadow-[0_0_15px_rgba(255,204,0,0.3)] hover:shadow-[0_0_25px_rgba(255,204,0,0.5)] transition-all">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
