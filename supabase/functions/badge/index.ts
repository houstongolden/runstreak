import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BadgeParams {
  runnerId: string;
  stat1: 'streak' | 'miles' | 'avg';
  stat2: 'streak' | 'miles' | 'avg' | 'none';
  theme: 'light' | 'dark' | 'fire';
}

const generateBadgeSVG = (
  displayName: string,
  stat1Value: string,
  stat1Label: string,
  stat2Value: string | null,
  stat2Label: string | null,
  rank: number,
  theme: string
): string => {
  const themes = {
    light: {
      bg: '#ffffff',
      border: '#e5e7eb',
      text: '#111827',
      label: '#6b7280',
      accent1: '#f97316',
      accent2: '#fb923c',
      rankBg: '#fef3c7',
      rankText: '#92400e',
    },
    dark: {
      bg: '#0a0a0a',
      border: '#27272a',
      text: '#fafafa',
      label: '#a1a1aa',
      accent1: '#f97316',
      accent2: '#fb923c',
      rankBg: '#292524',
      rankText: '#fbbf24',
    },
    fire: {
      bg: '#1a0f0a',
      border: '#dc2626',
      text: '#ffffff',
      label: '#fde68a',
      accent1: '#f97316',
      accent2: '#fb923c',
      rankBg: '#7c2d12',
      rankText: '#fef3c7',
    },
  };

  const colors = themes[theme as keyof typeof themes] || themes.light;
  const hasTwoStats = stat2Value !== null;

  return `
<svg width="480" height="180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.accent1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.accent2};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.accent1};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${colors.accent2};stop-opacity:0.05" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- Background with subtle gradient -->
  <rect width="480" height="180" rx="16" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2"/>
  <rect width="480" height="180" rx="16" fill="url(#glow)" opacity="0.5"/>
  
  <!-- Rank Badge (Top Right) -->
  <g transform="translate(415, 20)">
    <rect x="0" y="0" width="50" height="32" rx="8" fill="${colors.rankBg}"/>
    <text x="25" y="21" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="700" 
          fill="${colors.rankText}" text-anchor="middle">#${rank}</text>
  </g>
  
  <!-- Logo: Flame Icon with Gradient -->
  <g transform="translate(24, 24)">
    <path d="M20 12 L16 4 L14 8 L10 2 L8 10 L4 6 L6 14 C6 18.4 9.6 22 14 22 C18.4 22 22 18.4 22 14 L20 12 Z" 
          fill="url(#flame-gradient)" 
          stroke="url(#flame-gradient)" 
          stroke-width="1" 
          filter="url(#shadow)"/>
  </g>
  
  <!-- RunStreak Text -->
  <text x="65" y="40" font-family="'Instrument Serif', serif" font-size="22" font-weight="600" 
        fill="${colors.text}" letter-spacing="0.5">RunStreak</text>
  
  <!-- Runner Name -->
  <text x="24" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" 
        fill="${colors.label}">@${displayName}</text>
  
  <!-- Divider Line -->
  <line x1="24" y1="90" x2="456" y2="90" stroke="${colors.border}" stroke-width="1" opacity="0.5"/>
  
  <!-- Stats Container -->
  ${hasTwoStats ? `
    <!-- Stat 1 (Left) -->
    <g transform="translate(24, 110)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="32" font-weight="700" 
            fill="${colors.text}">${stat1Value}</text>
      <text x="0" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" 
            fill="${colors.label}" text-transform="uppercase" letter-spacing="0.5">${stat1Label}</text>
    </g>
    
    <!-- Vertical Divider -->
    <line x1="240" y1="105" x2="240" y2="155" stroke="${colors.border}" stroke-width="1" opacity="0.5"/>
    
    <!-- Stat 2 (Right) -->
    <g transform="translate(264, 110)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="32" font-weight="700" 
            fill="${colors.text}">${stat2Value}</text>
      <text x="0" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" 
            fill="${colors.label}" text-transform="uppercase" letter-spacing="0.5">${stat2Label}</text>
    </g>
  ` : `
    <!-- Single Stat (Centered) -->
    <g transform="translate(24, 110)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="36" font-weight="700" 
            fill="${colors.text}">${stat1Value}</text>
      <text x="0" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" 
            fill="${colors.label}" text-transform="uppercase" letter-spacing="0.5">${stat1Label}</text>
    </g>
  `}
</svg>
  `.trim();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const runnerId = url.searchParams.get('id');
    const stat1 = (url.searchParams.get('stat1') || 'streak') as BadgeParams['stat1'];
    const stat2 = (url.searchParams.get('stat2') || 'miles') as BadgeParams['stat2'];
    const theme = (url.searchParams.get('theme') || 'light') as BadgeParams['theme'];

    if (!runnerId) {
      throw new Error('Runner ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch runner data
    const { data: runner, error } = await supabase
      .from('runners')
      .select('*')
      .eq('id', runnerId)
      .single();

    if (error || !runner) {
      throw new Error('Runner not found');
    }

    // Calculate rank
    const { data: allRunners } = await supabase
      .from('runners')
      .select('id, current_streak_days')
      .order('current_streak_days', { ascending: false });

    let rank = 0;
    if (allRunners) {
        rank = allRunners.findIndex(r => r.id === runnerId) + 1;
      rank = allRunners.findIndex(r => r.id === runnerId) + 1;
    }

    // Helper function to get stat value and label
    const getStatInfo = (statType: string) => {
      switch (statType) {
        case 'streak':
          return {
            value: `${runner.current_streak_days}`,
            label: runner.current_streak_days === 1 ? 'day streak' : 'days',
          };
        case 'miles':
          return {
            value: `${runner.current_streak_miles.toFixed(1)}`,
            label: 'total miles',
          };
        case 'avg':
          return {
            value: `${runner.average_miles_per_day.toFixed(1)}`,
            label: 'mi/day',
          };
        default:
          return { value: '0', label: 'unknown' };
      }
    };

    const stat1Info = getStatInfo(stat1);
    const stat2Info = stat2 !== 'none' ? getStatInfo(stat2) : null;

    const svg = generateBadgeSVG(
      runner.display_name,
      stat1Info.value,
      stat1Info.label,
      stat2Info?.value || null,
      stat2Info?.label || null,
      rank,
      theme
    );

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error generating badge:', error);
    
    // Return error badge
    const errorSvg = `
<svg width="300" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="120" rx="12" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
  <text x="150" y="60" font-family="system-ui" font-size="16" fill="#991b1b" text-anchor="middle">
    Badge Error
  </text>
  <text x="150" y="85" font-family="system-ui" font-size="12" fill="#991b1b" text-anchor="middle">
    ${error instanceof Error ? error.message : 'Unknown error'}
  </text>
</svg>
    `.trim();

    return new Response(errorSvg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
      },
      status: 400,
    });
  }
});
