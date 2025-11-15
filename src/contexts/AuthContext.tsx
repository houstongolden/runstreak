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
        
        // Fetch runner ID when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchRunnerId(session.user.id);
          }, 0);
        } else {
          setRunnerId(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchRunnerId(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRunnerId = async (userId: string) => {
    try {
      // First try to get runner by user's email
      if (!user?.email) return;
      
      const { data, error } = await supabase
        .from('runners')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      
      if (data) {
        setRunnerId(data.id);
        localStorage.setItem('current_runner_id', data.id);
      }
    } catch (error) {
      console.error('Error fetching runner ID:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRunnerId(null);
    localStorage.removeItem('current_runner_id');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, runnerId }}>
      {children}
    </AuthContext.Provider>
  );
};
