"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const COURSE_ID = "default";
const SUGGESTED_QUESTIONS = [
  "Opsummér hovedpointen i denne lektion",
  "Forklar begrebet i enklere sprog",
  "Hjælp mig i gang med opgaven",
  "Hvad skal jeg fokusere på før quizzen?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hej. Jeg kan hjælpe dig med forklaringer, opsummeringer og spørgsmål til kurset.",
    },
  ]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedQuestion,
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedQuestion,
          courseId: COURSE_ID,
        }),
      });

      if (!response.ok) {
        throw new Error("Assistenten kunne ikke svare lige nu.");
      }

      const data = (await response.json()) as {
        answer?: string;
        message?: string;
      };

      const nextAnswer = data.answer ?? data.message;

      if (!nextAnswer) {
        throw new Error("Assistentens svar var tomt.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: nextAnswer,
        },
      ]);
      setQuestion("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Der opstod en fejl ved kontakt til assistenten."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] p-3 text-slate-950 sm:p-4">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-h-[900px] w-full max-w-[720px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:h-[calc(100vh-2rem)]">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <p className="text-base font-semibold tracking-tight text-slate-950">
            IDA AI Tutor
          </p>
          <p className="mt-1 truncate text-sm text-slate-500">
            Hurtig hjælp til spørgsmål, begreber og opgaver i kurset.
          </p>
        </header>

        <section className="flex-1 overflow-y-auto bg-slate-50/70 px-3 py-4 sm:px-4">
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <article
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isAssistant
                        ? "rounded-tl-xl border border-slate-200 bg-white text-slate-800"
                        : "rounded-tr-xl bg-[#d11832] text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                </article>
              );
            })}

            {isLoading ? (
              <article className="flex justify-start">
                <div className="max-w-[88%] rounded-3xl rounded-tl-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  Tænker...
                </div>
              </article>
            ) : null}

            <div ref={endOfMessagesRef} />
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#d11832]/30 hover:bg-[#d11832]/5 hover:text-slate-950"
                  onClick={() => setQuestion(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="course-question">
              Spørg kursusassistenten
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <input
                id="course-question"
                className="h-11 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Skriv dit spørgsmål her..."
                value={question}
              />
              <button
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isLoading || !question.trim()}
                type="submit"
              >
                {isLoading ? "Sender..." : "Send"}
              </button>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </footer>
      </div>
    </main>
  );
}
