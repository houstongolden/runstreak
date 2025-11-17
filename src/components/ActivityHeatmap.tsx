import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DailyActivity {
  activity_date: string;
  distance: number;
  run_count: number;
}

interface ActivityHeatmapProps {
  runnerId: string;
}

export default function ActivityHeatmap({ runnerId }: ActivityHeatmapProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch last 365 days of activities
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const { data, error } = await (supabase as any)
          .from("daily_activities")
          .select("activity_date, distance, run_count")
          .eq("runner_id", runnerId)
          .gte("activity_date", oneYearAgo.toISOString().split("T")[0])
          .order("activity_date", { ascending: true });

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [runnerId]);

  useEffect(() => {
    // Auto-scroll to show current date
    if (scrollContainerRef.current && !isLoading) {
      const container = scrollContainerRef.current;
      // Scroll to the right (current date)
      container.scrollLeft = container.scrollWidth - container.clientWidth;
    }
  }, [isLoading]);

  const generateHeatmapData = () => {
    const weeks: Array<Array<{ date: Date; distance: number; runCount: number } | null>> = [];
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Create a map of activities by date for quick lookup
    const activityMap = new Map();
    activities.forEach(activity => {
      activityMap.set(activity.activity_date, {
        distance: activity.distance,
        runCount: activity.run_count,
      });
    });

    // Start from the Sunday of the week one year ago
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: Array<{ date: Date; distance: number; runCount: number } | null> = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const activityData = activityMap.get(dateStr);
      
      currentWeek.push({
        date: new Date(currentDate),
        distance: activityData?.distance || 0,
        runCount: activityData?.runCount || 0,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add any remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const getIntensityClass = (distance: number) => {
    if (distance === 0) return "bg-muted/20"; // No activity - light gray
    if (distance < 2) return "bg-[hsl(25_80%_85%)]"; // Very light orange
    if (distance < 4) return "bg-[hsl(25_90%_70%)]"; // Light orange
    if (distance < 6) return "bg-[hsl(22_95%_60%)]"; // Medium orange
    if (distance < 8) return "bg-[hsl(20_100%_52%)]"; // Dark orange
    return "bg-[hsl(15_100%_45%)]"; // Darkest orange for 8+ miles
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Activity Heatmap</h3>
        <div className="bg-card rounded-lg p-3 border">
          <div className="text-muted-foreground text-sm">Loading activity data...</div>
        </div>
      </div>
    );
  }

  const heatmapData = generateHeatmapData();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="w-full min-w-0 max-w-[350px]">
      <h3 className="text-sm font-semibold mb-3">Activity Heatmap</h3>
      <div className="bg-card rounded-lg p-4 sm:p-5 border overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
          <div className="inline-block max-w-full">
            {/* Month labels */}
            <div className="flex gap-[2px] mb-2 ml-6 sm:ml-8">
              {heatmapData.map((week, weekIndex) => {
                const firstDay = week.find(day => day !== null);
                if (!firstDay || weekIndex === 0) return <div key={weekIndex} className="w-3" />;
                
                const date = firstDay.date;
                const isFirstWeekOfMonth = date.getDate() <= 7;
                
                return (
                  <div key={weekIndex} className="w-3 sm:w-3.5 text-[10px] sm:text-xs text-muted-foreground">
                    {isFirstWeekOfMonth ? months[date.getMonth()] : ""}
                  </div>
                );
              })}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] text-[10px] sm:text-xs text-muted-foreground pr-2 sm:pr-3">
                <div className="h-3 sm:h-3.5">Mon</div>
                <div className="h-3 sm:h-3.5"></div>
                <div className="h-3 sm:h-3.5">Wed</div>
                <div className="h-3 sm:h-3.5"></div>
                <div className="h-3 sm:h-3.5">Fri</div>
                <div className="h-3 sm:h-3.5"></div>
                <div className="h-3 sm:h-3.5">Sun</div>
              </div>

              {/* Activity squares */}
              <TooltipProvider>
                {heatmapData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={dayIndex} className="w-3 sm:w-3.5 h-3 sm:h-3.5" />;
                      }

                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm transition-colors hover:ring-2 hover:ring-primary cursor-pointer ${getIntensityClass(
                                day.distance
                              )}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-semibold">
                                {day.date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div>
                                {day.runCount > 0 ? (
                                  <>
                                    <div>{day.runCount} run{day.runCount > 1 ? "s" : ""}</div>
                                    <div>{day.distance.toFixed(1)} miles</div>
                                  </>
                                ) : (
                                  "No runs"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Legend Below Heatmap */}
        <div className="flex items-center justify-end gap-2 mt-4 text-[10px] sm:text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm bg-muted/20" />
            <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm bg-[hsl(25_80%_85%)]" />
            <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm bg-[hsl(25_90%_70%)]" />
            <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm bg-[hsl(22_95%_60%)]" />
            <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm bg-[hsl(20_100%_52%)]" />
            <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm bg-[hsl(15_100%_45%)]" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
