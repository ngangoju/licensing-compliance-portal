import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive";
}

const variantClasses: Record<string, string> = {
  default: "btn-primary",
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-secondary",
  ghost: "btn-ghost",
  destructive: "btn-danger",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
