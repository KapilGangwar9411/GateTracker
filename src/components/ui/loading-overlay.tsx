import React from 'react';
import { Loader } from './loader';
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
  fullPage?: boolean;
  transparent?: boolean;
}

const LoadingOverlay = ({
  isLoading,
  text,
  children,
  className,
  blur = true,
  fullPage = false,
  transparent = false,
}: LoadingOverlayProps) => {
  return (
    <div className={cn("relative", className)}>
      {children}
      
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center z-50 transition-all duration-300",
            fullPage ? "fixed" : "absolute",
            transparent ? "bg-transparent" : "bg-background/80",
            blur && "backdrop-blur-sm"
          )}
        >
          <Loader 
            size="sm"
            text={text}
            logo={fullPage}
            className={cn(
              "bg-transparent",
              !fullPage && "scale-75"
            )}
          />
        </div>
      )}
    </div>
  );
};

export { LoadingOverlay }; 