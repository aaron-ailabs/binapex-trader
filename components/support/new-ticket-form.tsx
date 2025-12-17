"use client"

import type React from "react"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"

interface NewTicketFormProps {
  userId: string
}

type TicketCategory = "verification" | "deposit" | "withdrawal" | "technical" | "other"
type TicketPriority = "low" | "medium" | "high" | "urgent"

export function NewTicketForm({ userId }: NewTicketFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState<TicketCategory>("technical")
  const [priority, setPriority] = useState<TicketPriority>("medium")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }
      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Only image files are allowed")
        return
      }
      setFile(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      let attachmentUrl: string | null = null

      if (file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${userId}_${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("ticket-attachments")
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("ticket-attachments").getPublicUrl(fileName)
        attachmentUrl = publicUrl
      }

      const { error } = await supabase.from("tickets").insert({
        user_id: userId,
        subject,
        category,
        message,
        priority,
        status: "open",
        attachment_url: attachmentUrl,
      })

      if (error) throw error

      toast.success("Support ticket created successfully")
      setSubject("")
      setMessage("")
      setCategory("technical")
      setPriority("medium")
      setFile(null)
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Ticket creation error:", error)
      toast.error(error.message || "Failed to create ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold mb-4">Submit a Ticket</h3>
      <div className="space-y-4">
        <div>
          <Label className="text-gray-400 mb-2">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            className="bg-black/50 border-white/10"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2">Category</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as TicketCategory)}>
            <SelectTrigger className="bg-black/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verification">Account Verification</SelectItem>
              <SelectItem value="deposit">Deposit Issue</SelectItem>
              <SelectItem value="withdrawal">Withdrawal Issue</SelectItem>
              <SelectItem value="technical">Technical Support</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-400 mb-2">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as TicketPriority)}>
            <SelectTrigger className="bg-black/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-400 mb-2">Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue in detail..."
            rows={6}
            className="bg-black/50 border-white/10 resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2">Attachment (Optional)</Label>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#F59E0B]/50 transition-colors bg-black/30">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">Click to upload receipt or screenshot</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-black/50 border border-white/10 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={removeFile}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-bold"
        >
          {isSubmitting ? "Submitting..." : "Submit Ticket"}
        </Button>
      </div>
    </GlassCard>
  )
}
