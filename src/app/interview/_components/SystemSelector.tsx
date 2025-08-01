"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";

interface System {
  id: string;
  name: string;
  description?: string | null;
}

interface SystemSelectorProps {
  systems: System[];
  selectedSystemId: string | undefined;
  teamName: string;
  applicationId: string;
}

export function SystemSelector({
  systems,
  selectedSystemId,
  teamName,
  applicationId,
}: SystemSelectorProps) {
  const router = useRouter();

  const handleSystemSelect = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("applicationId", applicationId);

    url.searchParams.set("systemId", value);

    router.push(url.toString());
  };

  // If there's only one system or no systems, don't show the selector
  if (systems.length <= 1) {
    return null;
  }

  // Determine the current value for the select
  const currentValue = selectedSystemId;

  // Find the selected system for display
  const selectedSystem = systems.find((s) => s.id === selectedSystemId);

  return (
    <div className="mb-6">
      <label className="mb-3 block font-semibold">
        Select System within {teamName} Team
      </label>
      <div className="flex items-center gap-3">
        <Select value={currentValue} onValueChange={handleSystemSelect}>
          <SelectTrigger className="w-72">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>
                  {selectedSystemId ? `${selectedSystem?.name} System` : ""}
                </span>
                {selectedSystem?.name.toLowerCase() === "solar" && (
                  <Badge variant="secondary" className="text-xs">
                    Solar
                  </Badge>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* System-specific options */}
            {systems.map((system) => (
              <SelectItem key={system.id} value={system.id}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{system.name}</span>
                    {system.name.toLowerCase() === "solar" && (
                      <Badge variant="secondary" className="text-xs">
                        Solar
                      </Badge>
                    )}
                  </div>
                  {system.description && (
                    <span className="max-w-64 truncate text-xs text-gray-500">
                      {system.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
