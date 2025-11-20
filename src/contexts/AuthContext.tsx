import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  runnerId: string | null;
  runnerData: { display_name: string; avatar_url: string | null } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  runnerId: null,
  runnerData: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [runnerId, setRunnerId] = useState<string | null>(null);
  const [runnerData, setRunnerData] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check for existing session first (handles page refresh and redirects)
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
        } else {
          console.log('[AuthContext] Initial session check:', session?.user?.id);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('[AuthContext] Exception getting session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, 'User:', session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear runner ID and data on logout
        if (!session?.user) {
          setRunnerId(null);
          setRunnerData(null);
        }
        
        // Handle token refresh to ensure session stays alive
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] Token refreshed successfully');
        }
        
        // Handle sign in events
        if (event === 'SIGNED_IN') {
          console.log('[AuthContext] User signed in');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch runner ID and data when user changes (separate from auth state listener)
  useEffect(() => {
    if (user?.id) {
      fetchRunnerId(user.id);
    } else {
      setRunnerId(null);
      setRunnerData(null);
    }
  }, [user?.id]);

  const fetchRunnerId = async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching runner for user_id:', userId);
      
      // Get runner by user_id with display_name and avatar_url
      const { data, error } = await supabase
        .from('runners')
        .select('id, display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[AuthContext] Error fetching runner:', error);
        return;
      }
      
      if (data) {
        console.log('[AuthContext] Found runner:', data.id);
        setRunnerId(data.id);
        setRunnerData({ display_name: data.display_name, avatar_url: data.avatar_url });
      } else {
        console.log('[AuthContext] No runner profile linked (admin-only account)');
      }
    } catch (error) {
      console.error('[AuthContext] Exception fetching runner ID:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRunnerId(null);
    setRunnerData(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, runnerId, runnerData }}>
      {children}
    </AuthContext.Provider>
  );
};
