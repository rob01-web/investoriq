import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

/**
 * Supabase Authentication Context  -  InvestorIQ
 * --------------------------------------------
 * Handles global auth state, session sync, and user profiles.
 * Provides sign-up, sign-in, and sign-out utilities with toast feedback.
 */

const AuthContext = createContext(undefined);

const profilesEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.is(a[key], b[key]));
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);
  const userRef = useRef(null);
  const lastTokenRef = useRef('');
  const loadingRef = useRef(true);
  const lastFetchedUserIdRef = useRef(null);

  const setProfileIfChanged = useCallback((nextProfile) => {
    setProfile((prev) => {
      if (profilesEqual(prev, nextProfile)) {
        profileRef.current = prev;
        return prev;
      }
      profileRef.current = nextProfile;
      return nextProfile;
    });
  }, []);

  /** Fetch the current user's profile from Supabase */
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      lastFetchedUserIdRef.current = null;
      setProfileIfChanged(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }

    lastFetchedUserIdRef.current = userId;
    setProfileIfChanged(data || null);
    return data;
  }, [setProfileIfChanged]);

  /** Handle Supabase session updates and maintain user state */
  const handleSession = useCallback(
    async (session) => {
      const nextToken = session?.access_token || '';
      const nextUser = session?.user ?? null;
      const nextUserId = nextUser?.id || null;
      const previousUserId = userRef.current?.id || null;
      const unchangedSession =
        lastTokenRef.current === nextToken &&
        previousUserId === nextUserId;

      if (unchangedSession && !loadingRef.current) {
        return;
      }

      lastTokenRef.current = nextToken;
      userRef.current = nextUser;
      setSession(session);
      setUser(nextUser);
      await fetchProfile(nextUserId);
      loadingRef.current = false;
      setLoading(false);
    },
    [fetchProfile]
  );

  /** Initial session retrieval + live session updates */
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  /** Create a new user account */
  const signUp = useCallback(
    async (email, password, options) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign-Up Failed',
          description: error.message || 'An unexpected error occurred.',
        });
      } else {
        toast({
          title: 'Account Created',
          description:
            'Please check your inbox to confirm your email before signing in.',
        });
      }

      return { error };
    },
    [toast]
  );

  /** Log an existing user in */
  const signIn = useCallback(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign-In Failed',
          description: error.message || 'Invalid credentials. Please try again.',
        });
      }

      return { error };
    },
    [toast]
  );

  /** Log out the current user and reset local profile state */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    profileRef.current = null;
    userRef.current = null;
    lastTokenRef.current = '';
    lastFetchedUserIdRef.current = null;
    setProfileIfChanged(null);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign-Out Failed',
        description: error.message || 'Unable to log out. Please try again.',
      });
    }
    return { error };
  }, [toast, setProfileIfChanged]);

  /** Context value available across the app */
  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      fetchProfile,
    }),
    [user, profile, session, loading, signUp, signIn, signOut, fetchProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

/** Hook to access the Supabase Auth context */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
