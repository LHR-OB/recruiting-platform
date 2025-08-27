"use client";

import type { InferSelectModel } from "drizzle-orm";
import { CheckIcon, LoaderCircleIcon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ozef from "ozef";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
  updateAppAction: (json: string) => Promise<string | void>;
  teamSystems: InferSelectModel<typeof systems>[];
  status: InferSelectModel<typeof applications>["status"];
  disabled: boolean;
  submitApplication: () => Promise<string | void>;
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
          verification: z.boolean().refine((v) => v, "Must be checked"),
        }),
        Input: Textarea,
        // eslint-disable-next-line
        defaults: initial as any,
        Error: ({ error }) => <span className="text-destructive">{error}</span>,
        Submit: (props) => (
          <Button form="application" {...props}>
            Submit
          </Button>
        ),
      }),
    [initial, teamSystems],
  );

  // auto-save application form
  const [saving, setSaving] = useState(false);
  const onUpdate = useDebouncedCallback<
    Parameters<typeof InnerApplicationForm.useOnChange>[0]
  >((fd, fe) => {
    console.log(fe);
    if (Object.values(fe).some((v) => Boolean(v))) {
      console.warn(fe);
      return;
    }

    void (async () => {
      setSaving(true);
      const res = await updateAppAction(JSON.stringify(fd));
      if (res) {
        toast.error(res);
      }
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

  let duplicateSystems = false;
  if (systemStrings.length !== new Set(systemStrings).size)
    duplicateSystems = true;

  const checkboxValue = InnerApplicationForm.Field.Verification.useValue();

  const router = useRouter();

  const Form = (
    <InnerApplicationForm
      id="application"
      className="flex flex-col gap-4 pt-4"
      onSubmit={async (_, { setError }) => {
        if (duplicateSystems) {
          setError("system3", "System preferences cannot have duplicates");
          return;
        } else {
          setError("system3", "");
        }

        try {
          const res = await submitApplication();

          if (res) {
            toast.error(res);
          } else {
            toast.success("Successfully submitted application", {
              description: "Your application has been submitted successfully.",
              position: "bottom-left",
            });
            router.refresh();
          }
        } catch (e) {
          if (e instanceof Error) {
            toast.error("Failed to submit application", {
              description: e.message,
              position: "bottom-left",
            });
          } else {
            toast.error(
              "An unexpected error occurred while submitting the application",
              { position: "bottom-left" },
            );
          }
        }
      }}
    >
      <div className="text-muted-foreground flex items-center gap-1">
        <Badge className="mr-1">
          {((status === "NEEDS_REVIEW" || status === "REVIEWED") &&
            "SUBMITTED") ||
            status}
        </Badge>
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
          className="max-w-lg resize-none"
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
        <InnerApplicationForm.Error.System3 />
      </div>
      <div className="space-y-2">
        <p>
          Why are you interested in {systemListString ?? "the above systems"}?
        </p>
        <InnerApplicationForm.Field.SystemJustification
          className="max-w-lg resize-none"
          placeholder="200 word limit"
          disabled={disabled}
        />
        <InnerApplicationForm.Error.SystemJustification />
      </div>
      <div className="space-y-2">
        <p>Tell us about a project of yours</p>
        <InnerApplicationForm.Field.Project
          className="max-w-lg resize-none"
          placeholder="150 word limit"
          disabled={disabled}
        />
        <InnerApplicationForm.Error.Project />
      </div>
      <div className="flex gap-2">
        <Checkbox
          checked={checkboxValue}
          onCheckedChange={(v) =>
            InnerApplicationForm.Field.Verification.setValue(Boolean(v))
          }
          className="mt-1"
          disabled={disabled}
        />
        <p>
          I attest everything on this application is truthful and is written by
          me. I affirm that I cannot make any changes to this application after
          submission.
        </p>
      </div>
      <InnerApplicationForm.Error.Verification />
      <Dialog modal={true}>
        <DialogTrigger asChild>
          <Button className="w-fit">Submit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to submit?</DialogTitle>
            <DialogDescription>
              Once you submit, you will not be able to make any changes to your
              application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" className="w-fit">
                Cancel
              </Button>
            </DialogClose>
            <InnerApplicationForm.Event.Submit
              disabled={disabled}
              className="w-fit"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </InnerApplicationForm>
  );

  return Form;
};

export default ApplicationForm;
