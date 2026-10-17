"use client";

import { useEffect, useState } from "react";

export interface UserProfile {
  name?: string;
  email?: string;
}

/**
 * Who is signed in, from the Auth0 session (the same /auth/profile check the
 * header used). `undefined` while checking, `null` when signed out.
 */
export function useProfile(): UserProfile | null | undefined {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/auth/profile")
      // Signed out answers 401 (or 204); only 200 carries a profile.
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((data: UserProfile | null) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return user;
}
