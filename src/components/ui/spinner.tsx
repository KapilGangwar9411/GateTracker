import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  className?: string
  size?: number
}

const Spinner = ({ className, size = 24 }: SpinnerProps) => {
  return (
    <Loader2 
      className={cn("animate-spin text-muted-foreground", className)}
      size={size}
    />
  )
}

export { Spinner } 