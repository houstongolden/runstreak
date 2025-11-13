// Helper functions for generating avatar and logo URLs

export const getCompanyLogoUrl = (companyName: string): string => {
  // Map company names to their domains for Google favicon API
  const domainMap: Record<string, string> = {
    'Vercel': 'vercel.com',
    'Supabase': 'supabase.com',
    'Linear': 'linear.app',
    'Resend': 'resend.com',
    'Cal.com': 'cal.com',
    'Dub': 'dub.co',
    'Mintlify': 'mintlify.com',
    'Trigger.dev': 'trigger.dev',
    'Stack Auth': 'stack-auth.com',
    'OpenStatus': 'openstatus.dev',
    'Pledge.to': 'pledge.to',
    'HypeProxies': 'hypeproxies.com',
    'Okara': 'okara.ai',
    'Whisper Memos': 'whispermemos.com',
    'BAMF': 'bamf.com',
    'TrustMRR': 'trustmrr.com',
  };

  const domain = domainMap[companyName] || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
};

export const getFounderAvatarUrl = (founderName: string): string => {
  // Use UI Avatars API for consistent avatars with initials
  const name = encodeURIComponent(founderName);
  return `https://ui-avatars.com/api/?name=${name}&size=128&background=random&color=fff&bold=true`;
};
