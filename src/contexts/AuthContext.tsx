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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, 'User:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear runner ID and data on logout
        if (!session?.user) {
          setRunnerId(null);
          setRunnerData(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
        console.warn('[AuthContext] No runner found for user_id:', userId);
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
