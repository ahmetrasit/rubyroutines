import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-ring",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring",
      ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-ring",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-ring",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm touch-target",
      md: "px-4 py-2 text-base touch-target",
      lg: "px-6 py-3 text-lg touch-target-lg",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
