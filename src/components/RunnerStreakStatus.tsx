import { useEffect, useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from 'date-fns-tz';

interface RunnerStreakStatusProps {
  lastActivityDate: string | null;
  timezone: string;
  country: string | null;
}

export function RunnerStreakStatus({ lastActivityDate, timezone }: RunnerStreakStatusProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
  }>({ hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Use date-fns-tz to get current time in runner's timezone
      const runnerTime = new Date();
      const runnerTimeStr = formatInTimeZone(runnerTime, timezone, 'yyyy-MM-dd HH:mm:ss');
      const [datePart, timePart] = runnerTimeStr.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Calculate time until midnight in runner's timezone
      const hoursLeft = 23 - hours;
      const minutesLeft = 59 - minutes;
      
      setTimeLeft({
        hours: hoursLeft,
        minutes: minutesLeft,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, [timezone]);

  // Get "today" in the runner's timezone using date-fns-tz
  const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  const hasRunToday = lastActivityDate === todayStr;

  if (hasRunToday) {
    return (
      <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20">
        <CheckCircle className="h-3 w-3" />
        <span className="text-xs">Streak Safe</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 bg-orange-500/10 text-orange-600 border-orange-500/20">
      <Clock className="h-3 w-3" />
      <span className="text-xs font-mono">
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}
      </span>
    </Badge>
  );
}
