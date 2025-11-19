import { useEffect, useState } from "react";

interface ScanningAnimationProps {
  messages?: string[];
  messageInterval?: number;
  mockupInterval?: number;
  className?: string;
}

export function ScanningAnimation({ 
  messages = [
    "Scanning your activities...",
    "Crunching the numbers...",
    "Analyzing your position on the leaderboard...",
    "Calculating your streak...",
  ],
  messageInterval = 6000,
  mockupInterval = 8000,
  className = ""
}: ScanningAnimationProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [mockupIndex, setMockupIndex] = useState(0);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, messageInterval);

    return () => clearInterval(interval);
  }, [messages.length, messageInterval]);

  // Rotate mockups
  useEffect(() => {
    const interval = setInterval(() => {
      setMockupIndex((prev) => (prev + 1) % 2);
    }, mockupInterval);

    return () => clearInterval(interval);
  }, [mockupInterval]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Animated Message */}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground font-instrument animate-fade-in">
          {messages[messageIndex]}
        </p>
      </div>

      {/* Visual Mockup with Scanning Animation */}
      <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-muted/30 p-4 h-48">
        {mockupIndex === 0 ? (
          // Activity Heatmap Mockup
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-instrument mb-3">Activity Map</p>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-6 w-6 rounded ${
                    i % 4 === 0 ? 'bg-primary/60' : 
                    i % 3 === 0 ? 'bg-primary/40' : 
                    i % 2 === 0 ? 'bg-primary/20' : 
                    'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          // Leaderboard Mockup
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-instrument mb-3">Leaderboard Preview</p>
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                <span className="text-xs font-bold text-muted-foreground w-6">#{rank}</span>
                <div className="h-6 w-6 rounded-full bg-primary/40" />
                <div className="h-3 flex-1 bg-muted rounded" />
                <div className="h-3 w-12 bg-primary/60 rounded" />
              </div>
            ))}
          </div>
        )}
        
        {/* Scanning Bar Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
