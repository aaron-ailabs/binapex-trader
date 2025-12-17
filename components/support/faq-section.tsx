"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    question: "How do I deposit funds?",
    answer:
      "Navigate to the Deposit page, select your payment method, enter the amount, and follow the instructions. Deposits are typically processed within 24 hours.",
  },
  {
    question: "How long does withdrawal take?",
    answer:
      "Withdrawals are processed within 1-3 business days depending on your bank. You'll receive a notification once your withdrawal is approved.",
  },
  {
    question: "What are the trading fees?",
    answer: "We charge 0.6% for buy orders and 1.1% for sell orders. There are no hidden fees.",
  },
  {
    question: "How do I verify my account?",
    answer:
      "Go to Settings > KYC Verification and upload your ID document and proof of address. Verification usually takes 24-48 hours.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We use bank-level encryption and follow industry best practices to protect your data and funds.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <GlassCard key={index} className="overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <span className="font-semibold text-white">{faq.question}</span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/10 pt-4">
              {faq.answer}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  )
}
