import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST(req: Request) {
  const body = await req.json()
  const { transcript_id, status } = body

  if (status === "completed") {
    const transcriptionResult = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript_id}`, {
      headers: {
        Authorization: process.env.ASSEMBLYAI_API_KEY!,
      },
    }).then((res) => res.json())

    await kv.set(`transcription:${transcript_id}`, {
      status: "completed",
      progress: 100,
      text: transcriptionResult.text,
    })
  } else if (status === "error") {
    await kv.set(`transcription:${transcript_id}`, {
      status: "error",
      progress: 100,
      error: "Transcription failed",
    })
  }

  return NextResponse.json({ success: true })
}

