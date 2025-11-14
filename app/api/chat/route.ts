import { NextResponse } from "next/server"
import { generateText } from "ai"

// IMPORTANT: Do not use edge runtime with AI SDK per guidelines.

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = (body?.messages ?? []) as { role: string; content: string }[]

    const prompt = messages.length
      ? `You are AssetGuard AI. Respond helpfully and concisely.\n\nUser: ${messages[messages.length - 1].content}`
      : "You are AssetGuard AI. Greet the user."

    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      prompt,
    })

    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json({ text: "Sorry, I had trouble replying. Please try again." }, { status: 200 })
  }
}
