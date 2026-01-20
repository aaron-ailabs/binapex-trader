import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Database } from "@/types/supabase"
import { toast } from "sonner"

type Message = Database["public"]["Tables"]["support_messages"]["Row"]

export function useSupportChat() {
    const { user } = useAuth()
    const supabase = createClient()

    const [conversationId, setConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // 1. Initialize Conversation
    useEffect(() => {
        if (!user || !isOpen) return

        const initChat = async () => {
            try {
                setIsLoading(true)

                // Get or Create ID
                const { data: convId, error: rpcError } = await supabase.rpc("get_or_create_support_conversation")

                if (rpcError) throw rpcError
                if (!convId) throw new Error("No conversation ID returned")

                setConversationId(convId)

                // Load History
                const { data: history, error: historyError } = await supabase
                    .from("support_messages")
                    .select("*")
                    .eq("conversation_id", convId)
                    .order("created_at", { ascending: true })

                if (historyError) throw historyError

                setMessages(history || [])
                setTimeout(scrollToBottom, 100)

            } catch (err) {
                console.error("Chat init error:", err)
                toast.error("Failed to load support chat")
            } finally {
                setIsLoading(false)
            }
        }

        initChat()
    }, [user, isOpen])

    // 2. Realtime Subscription
    useEffect(() => {
        if (!conversationId) return

        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "support_messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message
                    setMessages((prev) => [...prev, newMessage])
                    setTimeout(scrollToBottom, 100)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId])

    // 3. Send Message
    const sendMessage = async (content: string) => {
        if (!content.trim() || !conversationId) return

        try {
            setIsSending(true)

            const { error } = await supabase.rpc("send_support_message", {
                p_conversation_id: conversationId,
                p_content: content.trim()
            })

            if (error) throw error

            // Realtime will handle the update
        } catch (err) {
            console.error("Send error:", err)
            toast.error("Failed to send message")
        } finally {
            setIsSending(false)
        }
    }

    return {
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        isSending,
        sendMessage,
        messagesEndRef
    }
}
