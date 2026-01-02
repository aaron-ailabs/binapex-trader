import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string
    layout?: "horizontal" | "vertical" | "icon"
    width?: number
    height?: number
    // Legacy support
    variant?: "full" | "icon"
}

export function Logo({ className, layout = "horizontal", variant, width, height }: LogoProps) {
    // Map legacy variant to layout
    const activeLayout = variant === "icon" ? "icon" : layout

    const styles = {
        horizontal: {
            width: width || 40, // Icon size
            height: height || 40,
            textSize: "text-xl",
            container: "flex-row gap-3"
        },
        vertical: {
            width: width || 120, // Full visual size
            height: height || 120,
            textSize: "text-2xl mt-4",
            container: "flex-col"
        },
        icon: {
            width: width || 40,
            height: height || 40,
            textSize: "hidden",
            container: ""
        }
    }[activeLayout]

    return (
        <Link
            href="/"
            className={cn(
                "flex items-center justify-center hover:opacity-90 transition-opacity select-none",
                styles.container,
                className
            )}
        >
            <div className="relative flex items-center justify-center">
                <Image
                    src={activeLayout === "vertical" ? "/logo-vertical.png" : "/logo-icon-only.png"}
                    alt="Binapex Logo"
                    width={styles.width}
                    height={styles.height}
                    className={cn(
                        "object-contain",
                        activeLayout === "vertical" ? "w-full h-full" : "w-auto h-auto"
                    )}
                    priority
                    style={{
                        width: styles.width,
                        height: styles.height
                    }}
                />
            </div>

            {activeLayout !== "vertical" && activeLayout !== "icon" && (
                <span className={cn(
                    "font-bold text-[#EBD062] tracking-wide font-sans leading-none",
                    styles.textSize
                )}>
                    BINAPEX
                </span>
            )}
        </Link>
    )
}
