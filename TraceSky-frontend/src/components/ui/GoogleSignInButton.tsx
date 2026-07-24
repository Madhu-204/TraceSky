import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../store/authStore';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GoogleSignInButton: React.FC = () => {
  const { googleSignIn } = useAuthStore();

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleSignIn(tokenResponse.access_token);
    },
    flow: 'implicit'
  });

  if (!googleClientId) return null;

  return (
    <button
      type="button"
      onClick={() => login()}
      className="w-full flex items-center justify-center gap-3 border border-gray-700/70 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800/40 hover:border-gray-600 transition-all duration-200 cursor-pointer"
    >
      <FcGoogle className="w-5 h-5" />
      <span>Continue with Google</span>
    </button>
  );
};
