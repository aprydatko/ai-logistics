"use client";

import { PanelRightOpen, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@repo/ui/components/button";

import { AssistantComposer } from "../assistant-composer";
import { AssistantContextPanel } from "../assistant-context-panel";
import { AssistantResults } from "../assistant-results";
import { AssistantMessageThread } from "./assistant-message-thread";
import { AssistantStatusCard } from "./assistant-status-card";
import { useAssistantWorkspace } from "./use-assistant-workspace";

export const AssistantWorkspace = (): React.JSX.Element => {
  const [isMessageThreadOpen, setIsMessageThreadOpen] = useState(false);

  const {
    attachment,
    assistantState,
    clearAttachment,
    clearChat,
    draft,
    filters,
    isContextOpen,
    messages,
    model,
    onAttachmentSelect,
    onSelectSkill,
    recentReferences,
    removeFilter,
    selectedSkill,
    setDraft,
    setIsContextOpen,
    setModel,
    submit,
  } = useAssistantWorkspace();

  return (
    <section
      className={`grid min-h-0 gap-4 xl:h-full ${
        isContextOpen ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : ""
      }`}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl leading-9 text-ink-900">AI Assistant</h1>
            <p className="max-w-2xl text-sm text-primary-700">
              Clean workspace for step-by-step AI integration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={clearChat} type="button" variant="outline">
              <RotateCcw className="size-4" />
              Clear chat
            </Button>
            {!isContextOpen ? (
              <Button
                onClick={() => setIsContextOpen(true)}
                type="button"
                variant="outline"
              >
                <PanelRightOpen className="size-4" />
                Context
              </Button>
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-xl border border-border bg-card py-4 pl-4 pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] sm:py-5 sm:pl-5 sm:pr-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-button]:h-2 [&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-primary-600">
            <AssistantStatusCard state={assistantState} />
            <AssistantMessageThread
              isOpen={isMessageThreadOpen}
              messages={messages}
              onToggle={() => setIsMessageThreadOpen((current) => !current)}
            />
            {assistantState.resultView?.type === "loads_table" ? (
              <AssistantResults result={assistantState.resultView} />
            ) : null}
          </div>

          <AssistantComposer
            attachment={attachment}
            draft={draft}
            onAttachmentSelect={onAttachmentSelect}
            onClearAttachment={clearAttachment}
            onClearSkill={() => onSelectSkill(null)}
            isSubmitting={assistantState.status === "loading"}
            model={model}
            onDraftChange={setDraft}
            onModelChange={setModel}
            selectedSkill={selectedSkill}
            onSubmit={submit}
          />
        </div>
      </div>

      {isContextOpen ? (
        <AssistantContextPanel
          filters={filters}
          onAction={setDraft}
          onClose={() => setIsContextOpen(false)}
          onRemoveFilter={removeFilter}
          recentReferences={recentReferences}
          onSelectSkill={onSelectSkill}
        />
      ) : null}
    </section>
  );
};
