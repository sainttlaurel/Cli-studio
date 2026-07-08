"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Admin panel is open - redirect to dashboard
    router.push("/admin");
  }, [router]);

  return null;
}
