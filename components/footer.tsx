import Link from "next/link"
import { TrendingUp, Twitter, Github, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-binapex-darker">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-binapex-gold">
                <TrendingUp className="h-5 w-5 text-binapex-dark" />
              </div>
              <span className="text-xl font-bold text-binapex-gold">BINAPEX</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Binapex is a professional multi-asset trading platform for Malaysian traders to access crypto, forex, stocks, and commodities worldwide.
            </p>
          </div>

          {/* Markets */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Markets</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Cryptocurrency
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Forex
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Stocks
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Commodities
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Legal
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-binapex-gold transition-colors">
                  API Docs
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-sm text-binapex-gold hover:text-binapex-gold-dark transition-colors font-medium"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Binapex. All rights reserved.</p>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-binapex-gold transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-binapex-gold transition-colors">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-binapex-gold transition-colors">
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
