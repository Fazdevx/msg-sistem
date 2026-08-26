import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.me()
        .then((d) => {
          setUser(d.user);
          setUsuario(d.usuario);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.session?.access_token);
    setUser(data.user);
    try {
      const me = await api.me();
      setUsuario(me.usuario);
    } catch {
      // If /me fails, we still have the session
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ user, usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}