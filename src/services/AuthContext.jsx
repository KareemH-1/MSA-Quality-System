import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { normalizeRole } from './roleUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, _setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('mq_user');
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return parsed ? { ...parsed, role: normalizeRole(parsed.role) } : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(() => Boolean(localStorage.getItem('mq_user')));

  const setUser = useMemo(() => {
    return (nextUser) => {
      _setUser((currentUser) => {
        const resolvedUser = typeof nextUser === 'function' ? nextUser(currentUser) : nextUser;

        if (!resolvedUser) {
          return null;
        }

        return {
          ...resolvedUser,
          role: normalizeRole(resolvedUser.role),
        };
      });
    };
  }, []);

  useEffect(() => {
    try {
      if (user && user._remember) localStorage.setItem('mq_user', JSON.stringify(user));
      else localStorage.removeItem('mq_user');
    } catch {}
  }, [user]);

  useEffect(() => {
    let alive = true;

    const hydrateSession = async () => {
      if (localStorage.getItem('mq_user')) {
        if (alive) setAuthReady(true);
        return;
      }

      try {
        const response = await api.get('/View/SessionView.php');
        const sessionUser = response.data?.user;

        if (alive) {
          if (sessionUser?.user_id && sessionUser?.role) {
            setUser({
              user_id: sessionUser.user_id,
              name: sessionUser.name || '',
              role: sessionUser.role,
              _remember: false,
            });
          } else {
            setUser(null);
          }
          setAuthReady(true);
        }
      } catch {
        if (alive) {
          setUser(null);
          setAuthReady(true);
        }
      }
    };

    hydrateSession();

    return () => {
      alive = false;
    };
  }, [setUser]);

  const setRole = (role) => setUser((u) => ({ ...(u || {}), role: normalizeRole(role) }));
  const setName = (name) => setUser((u) => ({ ...(u || {}), name }));

  const value = {
    user,
    setUser,
    setRole,
    setName,
    authReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
