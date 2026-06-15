import { BarChart3, Bot, Paperclip, Send } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { SelectButton } from "@repo/ui/components/select-button";

const modelOptions = [
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 mini", value: "gpt-4.1-mini" },
  { label: "o3", value: "o3" },
];

type AssistantComposerProps = {
  draft: string;
  isSubmitting?: boolean;
  model: string;
  onDraftChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSubmit: () => void;
};

export const AssistantComposer = ({
  draft,
  isSubmitting = false,
  model,
  onDraftChange,
  onModelChange,
  onSubmit,
}: AssistantComposerProps): React.JSX.Element => (
  <div className="shrink-0 rounded-2xl border border-border bg-card p-3 shadow-xs focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-100">
    <textarea
      aria-label="Ask AI Assistant"
      className="min-h-16 w-full resize-none bg-transparent px-2 py-1 text-sm text-ink-900 outline-none placeholder:text-primary-700/70"
      disabled={isSubmitting}
      onChange={(event) => onDraftChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      }}
      placeholder="Ask about loads, drivers, incidents, performance..."
      value={draft}
    />
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center">
        <Button
          aria-label="Attach file"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Paperclip />
        </Button>
        <Button
          aria-label="Add chart"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <BarChart3 />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Bot className="hidden size-4 text-primary-700 sm:block" />
        <SelectButton
          className="h-9 min-w-36 border-0 px-2 text-xs font-semibold shadow-none"
          onValueChange={onModelChange}
          options={modelOptions}
          placeholder="Select model"
          value={model}
        />
        <Button
          aria-label="Send message"
          className="bg-primary-700 hover:bg-primary-600"
          disabled={!draft.trim() || isSubmitting}
          onClick={onSubmit}
          size="icon"
          type="button"
        >
          <Send />
        </Button>
      </div>
    </div>
  </div>
);
