"use client";

import type { InferSelectModel } from "drizzle-orm";
import { CheckIcon, LoaderCircleIcon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ozef from "ozef";
import { useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { applications, systems } from "~/server/db/schema";

const ApplicationForm = ({
  initial,
  updateAppAction,
  teamSystems,
  status,
  disabled,
  submitApplication,
}: {
  initial: object;
  updateAppAction: (json: string) => Promise<void>;
  teamSystems: InferSelectModel<typeof systems>[];
  status: InferSelectModel<typeof applications>["status"];
  disabled: boolean;
  submitApplication: () => Promise<void>;
}) => {
  const InnerApplicationForm = useMemo(
    () =>
      ozef({
        schema: z.object({
          interest: z.string().refine((s) => {
            const words = s.split(" ");
            return words.length <= 150;
          }, "Must be 150 words or less"),
          system1: z.enum(
            teamSystems.map((sys) => sys.name) as [string, ...string[]],
          ),
          system2: z.enum(
            teamSystems.map((sys) => sys.name) as [string, ...string[]],
          ),
          system3: z.enum(
            teamSystems.map((sys) => sys.name) as [string, ...string[]],
          ),
          systemJustification: z.string().refine((s) => {
            const words = s.split(" ");
            return words.length <= 200;
          }, "Must be 200 words or less"),
          project: z.string().refine((s) => {
            const words = s.split(" ");
            return words.length <= 150;
          }, "Must be 150 words or less"),
          verification: z.boolean(),
        }),
        Input: Textarea,
        // eslint-disable-next-line
        defaults: { ...initial, verification: false } as any,
        Error: ({ error }) => <span className="text-destructive">{error}</span>,
        Submit: (props) => (
          <Button {...props}>{status === "DRAFT" ? "Submit" : "Save"}</Button>
        ),
      }),
    [initial, teamSystems, status],
  );

  // auto-save application form
  const [saving, setSaving] = useState(false);
  const onUpdate = useDebouncedCallback<
    Parameters<typeof InnerApplicationForm.useOnChange>[0]
  >((fd, fe) => {
    if (Object.values(fe).some((v) => Boolean(v))) {
      console.warn(fe);
      return;
    }

    void (async () => {
      setSaving(true);
      await updateAppAction(JSON.stringify(fd));
      setSaving(false);
    })();
  }, 500);

  InnerApplicationForm.useOnChange(onUpdate);

  const system1Value = InnerApplicationForm.Field.System1.useValue();
  const system2Value = InnerApplicationForm.Field.System2.useValue();
  const system3Value = InnerApplicationForm.Field.System3.useValue();

  const systemStrings = [system1Value, system2Value, system3Value].filter(
    Boolean,
  );
  const systemListString =
    systemStrings.length > 1
      ? systemStrings
          .map(
            (s, i) =>
              s +
              (i === systemStrings.length - 2
                ? ", and "
                : i !== systemStrings.length - 1
                  ? ", "
                  : ""),
          )
          .join("")
      : systemStrings[0];

  const checkboxValue = InnerApplicationForm.Field.Verification.useValue();

  const router = useRouter();

  return (
    <InnerApplicationForm
      className="flex flex-col gap-4 pt-4"
      onSubmit={async () => {
        await submitApplication();

        router.refresh();
      }}
    >
      <div className="text-muted-foreground flex items-center gap-1">
        <Badge className="mr-1">{status}</Badge>
        <span className="text-sm">{saving ? "Syncing" : "Synced"}</span>
        {saving ? (
          <LoaderCircleIcon className="h-3 w-3 animate-spin" />
        ) : (
          <CheckIcon className="h-3 w-3" />
        )}
      </div>
      <div className="space-y-2">
        <p>Why are you interested in LHR?</p>
        <InnerApplicationForm.Field.Interest
          className="w-lg resize-none"
          placeholder="150 word limit"
          disabled={disabled}
        />
        <InnerApplicationForm.Error.Interest />
      </div>
      <div className="space-y-2">
        <p>System Preference (Ranked)</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">1</span>
          <Select
            value={system1Value}
            onValueChange={(v) =>
              InnerApplicationForm.Field.System1.setValue(v)
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(InnerApplicationForm.Field.System1)
                .slice(0, teamSystems.length)

                .map((systemName) => (
                  <SelectItem key={systemName} value={systemName}>
                    {systemName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">2</span>
          <Select
            value={system2Value}
            onValueChange={(v) =>
              InnerApplicationForm.Field.System2.setValue(v)
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(InnerApplicationForm.Field.System2)
                .slice(0, teamSystems.length)

                .map((systemName) => (
                  <SelectItem key={systemName} value={systemName}>
                    {systemName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">3</span>
          <Select
            value={system3Value}
            onValueChange={(v) =>
              InnerApplicationForm.Field.System3.setValue(v)
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(InnerApplicationForm.Field.System3)
                .slice(0, teamSystems.length)
                .map((systemName) => (
                  <SelectItem key={systemName} value={systemName}>
                    {systemName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <p>
          Why are you interested in {systemListString ?? "the above systems"}?
        </p>
        <InnerApplicationForm.Field.SystemJustification
          className="w-lg resize-none"
          placeholder="200 word limit"
          disabled={disabled}
        />
        <InnerApplicationForm.Error.SystemJustification />
      </div>
      <div className="space-y-2">
        <p>Tell us about a project of yours (optional picture)</p>
        <InnerApplicationForm.Field.Project
          className="w-lg resize-none"
          placeholder="150 word limit"
          disabled={disabled}
        />
        <InnerApplicationForm.Error.Project />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={checkboxValue}
          onCheckedChange={(v) =>
            InnerApplicationForm.Field.Verification.setValue(Boolean(v))
          }
          disabled={disabled}
        />
        <p>
          I attest everything on this application is truthful and is written by
          me.
        </p>
      </div>
      <div>
        <InnerApplicationForm.Event.Submit disabled={disabled} />
      </div>
    </InnerApplicationForm>
  );
};

export default ApplicationForm;
