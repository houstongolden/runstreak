import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface DailyActivity {
  activity_date: string;
  distance: number;
  run_count: number;
}

interface ActivityHeatmapProps {
  runnerId: string;
  isOwnProfile?: boolean;
}

export default function ActivityHeatmap({ runnerId, isOwnProfile = false }: ActivityHeatmapProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [clickedDay, setClickedDay] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch all activities for all years
        const { data, error } = await (supabase as any)
          .from("daily_activities")
          .select("activity_date, distance, run_count")
          .eq("runner_id", runnerId)
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
    const weeks: Array<Array<{ dateStr: string; distance: number; runCount: number } | null>> = [];
    
    // Create a map of activities by date for quick lookup
    // Dates in database are already in runner's local timezone
    const activityMap = new Map();
    activities.forEach(activity => {
      activityMap.set(activity.activity_date, {
        distance: activity.distance,
        runCount: activity.run_count,
      });
    });

    // Start from January 1st of selected year
    const startDate = new Date(selectedYear, 0, 1);
    // End at December 31st of selected year
    const endDate = new Date(selectedYear, 11, 31);
    
    // Start from the Sunday before or on January 1st
    const firstDayOfYear = new Date(startDate);
    firstDayOfYear.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay());

    let currentWeek: Array<{ dateStr: string; distance: number; runCount: number } | null> = [];
    let currentDate = new Date(firstDayOfYear);

    while (currentDate <= endDate) {
      // Format date as YYYY-MM-DD in local timezone
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const activityData = activityMap.get(dateStr);
      const isInYear = currentDate.getFullYear() === selectedYear;
      
      if (isInYear) {
        // Store the date string directly to avoid timezone issues
        currentWeek.push({
          dateStr: dateStr,
          distance: activityData?.distance || 0,
          runCount: activityData?.runCount || 0,
        });
      } else {
        currentWeek.push(null);
      }

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
  
  // Get available years from activities
  const availableYears = [...new Set(activities.map(a => new Date(a.activity_date).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  if (availableYears.length === 0) {
    availableYears.push(currentYear);
  }

  // Calculate month label positions based on actual week indices
  const getMonthLabelPositions = () => {
    const positions: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    heatmapData.forEach((week, weekIndex) => {
      const firstDay = week.find(day => day !== null);
      if (firstDay) {
        const monthIndex = new Date(firstDay.dateStr + 'T00:00:00').getMonth();
        if (monthIndex !== lastMonth) {
          positions.push({ month: months[monthIndex], weekIndex });
          lastMonth = monthIndex;
        }
      }
    });

    return positions;
  };

  const monthLabelPositions = getMonthLabelPositions();

  return (
    <div className="w-full min-w-0 max-w-[350px]" onClick={() => setClickedDay(null)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Activity Heatmap</h3>
        <div className="flex gap-1">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedYear === year
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-lg p-4 sm:p-5 border overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
          <div className="inline-block max-w-full">
            {/* Month labels - using grid structure to match week columns exactly */}
            <div className="flex gap-[2px] mb-2">
              {/* Spacer for day labels column */}
              <div className="w-6 sm:w-8 shrink-0" />
              
              {/* Month label grid - one cell per week */}
              {heatmapData.map((week, weekIndex) => {
                const monthLabel = monthLabelPositions.find(pos => pos.weekIndex === weekIndex);
                return (
                  <div key={weekIndex} className="w-3 sm:w-3.5 shrink-0 text-[10px] sm:text-xs text-muted-foreground">
                    {monthLabel ? monthLabel.month : ""}
                  </div>
                );
              })}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] text-[10px] sm:text-xs text-muted-foreground pr-2 sm:pr-3 w-6 sm:w-8 shrink-0">
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
                  <div key={weekIndex} className="flex flex-col gap-[2px] shrink-0">
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={dayIndex} className="w-3 sm:w-3.5 h-3 sm:h-3.5" />;
                      }

                      const dayKey = `${weekIndex}-${dayIndex}`;
                      const isOpen = clickedDay === dayKey;
                      
                      return (
                        <Tooltip key={dayIndex} open={isOwnProfile && isOpen ? true : undefined}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-sm transition-colors ${
                                isOwnProfile ? 'hover:ring-2 hover:ring-primary cursor-pointer' : ''
                              } ${getIntensityClass(day.distance)}`}
                              onClick={(e) => {
                                if (isOwnProfile) {
                                  e.stopPropagation();
                                  setClickedDay(isOpen ? null : dayKey);
                                }
                              }}
                            />
                          </TooltipTrigger>
                          {isOwnProfile && (
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-semibold">
                                  {(() => {
                                    // Parse date string as local date to avoid timezone conversion
                                    const [year, month, dayNum] = day.dateStr.split('-').map(Number);
                                    const localDate = new Date(year, month - 1, dayNum);
                                    return format(localDate, "MMM d, yyyy");
                                  })()}
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
                          )}
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
