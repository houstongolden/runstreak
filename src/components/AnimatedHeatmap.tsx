import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedHeatmap() {
  const [activeSquares, setActiveSquares] = useState<Map<number, number>>(new Map());
  
  // Generate 12 columns (weeks) × 7 rows (days) = 84 squares
  const totalColumns = 12;
  const totalRows = 7;
  
  useEffect(() => {
    let currentColumn = 0;
    let currentRow = 0;
    
    const interval = setInterval(() => {
      setActiveSquares(prev => {
        const next = new Map(prev);
        const squareIndex = currentColumn * totalRows + currentRow;
        
        // Randomly assign distance (0 = missed, 1-2 = light orange, 3-5 = medium, 6+ = dark)
        const distances = [0, 0, 1.5, 2.5, 4, 5.5, 7]; // Some missed days, some runs
        const randomDistance = distances[currentRow];
        next.set(squareIndex, randomDistance);
        
        currentRow++;
        
        // Move to next column after completing 7 rows
        if (currentRow >= totalRows) {
          currentRow = 0;
          currentColumn++;
          
          // Reset animation after all columns are filled
          if (currentColumn >= totalColumns) {
            setTimeout(() => {
              setActiveSquares(new Map());
              currentColumn = 0;
              currentRow = 0;
            }, 1000);
          }
        }
        
        return next;
      });
    }, 80); // Light up a square every 80ms (column by column)
    
    return () => clearInterval(interval);
  }, []);
  
  const getIntensityClass = (distance: number) => {
    if (distance === 0) return "bg-muted/20"; // Missed day - gray
    if (distance < 2) return "bg-[hsl(25_80%_85%)]"; // Very light orange (1 mile)
    if (distance < 4) return "bg-[hsl(25_90%_70%)]"; // Light orange (2-3 miles)
    if (distance < 6) return "bg-[hsl(22_95%_60%)]"; // Medium orange (4-5 miles)
    return "bg-[hsl(15_100%_45%)]"; // Dark orange (6+ miles)
  };
  
  return (
    <div className="w-full">
      <div className="grid gap-1.5" style={{ 
        gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`
      }}>
        {Array.from({ length: totalColumns * totalRows }).map((_, i) => {
          const distance = activeSquares.get(i);
          const isActive = distance !== undefined;
          
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-sm transition-all duration-300",
                isActive 
                  ? `${getIntensityClass(distance)} shadow-sm scale-100` 
                  : "bg-muted/30 scale-90"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
