"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { z } from "zod"

const ticketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  category: z.enum(["General", "Billing", "Technical"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type TicketCategory = "General" | "Billing" | "Technical"

interface TicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function TicketModal({ open, onOpenChange, userId }: TicketModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<TicketCategory>("General")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async () => {
    // Validate with Zod
    const result = ticketSchema.safeParse({ subject, category, message })

    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("tickets").insert({
        user_id: userId,
        subject,
        category: category.toLowerCase(),
        message,
        priority: "medium",
        status: "open",
      })

      if (error) throw error

      toast.success("Support ticket created successfully!")

      // Reset form
      setSubject("")
      setCategory("General")
      setMessage("")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Ticket creation error:", error)
      toast.error(error.message || "Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0A0A0A] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Support Ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-gray-400 mb-2">Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="bg-black/50 border-white/10"
              disabled={isSubmitting}
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>

          <div>
            <Label className="text-gray-400 mb-2">Category *</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TicketCategory)}>
              <SelectTrigger className="bg-black/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <Label className="text-gray-400 mb-2">Message *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={5}
              className="bg-black/50 border-white/10 resize-none"
              disabled={isSubmitting}
            />
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
