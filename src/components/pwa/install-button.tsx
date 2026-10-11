"use client";

import { Download, Share } from "lucide-react";
import { useState } from "react";
import { promptInstall, usePwa } from "@/lib/pwa/store";

/**
 * "Install app" entry for the dashboard sidebar. Shown only when installing is possible:
 * browsers with an install prompt trigger it directly; iPhone and iPad get the two steps
 * to follow, as Safari has no prompt. Renders nothing once the app is installed.
 */
export function InstallButton() {
  const { installable, installed, ios } = usePwa();
  const [showSteps, setShowSteps] = useState(false);

  if (installed || (!installable && !ios)) return null;

  return (
    <div>
      <button
        type="button"
        aria-expanded={ios ? showSteps : undefined}
        onClick={() => (installable ? void promptInstall() : setShowSteps((open) => !open))}
        className="flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-left text-sm text-ink/80 hover:text-ink"
      >
        <span className="grid size-4 place-items-center">
          <Download className="size-4" />
        </span>
        <span className="flex-1 truncate">Install app</span>
      </button>
      {showSteps && !installable ? (
        <p className="mx-3 mb-2 rounded-2xl bg-surface p-3 text-xs leading-relaxed text-muted">
          In Safari, tap <Share className="inline size-3.5 align-text-bottom text-ink" aria-label="Share" />, then choose <span className="text-ink">Add to Home Screen</span>.
        </p>
      ) : null}
    </div>
  );
}
