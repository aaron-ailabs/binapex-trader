"use client"

import * as React from "react"
import { Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-mobile"
import { createClient } from "@/lib/supabase/client"

export interface TradingPair {
  id: string
  symbol: string
  display_name: string
  asset_type: "forex" | "stock" | "commodity" | "crypto"
  base_asset: string
  quote_asset: string
  is_active: boolean
}

import { Tables } from "@/types/supabase"

interface AssetSelectorProps {
  selectedAsset: Tables<"assets"> | null
  onSelectAsset: (asset: Tables<"assets">) => void
}

const ASSET_TYPE_COLORS = {
  forex: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  stock: "bg-green-500/10 text-green-500 border-green-500/20",
  commodity: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  crypto: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

const ASSET_TYPE_LABELS = {
  forex: "Forex",
  stock: "Stock",
  commodity: "Commodity",
  crypto: "Crypto",
}

export function AssetSelector({ selectedAsset, onSelectAsset }: AssetSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [assets, setAssets] = React.useState<Tables<"assets">[]>([])
  const supabase = createClient()

  React.useEffect(() => {
    const fetchAssets = async () => {
        const { data } = await supabase.from('assets').select('*').eq('is_active', true)
        if (data) setAssets(data)
    }
    fetchAssets()
  }, [supabase])

  // Group assets by type
  const groupedAssets = React.useMemo(() => {
    const groups: Record<string, any[]> = {
      forex: [],
      stock: [],
      commodity: [],
      crypto: [],
    }

    assets.forEach((asset) => {
      if (groups[asset.type]) {
        groups[asset.type].push(asset)
      }
    })

    return groups
  }, [assets])

  const TriggerButton = React.forwardRef<HTMLButtonElement, { onClick?: () => void }>(({ onClick, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between bg-card"
      onClick={onClick}
      {...props}
    >
      {selectedAsset ? (
        <div className="flex items-center gap-2 overflow-hidden">
          <Badge variant="outline" className={cn("text-xs shrink-0", ASSET_TYPE_COLORS[selectedAsset.type as keyof typeof ASSET_TYPE_COLORS])}>
            {ASSET_TYPE_LABELS[selectedAsset.type as keyof typeof ASSET_TYPE_LABELS]}
          </Badge>
          <span className="font-mono font-semibold shrink-0">{selectedAsset.symbol}</span>
          <span className="text-muted-foreground text-sm truncate hidden sm:inline">{selectedAsset.name}</span>
        </div>
      ) : (
        "Select asset..."
      )}
      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  ))
  TriggerButton.displayName = "TriggerButton"

  const CommandContent = () => (
    <Command>
      <CommandInput placeholder="Search assets..." />
      <CommandList>
        <CommandEmpty>No assets found.</CommandEmpty>

        {Object.entries(groupedAssets).map(([type, typeAssets]) => {
          if (typeAssets.length === 0) return null

          return (
            <CommandGroup
              key={type}
              heading={
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", ASSET_TYPE_COLORS[type as keyof typeof ASSET_TYPE_COLORS])}
                  >
                    {ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS]}
                  </Badge>
                  <span className="text-muted-foreground">({typeAssets.length})</span>
                </div>
              }
            >
              {typeAssets.map((asset) => (
                <CommandItem
                  key={asset.id}
                  value={`${asset.symbol} ${asset.name}`}
                  onSelect={() => {
                    onSelectAsset(asset)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedAsset?.id === asset.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-mono font-semibold">{asset.symbol}</span>
                    <span className="text-muted-foreground text-sm">{asset.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </Command>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <TriggerButton />
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Select Trading Asset</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <CommandContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TriggerButton />
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] max-w-[500px] p-0" align="start">
        <CommandContent />
      </PopoverContent>
    </Popover>
  )
}
