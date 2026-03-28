import { forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-responsive-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-touch touch-action-manipulation select-none",
  {
    variants: {
      variant: {
        default:
          "btn-3d bg-primary text-primary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_1px_0_0_hsl(0_70%_35%),0_4px_8px_-2px_hsl(0_84%_55%/0.40),inset_0_1px_0_hsl(0_0%_100%/0.15)] hover:shadow-[0_1px_0_0_hsl(0_70%_30%),0_6px_14px_-2px_hsl(0_84%_55%/0.50),inset_0_1px_0_hsl(0_0%_100%/0.20)] hover:-translate-y-px active:translate-y-px active:shadow-[inset_0_2px_4px_hsl(0_70%_25%/0.25)] transition-all duration-150",
        outline:
          "border-2 border-primary/30 bg-background text-primary hover:bg-primary/6 hover:border-primary/50 shadow-[0_1px_3px_-1px_hsl(var(--border)/0.60)] hover:shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.15)] hover:-translate-y-px active:translate-y-px transition-all duration-150",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_1px_0_0_hsl(var(--border)),0_2px_6px_-2px_hsl(var(--foreground)/0.08),inset_0_1px_0_hsl(0_0%_100%/0.60)] hover:shadow-[0_1px_0_0_hsl(var(--border)),0_4px_10px_-2px_hsl(var(--foreground)/0.12),inset_0_1px_0_hsl(0_0%_100%/0.70)] hover:-translate-y-px active:translate-y-px transition-all duration-150",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground active:scale-95 transition-all duration-150",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 sm:h-10 px-5 py-2 text-base sm:text-sm",
        sm:      "h-10 sm:h-9 rounded-md px-3 text-sm",
        lg:      "h-12 sm:h-11 rounded-md px-8 text-base",
        icon:    "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
