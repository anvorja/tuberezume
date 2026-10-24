import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap transition-[transform,background-color,color,border-color,box-shadow] duration-300 ease-out-expo outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-signal text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_30px_-12px_color-mix(in_oklch,var(--signal)_70%,transparent)] hover:brightness-105",
        outline:
          "border-input bg-surface text-foreground backdrop-blur-md hover:border-signal-ink/60 hover:bg-surface-raised",
        secondary: "bg-surface-raised text-foreground hover:bg-surface-raised/80",
        ghost: "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
        destructive:
          "bg-destructive/12 text-destructive hover:bg-destructive/20",
        link: "text-signal-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-sm",
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-[0.95rem]",
        icon: "size-11",
        "icon-xs": "size-8",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
