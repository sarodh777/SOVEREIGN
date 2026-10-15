import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

/**
 * OAuth2Success
 * -----------
 * Landing page after Google OAuth2 login.
 * Fetches /api/auth/me using the session cookie set by Spring Security,
 * builds a local JWT-backed session and redirects to the correct home.
 */
export default function OAuth2Success() {
  const navigate = useNavigate();
  const [error, setError]   = useState('');

  useEffect(() => {
    const finalise = async () => {
      try {
        const res = await api.get('/api/auth/me', { withCredentials: true });
        const user = res.data;

        localStorage.setItem('userEmail', user.email  || '');
        localStorage.setItem('userName',  user.name   || '');
        localStorage.setItem('userRole',  user.role   || 'ROLE_USER');
        localStorage.setItem('userId',    user.id     || '');

        const params = new URLSearchParams(window.location.search);
        if (params.get('token')) {
          localStorage.setItem('token', params.get('token'));
        }

        const role = user.role || 'ROLE_USER';
        if (role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        setError('Google sign-in failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    finalise();
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-[#050B2E] flex flex-col items-center justify-center gap-4">
      {error ? (
        <p className="text-rose-400 text-sm font-medium">{error}</p>
      ) : (
        <>
          <div className="w-10 h-10 border-4 border-[#713BFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#B8C5F2] text-sm">Completing sign-in…</p>
        </>
      )}
    </div>
  );
}
