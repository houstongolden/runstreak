import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedHeatmap() {
  const [activeSquares, setActiveSquares] = useState<Set<number>>(new Set());
  
  // Generate 12 months × 7 days = 84 squares
  const totalSquares = 84;
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setActiveSquares(prev => {
        const next = new Set(prev);
        next.add(currentIndex);
        currentIndex++;
        
        // Reset animation after all squares are lit
        if (currentIndex >= totalSquares) {
          setTimeout(() => {
            setActiveSquares(new Set());
            currentIndex = 0;
          }, 1000);
        }
        
        return next;
      });
    }, 50); // Light up a square every 50ms
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="w-full bg-card/60 backdrop-blur-[40px] border-0 rounded-lg p-6">
      <h4 className="text-sm font-semibold mb-4 text-foreground">Activity Heatmap</h4>
      <div className="grid grid-cols-12 gap-1.5">
        {Array.from({ length: totalSquares }).map((_, i) => {
          const isActive = activeSquares.has(i);
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-sm transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-primary to-orange-500 shadow-sm shadow-primary/30 scale-100" 
                  : "bg-muted/30 scale-90"
              )}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Visual tracking of your daily running consistency
      </p>
    </div>
  );
}
