import { useState, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendIcon, Loader2 } from "lucide-react"

interface ChatInputProps {
    onSend: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("")

    const handleSend = () => {
        if (!input.trim() || disabled) return
        onSend(input)
        setInput("")
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="p-4 border-t bg-background flex gap-2 items-end">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="min-h-[60px] resize-none"
                disabled={disabled}
            />
            <Button
                onClick={handleSend}
                disabled={disabled || !input.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
            >
                {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
            </Button>
        </div>
    )
}
