import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useLanguage } from "../context/LanguageContext";
import { queryKeys } from "../lib/queryKeys";
import { translateText } from "../lib/i18n";
import { cn } from "../lib/utils";

export function InstanceGeneralSettings() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { language, setLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings" },
      { label: "General" },
    ]);
  }, [setBreadcrumbs]);

  const generalQuery = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) =>
      instanceSettingsApi.updateGeneral({ censorUsernameInLogs: enabled }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : translateText("Failed to update general settings."));
    },
  });

  if (generalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{translateText("Loading general settings...")}</div>;
  }

  if (generalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {generalQuery.error instanceof Error
          ? generalQuery.error.message
          : translateText("Failed to load general settings.")}
      </div>
    );
  }

  const censorUsernameInLogs = generalQuery.data?.censorUsernameInLogs === true;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{translateText("General")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {translateText("Configure instance-wide defaults that affect how operator-visible logs are displayed.")}
        </p>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">{translateText("Censor username in logs")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {translateText("Hide the username segment in home-directory paths and similar operator-visible log output. Standalone username mentions outside of paths are not yet masked in the live transcript view. This is off by default.")}
            </p>
          </div>
          <button
            type="button"
            data-slot="toggle"
            aria-label={translateText("Toggle username log censoring")}
            disabled={toggleMutation.isPending}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              censorUsernameInLogs ? "bg-green-600" : "bg-muted",
            )}
            onClick={() => toggleMutation.mutate(!censorUsernameInLogs)}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                censorUsernameInLogs ? "translate-x-4.5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">{translateText("Interface language")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {translateText("Choose the display language for the board UI. This preference is stored locally in this browser.")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-1">
              <Button
                type="button"
                size="sm"
                variant={language === "pl" ? "default" : "ghost"}
                onClick={() => setLanguage("pl")}
              >
                Polski
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === "en" ? "default" : "ghost"}
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {translateText("Current language")}: {language === "pl" ? "Polski" : "English"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
