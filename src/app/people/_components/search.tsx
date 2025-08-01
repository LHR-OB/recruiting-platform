"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "~/components/ui/input";

const Search = () => {
  const [value, setValue] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const cb = useDebouncedCallback((v: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("s", v ?? "");

    router.replace(pathname + "?" + params.toString());
  }, 50);

  useEffect(() => {
    cb(value);
  }, [cb, value]);

  return (
    <Input
      className="w-72 rounded"
      placeholder="Search..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      type="search"
      aria-label="Search"
    />
  );
};

export default Search;
