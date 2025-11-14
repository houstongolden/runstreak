import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BadgeParams {
  runnerId: string;
  stat: 'streak' | 'rank' | 'miles' | 'avg';
  theme: 'light' | 'dark' | 'fire';
}

const generateBadgeSVG = (
  displayName: string,
  statValue: string,
  statLabel: string,
  theme: string
): string => {
  const themes = {
    light: {
      bg: '#ffffff',
      border: '#e5e7eb',
      text: '#111827',
      label: '#6b7280',
      accent: '#f97316',
    },
    dark: {
      bg: '#1f2937',
      border: '#374151',
      text: '#f9fafb',
      label: '#9ca3af',
      accent: '#fb923c',
    },
    fire: {
      bg: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
      border: '#dc2626',
      text: '#ffffff',
      label: '#fef3c7',
      accent: '#fbbf24',
    },
  };

  const colors = themes[theme as keyof typeof themes] || themes.light;
  const isGradient = theme === 'fire';

  return `
<svg width="300" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${isGradient ? `
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
    </linearGradient>
    ` : ''}
  </defs>
  
  <!-- Background -->
  <rect width="300" height="120" rx="12" fill="${isGradient ? 'url(#bg-gradient)' : colors.bg}" stroke="${colors.border}" stroke-width="2"/>
  
  <!-- RunStreak Logo -->
  <g transform="translate(20, 20)">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
          fill="${colors.accent}" opacity="0.9"/>
  </g>
  
  <!-- RunStreak Text -->
  <text x="45" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${colors.text}">
    RunStreak
  </text>
  
  <!-- Runner Name -->
  <text x="20" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="${colors.label}">
    ${displayName}
  </text>
  
  <!-- Stat Value -->
  <text x="20" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="${colors.text}">
    ${statValue}
  </text>
  
  <!-- Stat Label -->
  <text x="20" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="${colors.label}">
    ${statLabel}
  </text>
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
    const stat = (url.searchParams.get('stat') || 'streak') as BadgeParams['stat'];
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

    // Calculate rank if needed
    let rank = 0;
    if (stat === 'rank') {
      const { data: allRunners } = await supabase
        .from('runners')
        .select('id, current_streak_days')
        .order('current_streak_days', { ascending: false });

      if (allRunners) {
        rank = allRunners.findIndex(r => r.id === runnerId) + 1;
      }
    }

    // Generate stat value and label
    let statValue = '';
    let statLabel = '';

    switch (stat) {
      case 'streak':
        statValue = `${runner.current_streak_days}`;
        statLabel = runner.current_streak_days === 1 ? 'day streak' : 'days streak';
        break;
      case 'rank':
        statValue = `#${rank}`;
        statLabel = 'leaderboard rank';
        break;
      case 'miles':
        statValue = `${runner.current_streak_miles.toFixed(1)}`;
        statLabel = 'total miles';
        break;
      case 'avg':
        statValue = `${runner.average_miles_per_day.toFixed(1)}`;
        statLabel = 'avg miles/day';
        break;
    }

    const svg = generateBadgeSVG(runner.display_name, statValue, statLabel, theme);

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
