"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LastConversationRedirect() {
  const router = useRouter();

  useEffect(() => {
    const lastId = localStorage.getItem("hyrbase_last_conversation");
    if (lastId) {
      router.replace(`/ai-assistant/${lastId}`);
    }
  }, [router]);

  return null;
}
