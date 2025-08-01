"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const useSetCursor = (cursor: number | undefined) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    // if we can't scroll no more
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      // set cursor to the end
      newParams.set("cursor", cursor?.toString() ?? "0");

      void router.replace(`/people?${newParams.toString()}`);
    }
  }, [cursor, router, searchParams]);
};

const SetCursor = ({ cursor }: { cursor?: number }) => {
  useSetCursor(cursor);

  return null; // This component does not render anything, it just sets the cursor
};

export default SetCursor;
