import type { AssistantMessage } from "./types";

type AssistantMessageThreadProps = {
  messages: AssistantMessage[];
};

export const AssistantMessageThread = ({
  messages,
}: AssistantMessageThreadProps): React.JSX.Element | null => {
  if (messages.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
        Chat context
      </p>
      <div className="space-y-3">
        {messages.map((message) => (
          <article
            className={`rounded-2xl px-4 py-3 ${
              message.role === "user"
                ? "bg-blue-50 text-ink-900"
                : "bg-surface-50 text-ink-900"
            }`}
            key={message.id}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              {message.attachmentName ? (
                <span className="truncate rounded-full bg-white/80 px-2 py-1 text-[0.65rem] font-semibold text-primary-700">
                  {message.attachmentName}
                </span>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {message.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
