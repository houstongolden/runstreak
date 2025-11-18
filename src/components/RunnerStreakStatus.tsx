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

// Calculate what "today" is in a specific timezone
const getTodayInTimezone = (timezone: string): string => {
  // Get the current time in the target timezone
  const now = new Date();
  const offsetMinutes = getTimezoneOffset(timezone);
  const localTime = new Date(now.getTime() + offsetMinutes * 60000);
  
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Get timezone offset in minutes from UTC
const getTimezoneOffset = (timezone: string): number => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
};

// Calculate time until midnight in a specific timezone
const getTimeUntilMidnight = (timezone: string): { hours: number; minutes: number } => {
  const now = new Date();
  const offsetMinutes = getTimezoneOffset(timezone);
  const localTime = new Date(now.getTime() + offsetMinutes * 60000);
  
  const midnight = new Date(localTime);
  midnight.setUTCHours(24, 0, 0, 0);
  
  const difference = midnight.getTime() - localTime.getTime();
  
  return {
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
  };
};

export function RunnerStreakStatus({ lastActivityDate, timezone, country }: RunnerStreakStatusProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
  }>({ hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        setTimeLeft(getTimeUntilMidnight(timezone));
      } catch (error) {
        console.error('Error calculating time left:', error);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [timezone]);

  // Check if runner has run today in THEIR timezone
  const todayStr = getTodayInTimezone(timezone);
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
