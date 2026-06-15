import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";

import { statusClasses, statusLabel } from "./constants";
import type { AssistantRequestState } from "./types";

type AssistantStatusCardProps = {
  state: AssistantRequestState;
};

export const AssistantStatusCard = ({
  state,
}: AssistantStatusCardProps): React.JSX.Element => (
  <section
    className={`rounded-2xl border p-4 shadow-xs ${statusClasses[state.status]}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em]">
          Assistant status
        </p>
        <h2 className="mt-2 text-sm font-bold">{statusLabel[state.status]}</h2>
      </div>
      {state.status === "loading" ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : state.status === "error" ? (
        <AlertCircle className="size-4" />
      ) : (
        <Sparkles className="size-4" />
      )}
    </div>
    <p className="mt-3 text-sm leading-6">{state.detail}</p>
  </section>
);
