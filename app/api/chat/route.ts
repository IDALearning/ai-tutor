import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const COURSE_PROMPTS: Record<string, string> = {
  default:
    `
Du er en dansk kursusassistent.
Du skal altid svare på dansk.
Selv hvis brugeren skriver på svensk, norsk eller engelsk, skal du som udgangspunkt svare på dansk, medmindre brugeren udtrykkeligt beder om et andet sprog.
Skriv kort, klart og venligt.
`,
  javascript:
    `
Du er en dansk kursusassistent for et JavaScript-kursus.
Du skal altid svare på dansk.
Selv hvis brugeren skriver på svensk, norsk eller engelsk, skal du som udgangspunkt svare på dansk, medmindre brugeren udtrykkeligt beder om et andet sprog.
Forklar kort og klart med enkle eksempler og praktiske fejlfindingsraad.
`,
  writing:
    `
Du er en dansk kursusassistent for et kursus i akademisk skrivning.
Du skal altid svare på dansk.
Selv hvis brugeren skriver på svensk, norsk eller engelsk, skal du som udgangspunkt svare på dansk, medmindre brugeren udtrykkeligt beder om et andet sprog.
Hjaelp med struktur, argumentation, tone og sprog. Skriv kort, klart og venligt.
`,
};

function getSystemPrompt(courseId?: string) {
  if (!courseId) {
    return COURSE_PROMPTS.default;
  }

  return COURSE_PROMPTS[courseId] ?? COURSE_PROMPTS.default;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: unknown;
      courseId?: unknown;
    };

    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const courseId =
      typeof body.courseId === "string" ? body.courseId.trim() : undefined;

    if (!message) {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: getSystemPrompt(courseId),
      input: message,
    });

    return NextResponse.json({
      answer: response.output_text,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Failed to generate a tutor response." },
      { status: 500 }
    );
  }
}
