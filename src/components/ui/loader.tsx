import React from 'react';
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const loaderVariants = cva(
  "relative flex items-center justify-center", 
  {
    variants: {
      variant: {
        default: "",
        primary: "",
        minimal: ""
      },
      size: {
        default: "h-screen w-full",
        sm: "h-64 w-full",
        lg: "h-[80vh] w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof loaderVariants> {
  text?: string;
  logo?: boolean;
}

const Loader = ({
  className,
  variant,
  size,
  text = "Loading your experience...",
  logo = true,
  ...props
}: LoaderProps) => {
  return (
    <div
      className={cn(loaderVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {logo && (
          <div className="relative w-24 h-24 mb-4">
            {/* Logo container with pulse effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse opacity-75 blur-md"></div>
            
            {/* Add your actual logo here */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/logos/Gate.png" 
                alt="GATE Tracker" 
                className="w-16 h-16 object-contain relative z-10"
              />
            </div>
          </div>
        )}
        
        {/* Main loader animation */}
        <div className="relative">
          {/* Background track */}
          <div className="h-2 w-48 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Gradient animated loader bar */}
            <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar"></div>
          </div>
          
          {/* Additional decorative elements */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-500 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
        </div>
        
        {/* Loading text */}
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Preparing your dashboard</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-indigo-500 rounded-full animate-float opacity-70"></div>
          <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-purple-500 rounded-full animate-float opacity-70" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-pink-500 rounded-full animate-float opacity-70" style={{ animationDelay: "0.5s" }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-float opacity-70" style={{ animationDelay: "1.5s" }}></div>
        </div>
      </div>
    </div>
  );
};

export { Loader, type LoaderProps }; 