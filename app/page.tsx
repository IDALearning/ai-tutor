"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const SUGGESTED_QUESTIONS = [
  "Opsummér hovedpointen i denne lektion",
  "Forklar begrebet i enklere sprog",
  "Hjælp mig i gang med opgaven",
  "Hvad skal jeg fokusere på før quizzen?",
];

const CLOSED_HEIGHT = 118;
const OPEN_MIN_HEIGHT = 520;

export default function Home() {
  const courseId =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("courseId") ?? "default"
    : "default";

const lessonId =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("lessonId") ?? "intro"
    : "intro";const [isOpen, setIsOpen] = useState(false);
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function sendHeight() {
    if (typeof window === "undefined") {
      return;
    }

    const measureAndSend = () => {
      const containerHeight = containerRef.current?.scrollHeight ?? 0;
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        containerHeight
      );

      const nextHeight = isOpen
        ? Math.max(OPEN_MIN_HEIGHT, documentHeight)
        : CLOSED_HEIGHT;

      window.parent.postMessage(
        { type: "resize-tutor", height: nextHeight },
        "*"
      );
    };

    window.requestAnimationFrame(() => {
      window.setTimeout(measureAndSend, 0);
    });
  }

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    sendHeight();
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    sendHeight();
  }, []);

  async function submitMessage(nextQuestion: string) {
    const trimmedQuestion = nextQuestion.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    setIsOpen(true);
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
          courseId,
          lessonId,
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(question);
  }

  async function handleSuggestedQuestion(suggestion: string) {
    setQuestion(suggestion);
    await submitMessage(suggestion);
  }

  return (
    <main
      className="flex min-h-[110px] justify-center bg-[#f7f8fb] p-2 text-slate-950"
      style={{
        fontFamily: "Montserrat, Arial, sans-serif",
      }}
    >
      <div
        ref={containerRef}
        className={`flex w-full max-w-[720px] flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(0,48,103,0.08)] transition-[height] duration-300 ease-out ${
          isOpen ? "h-[460px]" : "h-[92px]"
        }`}
      >
        {isOpen ? (
          <>
            <header className="shrink-0 bg-[#bc0069] px-4 py-3 text-white sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                    IDA AI Tutor
                  </h1>
                  <p className="mt-1 text-sm text-white/85">
                    Få hjælp uden at forlade lektionen
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Luk
                </button>
              </div>
            </header>

            <section className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void handleSuggestedQuestion(suggestion)}
                    className="rounded-full border border-[#003067]/12 bg-[#f4f8fc] px-3 py-1.5 text-[11px] font-medium leading-4 text-[#003067] transition hover:border-[#003067] hover:bg-[#003067] hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>

            <section className="min-h-0 flex-1 overflow-y-auto bg-[#fafbfc] px-3 py-4 sm:px-4">
              <div className="flex flex-col gap-3.5">
                {messages.map((message) => {
                  const isAssistant = message.role === "assistant";

                  return (
                    <article
                      key={message.id}
                      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-[0_6px_16px_rgba(15,23,42,0.04)] ${
                          isAssistant
                            ? "rounded-tl-md border border-slate-200 bg-white text-slate-800"
                            : "rounded-tr-md border border-[#003067]/10 bg-[#f1f6fb] text-slate-900"
                        }`}
                      >
                        {message.content}
                      </div>
                    </article>
                  );
                })}

                {isLoading ? (
                  <article className="flex justify-start">
                    <div className="max-w-[88%] rounded-[22px] rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                      Tænker...
                    </div>
                  </article>
                ) : null}

                <div ref={endOfMessagesRef} />
              </div>
            </section>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
              <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="course-question">
                  Spørg kursusassistenten
                </label>

                <div className="flex items-center gap-2 rounded-[20px] border border-slate-200 bg-[#f8f9fc] p-2">
                  <input
                    ref={inputRef}
                    id="course-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Skriv dit spørgsmål her..."
                    className="h-11 flex-1 rounded-[14px] border border-transparent bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003067]/20 focus:ring-2 focus:ring-[#003067]/15"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !question.trim()}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] bg-[#bc0069] px-4 text-sm font-semibold text-white transition hover:bg-[#a3005c] disabled:cursor-not-allowed disabled:bg-[#d796bb]"
                  >
                    Send
                  </button>
                </div>

                {error ? <p className="text-sm text-[#bc0069]">{error}</p> : null}
              </form>
            </footer>
          </>
        ) : (
          <section className="flex h-full items-center justify-between gap-4 border-t-4 border-[#bc0069] bg-white px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-slate-950">
                IDA AI Tutor
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">
                Få hjælp til lektionen
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#bc0069] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a3005c]"
            >
              Åbn tutor
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
