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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  runnerId: null,
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear runner ID on logout
        if (!session?.user) {
          setRunnerId(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch runner ID when user changes (separate from auth state listener)
  useEffect(() => {
    if (user?.id) {
      fetchRunnerId(user.id);
    } else {
      setRunnerId(null);
    }
  }, [user?.id]);

  const fetchRunnerId = async (userId: string) => {
    try {
      // Get runner by user_id (secure server-side link)
      const { data, error } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setRunnerId(data.id);
      }
    } catch (error) {
      console.error('Error fetching runner ID:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRunnerId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, runnerId }}>
      {children}
    </AuthContext.Provider>
  );
};
