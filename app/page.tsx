import { Navbar } from "@/components/navbar"
import { Ticker } from "@/components/ticker"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Ticker />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
