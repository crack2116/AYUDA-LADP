"use client";

import { useCallback, useEffect, useState } from "react";

import type { UserProfile } from "@/domain/entities/user";
import { getContainer } from "@/infrastructure/container";

export interface SessionState {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

/**
 * Restores the persisted session after mount.
 * Storage is only touched inside effects so SSR and hydration stay aligned.
 */
export function useSession(): SessionState {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getContainer()
      .authRepository.restoreSession()
      .then((profile) => {
        if (active) {
          setUser(profile);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await getContainer().authRepository.logout();
    setUser(null);
  }, []);

  return { user, loading, logout };
}
