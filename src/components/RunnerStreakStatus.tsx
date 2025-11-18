import { useEffect, useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RunnerStreakStatusProps {
  lastActivityDate: string | null;
  timezone: string;
  country: string | null;
}

// Map country names to ISO 3166-1 alpha-2 codes for flags
const countryCodeMap: Record<string, string> = {
  'United States': 'us',
  'USA': 'us',
  'United Kingdom': 'gb',
  'UK': 'gb',
  'Canada': 'ca',
  'Australia': 'au',
  'Germany': 'de',
  'France': 'fr',
  'Spain': 'es',
  'Italy': 'it',
  'Netherlands': 'nl',
  'Belgium': 'be',
  'Switzerland': 'ch',
  'Austria': 'at',
  'Sweden': 'se',
  'Norway': 'no',
  'Denmark': 'dk',
  'Finland': 'fi',
  'Poland': 'pl',
  'Czech Republic': 'cz',
  'Ireland': 'ie',
  'Portugal': 'pt',
  'Greece': 'gr',
  'Japan': 'jp',
  'South Korea': 'kr',
  'China': 'cn',
  'India': 'in',
  'Brazil': 'br',
  'Mexico': 'mx',
  'Argentina': 'ar',
  'Chile': 'cl',
  'New Zealand': 'nz',
  'South Africa': 'za',
  'Singapore': 'sg',
};

// Extract timezone abbreviation
const getTimezoneAbbr = (timezone: string): string => {
  const parts = timezone.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ');
};

export function RunnerStreakStatus({ lastActivityDate, timezone, country }: RunnerStreakStatusProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
  }>({ hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Get current time in the runner's timezone
      const nowInRunnerTz = new Date().toLocaleString('en-US', { timeZone: timezone });
      const runnerTime = new Date(nowInRunnerTz);
      
      // Calculate midnight in runner's timezone
      const midnight = new Date(runnerTime);
      midnight.setHours(24, 0, 0, 0);
      
      const difference = midnight.getTime() - runnerTime.getTime();
      
      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, [timezone]);

  // Calculate "today" in the runner's specific timezone
  const nowInRunnerTz = new Date().toLocaleString('en-US', { timeZone: timezone });
  const runnerTime = new Date(nowInRunnerTz);
  const year = runnerTime.getFullYear();
  const month = String(runnerTime.getMonth() + 1).padStart(2, '0');
  const day = String(runnerTime.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const hasRunToday = lastActivityDate === todayStr;

  // Get country code for flag
  const countryCode = country ? (countryCodeMap[country] || 'un') : 'un'; // 'un' for unknown
  const timezoneAbbr = getTimezoneAbbr(timezone);

  if (hasRunToday) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <img 
          src={`https://flagcdn.com/16x12/${countryCode}.png`}
          alt={country || 'Flag'}
          className="rounded-sm"
          width="16"
          height="12"
        />
        <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Streak Safe</span>
        </Badge>
        <span className="text-xs text-muted-foreground">{timezoneAbbr}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <img 
        src={`https://flagcdn.com/16x12/${countryCode}.png`}
        alt={country || 'Flag'}
        className="rounded-sm"
        width="16"
        height="12"
      />
      <Badge variant="secondary" className="gap-1.5 bg-orange-500/10 text-orange-600 border-orange-500/20">
        <Clock className="h-3 w-3" />
        <span className="text-xs font-mono">
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}
        </span>
      </Badge>
      <span className="text-xs text-muted-foreground">{timezoneAbbr}</span>
    </div>
  );
}
