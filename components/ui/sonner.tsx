"use client"

import { Toaster as Sonner } from "sonner"
import type { ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "bg-black/90 backdrop-blur-md border-white/10 text-white",
          description: "text-gray-400",
          actionButton: "bg-binapex-gold text-black",
          cancelButton: "bg-white/10 text-white",
          error: "bg-red-500/20 border-red-500/50",
          success: "bg-emerald-500/20 border-emerald-500/50",
          warning: "bg-amber-500/20 border-amber-500/50",
          info: "bg-blue-500/20 border-blue-500/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
