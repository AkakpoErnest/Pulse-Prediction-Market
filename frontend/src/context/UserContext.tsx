"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";

interface UserCtx {
  /** Get display name for any address (username or shortened addr) */
  displayName:  (address: string) => string;
  /** Raw username (null if not set) */
  getUsername:  (address: string) => string | null;
  /** Persist a username for an address */
  setUsername:  (address: string, name: string) => void;
  /** Clear username for an address */
  clearUsername:(address: string) => void;
  /** Connected wallet's own username */
  myUsername:   string | null;
}

const UserContext = createContext<UserCtx>({
  displayName:   (a) => `${a.slice(0, 6)}…${a.slice(-4)}`,
  getUsername:   ()  => null,
  setUsername:   ()  => {},
  clearUsername: ()  => {},
  myUsername:    null,
});

const key = (addr: string) => `pulse_user_${addr.toLowerCase()}`;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  // local cache so reads are synchronous after first load
  const [cache, setCache] = useState<Record<string, string>>({});

  // Hydrate own username on connect
  useEffect(() => {
    if (!address || typeof window === "undefined") return;
    const stored = localStorage.getItem(key(address));
    if (stored) setCache((p) => ({ ...p, [address.toLowerCase()]: stored }));
  }, [address]);

  const getUsername = useCallback((addr: string): string | null => {
    const norm = addr.toLowerCase();
    if (cache[norm]) return cache[norm];
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key(addr));
  }, [cache]);

  const setUsername = useCallback((addr: string, name: string) => {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed) return;
    localStorage.setItem(key(addr), trimmed);
    setCache((p) => ({ ...p, [addr.toLowerCase()]: trimmed }));
  }, []);

  const clearUsername = useCallback((addr: string) => {
    localStorage.removeItem(key(addr));
    setCache((p) => { const n = { ...p }; delete n[addr.toLowerCase()]; return n; });
  }, []);

  const displayName = useCallback((addr: string): string => {
    return getUsername(addr) ?? `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }, [getUsername]);

  const myUsername = address ? getUsername(address) : null;

  return (
    <UserContext.Provider value={{ displayName, getUsername, setUsername, clearUsername, myUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsernames() {
  return useContext(UserContext);
}
