"use server"

import { transcribeVideo, getTranscriptInFormat } from "../utils/assemblyAI"
import { headers } from "next/headers"

function getBaseUrl() {
  const headersList = headers()
  const host = headersList.get("host") || process.env.NEXT_PUBLIC_API_URL
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  return `${protocol}://${host}`
}

export async function convertVideoToText(formData: FormData): Promise<any> {
  try {
    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      throw new Error("No valid file provided")
    }

    const buffer = await file.arrayBuffer()
    const result = await transcribeVideo(buffer, file.name)
    const baseUrl = getBaseUrl()
    return {
      ...result,
      baseUrl,
    }
  } catch (error) {
    console.error("Error in video-to-text conversion:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to convert video to text: ${error.message}`)
    } else {
      throw new Error("Failed to convert video to text. An unknown error occurred.")
    }
  }
}

export async function getTranscriptFormat(transcriptId: string, format: "txt" | "srt" | "vtt"): Promise<string> {
  try {
    return await getTranscriptInFormat(transcriptId, format)
  } catch (error) {
    console.error(`Error getting transcript in ${format} format:`, error)
    if (error instanceof Error) {
      throw new Error(`Failed to get transcript in ${format} format: ${error.message}`)
    } else {
      throw new Error(`Failed to get transcript in ${format} format. An unknown error occurred.`)
    }
  }
}