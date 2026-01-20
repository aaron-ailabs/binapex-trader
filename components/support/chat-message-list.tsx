import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Database } from "@/types/supabase"

type Message = Database["public"]["Tables"]["support_messages"]["Row"]

interface ChatMessageListProps {
    messages: Message[]
    isLoading?: boolean
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Connecting to support...
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <p>👋 Need help?</p>
                <p>Send us a message and an agent will reply shortly.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
                {messages.map((msg) => {
                    const isAdmin = msg.sender_role === "ADMIN"
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full gap-2",
                                isAdmin ? "flex-row" : "flex-row-reverse"
                            )}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className={isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                    {isAdmin ? "SP" : "ME"}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                    "rounded-lg px-4 py-2 max-w-[80%] text-sm",
                                    isAdmin
                                        ? "bg-muted text-foreground"
                                        : "bg-primary text-primary-foreground"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    )
}
