import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, IS_DEV } from '@/lib/supabase';
import type { Galaxy } from '@/lib/types';

export function Lobby() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadGalaxies();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadGalaxies();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadGalaxies = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('galaxies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGalaxies(data || []);
    } catch (err: any) {
      console.error('Error loading galaxies:', err);
      setError(err.message);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is disabled for this dev session.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setGalaxies([]);
  };

  const handleJoinGalaxy = (galaxyId: string) => {
    navigate(`/galaxy/${galaxyId}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: '#fff',
        padding: '40px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '40px', textAlign: 'center' }}>
          Stellaris-Lite
        </h1>

        {!supabase ? (
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '520px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Dev Mode</h2>
            <div style={{ color: '#bbb', marginBottom: '20px' }}>
              Supabase is not configured. {IS_DEV ? 'Using local dev galaxy data.' : 'Running offline.'}
            </div>
            <button
              onClick={() => handleJoinGalaxy('dev')}
              style={{
                padding: '10px 18px',
                background: '#4a9eff',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Enter Dev Galaxy
            </button>
          </div>
        ) : !user ? (
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </h2>
            
            {error && (
              <div
                style={{
                  background: '#4a1a1a',
                  border: '1px solid #aa4444',
                  color: '#ff8888',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="email"
                  style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="password"
                  style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#4a9eff',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  marginBottom: '16px',
                }}
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>
                  Logged in as: {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    padding: '8px 16px',
                    background: '#4a1a1a',
                    border: '1px solid #aa4444',
                    borderRadius: '4px',
                    color: '#ff8888',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div>
              <h2 style={{ marginBottom: '16px' }}>Available Galaxies</h2>
              
              {galaxies.length === 0 ? (
                <div style={{ color: '#888' }}>No galaxies found. Create one in the database.</div>
              ) : (
                <div>
                  {galaxies.map((galaxy) => (
                    <div
                      key={galaxy.id}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {galaxy.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#888' }}>
                          Status: {galaxy.status} | Tick: {galaxy.tick}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinGalaxy(galaxy.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#4a9eff',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
