
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Google OAuth
  useEffect(() => {
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    // Check for existing session
    const savedUser = localStorage.getItem('bolt_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('bolt_user');
      }
    }
    
    setLoading(false);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      // Decode JWT token
      const token = response.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const userData: User = {
        uid: payload.sub,
        email: payload.email,
        displayName: payload.name,
        photoURL: payload.picture,
        createdAt: new Date()
      };

      setUser(userData);
      localStorage.setItem('bolt_user', JSON.stringify(userData));
      
      // Handle redirect after successful sign in
      const redirectPrompt = sessionStorage.getItem('pending_prompt');
      if (redirectPrompt) {
        sessionStorage.removeItem('pending_prompt');
        // Navigate to builder with the saved prompt
        window.location.href = `/builder?prompt=${encodeURIComponent(redirectPrompt)}`;
      }
      
    } catch (error) {
      console.error('Error handling Google response:', error);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup
            window.google.accounts.oauth2.initTokenClient({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              scope: 'email profile',
              callback: (response: any) => {
                if (response.access_token) {
                  // Fetch user info with access token
                  fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
                    .then(res => res.json())
                    .then(userInfo => {
                      const userData: User = {
                        uid: userInfo.id,
                        email: userInfo.email,
                        displayName: userInfo.name,
                        photoURL: userInfo.picture,
                        createdAt: new Date()
                      };
                      
                      setUser(userData);
                      localStorage.setItem('bolt_user', JSON.stringify(userData));
                      resolve();
                    })
                    .catch(reject);
                } else {
                  reject(new Error('Failed to get access token'));
                }
              }
            }).requestAccessToken();
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('Google OAuth not loaded'));
      }
    });
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('bolt_user');
    sessionStorage.removeItem('pending_prompt');
    
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Extend Window interface for Google OAuth
declare global {
  interface Window {
    google: any;
  }
}