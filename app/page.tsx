"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const COURSE_ID = "default";
const SUGGESTED_QUESTIONS = [
  "Can you summarize the key idea from this lesson?",
  "Explain this concept in simpler language.",
  "Help me get started on the assignment.",
  "What should I focus on before the quiz?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello. I can help with concepts, assignments, and quick explanations from the course.",
    },
  ]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        throw new Error("The tutor could not answer right now.");
      }

      const data = (await response.json()) as {
        answer?: string;
        message?: string;
      };

      const nextAnswer = data.answer ?? data.message;

      if (!nextAnswer) {
        throw new Error("The tutor response was empty.");
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
          : "Something went wrong while contacting the tutor."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(209,24,50,0.14),_transparent_34%),linear-gradient(180deg,_#f8f4f2_0%,_#f5f7fa_45%,_#eef2f6_100%)] px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <header className="flex flex-col gap-6 border-b border-slate-200/80 px-5 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex w-fit items-center rounded-full border border-[#d11832]/15 bg-[#d11832]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b0142a]">
                IDA AI Tutor
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Course guidance, without leaving the lesson
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Ask for explanations, summaries, or help with course tasks in
                  a simple assistant built for embedded learning flows.
                </p>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-right shadow-sm sm:block">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Status
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {isLoading ? "Generating answer" : "Ready to help"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Use it for
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Clarifying concepts and lecture material
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Best prompt
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Include the topic, problem, and where you are stuck
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Response style
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Short, course-focused, and learner-friendly
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <article
                  key={message.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-sm ${
                      isAssistant
                        ? "border border-slate-200 bg-white text-slate-800"
                        : "bg-[#d11832] text-white"
                    }`}
                  >
                    <p
                      className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] ${
                        isAssistant ? "text-slate-400" : "text-white/70"
                      }`}
                    >
                      {isAssistant ? "Assistant" : "You"}
                    </p>
                    <div className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">
                      {message.content}
                    </div>
                  </div>
                </article>
              );
            })}

            {isLoading ? (
              <article className="flex justify-start">
                <div className="max-w-[85%] rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-800 shadow-sm">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Assistant
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d11832] [animation-delay:-0.3s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d11832] [animation-delay:-0.15s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d11832]" />
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </section>

        <footer className="border-t border-slate-200/80 bg-white/90 px-5 py-5 sm:px-8">
          <form className="mx-auto max-w-3xl" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="course-question">
              Ask the course assistant
            </label>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <input
                  id="course-question"
                  className="min-h-14 flex-1 rounded-[1.25rem] bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about the lesson, assignment, or concept..."
                  value={question}
                />
                <button
                  className="inline-flex h-12 items-center justify-center rounded-[1.1rem] bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isLoading || !question.trim()}
                  type="submit"
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-[#d11832]/30 hover:bg-[#d11832]/5 hover:text-slate-950"
                  onClick={() => setQuestion(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>
        </footer>
      </div>
    </main>
  );
}
