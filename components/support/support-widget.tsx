"use client"

import { useSupportChat } from "@/hooks/use-support-chat"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MessageCircle, X } from "lucide-react"
import { ChatMessageList } from "./chat-message-list"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"

export function SupportWidget() {
    const { messages, isLoading, isSending, sendMessage, isOpen, setIsOpen } = useSupportChat()

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    size="icon"
                    className={cn(
                        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-105",
                        isOpen ? "hidden" : "flex"
                    )}
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 flex flex-col gap-0 h-[100dvh]">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Support Chat</SheetTitle>
                        {/* Close handled by X in SheetContent default, but we can have custom header actions here if needed */}
                    </div>
                </SheetHeader>

                <ChatMessageList messages={messages} isLoading={isLoading} />

                <ChatInput onSend={sendMessage} disabled={isSending || isLoading} />
            </SheetContent>
        </Sheet>
    )
}
