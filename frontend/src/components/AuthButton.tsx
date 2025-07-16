import React, { useState } from 'react';
import { User, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthButtonProps {
  onSignInRequired?: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ onSignInRequired }) => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      onSignInRequired?.();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowDropdown(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-10 h-10">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSigningIn ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            Sign In
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
      >
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-8 h-8 rounded-full border-2 border-orange-500/30"
        />
        <span className="text-sm font-medium text-gray-200 hidden md:block">
          {user.displayName}
        </span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-12 w-64 bg-[#1A1C24] border border-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm z-50">
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full border-2 border-orange-500/30"
              />
              <div>
                <p className="text-sm font-medium text-gray-200">{user.displayName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};