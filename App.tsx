import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import { View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check if a user is already logged in when the app opens
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes (like when you press "Sign In" or "Sign Out")
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // If there is no session, show the Auth screen
  if (!session) {
    return (
      <View style={styles.container}>
        <Auth />
      </View>
    );
  }

  // If there IS a session, show the main app
  // Sign-out is accessible from the hamburger menu inside Dashboard
  return (
    <View style={styles.container}>
      <Dashboard session={session} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FEF9F3',
  },
});