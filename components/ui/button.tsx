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
      default: "bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500",
      secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500",
      outline: "border border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500",
      ghost: "hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
      danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
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
