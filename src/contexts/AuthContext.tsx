import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader } from "@/components/ui/loader";

// Define the shape of the context value
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
};

// Create context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Named function export for the hook to improve Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Named function for the provider component to improve Fast Refresh compatibility
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Get the session from storage
    async function getInitialSession() {
      try {
        setIsLoading(true);
        setIsInitializing(true);
        
        // Fetch the session data
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Add a small artificial delay for a smoother loading experience (min 700ms)
        const startTime = Date.now();
        const minDelay = 700;
        
        setTimeout(() => {
          const elapsedTime = Date.now() - startTime;
          // If fetching took less than minDelay, wait the remaining time
          const remainingTime = Math.max(0, minDelay - elapsedTime);
          
          setTimeout(() => {
            setIsInitializing(false);
            setIsLoading(false);
          }, remainingTime);
        }, 0);
        
      } catch (error) {
        console.error('Error getting initial session:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to retrieve your session. Please try refreshing the page.',
          variant: 'destructive',
        });
        setIsInitializing(false);
        setIsLoading(false);
      }
    }

    getInitialSession();

    // Set up the listener for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // When a user signs in, dispatch a custom event for PWA install popup
      if (_event === 'SIGNED_IN') {
        try {
          const authEvent = new CustomEvent('auth:signed_in');
          document.dispatchEvent(authEvent);
        } catch (error) {
          console.error('Error dispatching auth event:', error);
        }
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error signing out',
        description: 'An error occurred while signing out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
  };

  return (
    <AuthContext.Provider value={value}>
      {isInitializing ? (
        <Loader text="Welcome to GATE Tracker" />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
