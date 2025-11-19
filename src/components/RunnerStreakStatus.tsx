import { useEffect, useState } from "react";
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

  // Calculate color based on time remaining
  const totalHours = timeLeft.hours + (timeLeft.minutes / 60);
  let statusColor = 'text-green-600';
  if (totalHours < 1) {
    statusColor = 'text-red-600';
  } else if (totalHours < 6) {
    statusColor = 'text-yellow-600';
  }

  return (
    <div className={`text-xs font-mono ${statusColor}`}>
      {hasRunToday ? (
        <span>Completed today</span>
      ) : (
        <span>
          {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m left today
        </span>
      )}
    </div>
  );
}
