import { useEffect, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Runner {
  rank: number;
  name: string;
  streak: number;
  avatar: string;
}

export function AnimatedLeaderboard() {
  const [runners, setRunners] = useState<Runner[]>([
    { rank: 1, name: "Sarah M.", streak: 145, avatar: "🏃‍♀️" },
    { rank: 2, name: "Mike T.", streak: 128, avatar: "🏃‍♂️" },
    { rank: 3, name: "You", streak: 95, avatar: "🔥" },
  ]);
  
  useEffect(() => {
    // Animate the user climbing the leaderboard
    const timeout1 = setTimeout(() => {
      setRunners([
        { rank: 1, name: "Sarah M.", streak: 145, avatar: "🏃‍♀️" },
        { rank: 2, name: "You", streak: 129, avatar: "🔥" },
        { rank: 3, name: "Mike T.", streak: 128, avatar: "🏃‍♂️" },
      ]);
    }, 2000);
    
    const timeout2 = setTimeout(() => {
      setRunners([
        { rank: 1, name: "You", streak: 146, avatar: "🔥" },
        { rank: 2, name: "Sarah M.", streak: 145, avatar: "🏃‍♀️" },
        { rank: 3, name: "Mike T.", streak: 128, avatar: "🏃‍♂️" },
      ]);
    }, 4000);
    
    const timeout3 = setTimeout(() => {
      setRunners([
        { rank: 1, name: "Sarah M.", streak: 145, avatar: "🏃‍♀️" },
        { rank: 2, name: "Mike T.", streak: 128, avatar: "🏃‍♂️" },
        { rank: 3, name: "You", streak: 95, avatar: "🔥" },
      ]);
    }, 6000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);
  
  return (
    <div className="w-full bg-card/60 backdrop-blur-[40px] border-0 rounded-lg p-6">
      <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        Live Leaderboard
      </h4>
      <div className="space-y-3">
        {runners.map((runner, index) => (
          <div
            key={runner.name}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all duration-500",
              runner.name === "You" 
                ? "bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20" 
                : "bg-muted/20"
            )}
            style={{
              transform: `translateY(${index * 0}px)`,
            }}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              runner.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900" :
              runner.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900" :
              "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900"
            )}>
              {runner.rank}
            </div>
            <div className="text-2xl">{runner.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold truncate",
                runner.name === "You" ? "text-primary" : "text-foreground"
              )}>
                {runner.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-primary">{runner.streak}</span>
              <span className="text-xs text-muted-foreground">days</span>
              {runner.name === "You" && runner.rank < 3 && (
                <TrendingUp className="h-4 w-4 text-primary ml-1 animate-bounce" />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Compete with runners worldwide
      </p>
    </div>
  );
}
