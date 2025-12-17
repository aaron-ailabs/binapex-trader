"use client"

import type React from "react"

import { useState } from "react"
import { TicketModal } from "./ticket-modal"

interface TicketModalTriggerProps {
  userId: string
  children: (openModal: () => void) => React.ReactNode
}

export function TicketModalTrigger({ userId, children }: TicketModalTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {children(() => setOpen(true))}
      <TicketModal open={open} onOpenChange={setOpen} userId={userId} />
    </>
  )
}
