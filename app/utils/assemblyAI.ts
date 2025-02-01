const getApiKey = () => {
  const API_KEY = process.env.ASSEMBLYAI_API_KEY || process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY
  if (!API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY is not set in the environment variables")
  }
  return API_KEY
}

const BASE_URL = "https://api.assemblyai.com/v2"

export async function transcribeVideo(fileBuffer: ArrayBuffer, fileName: string): Promise<any> {
  const API_KEY = getApiKey()
  try {
    const uploadUrl = await uploadFile(fileBuffer, fileName)
    const transcriptId = await startTranscription(uploadUrl)
    return await pollForTranscriptionResult(transcriptId)
  } catch (error) {
    console.error("Error in transcribeVideo:", error)
    throw error
  }
}

async function uploadFile(fileBuffer: ArrayBuffer, fileName: string): Promise<string> {
  const API_KEY = getApiKey()
  try {
    const response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}\n${errorBody}`)
    }

    const data = await response.json()
    return data.upload_url
  } catch (error) {
    console.error("Error in uploadFile:", error)
    throw error
  }
}

async function startTranscription(audioUrl: string): Promise<string> {
  const API_KEY = getApiKey()
  try {
    const response = await fetch(`${BASE_URL}/transcript`, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true,
        speaker_labels: true,
        sentiment_analysis: true,
        entity_detection: true,
        auto_chapters: true,
        content_safety: true,
        iab_categories: true,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Failed to start transcription: ${response.status} ${response.statusText}\n${errorBody}`)
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error("Error in startTranscription:", error)
    throw error
  }
}

async function pollForTranscriptionResult(transcriptId: string): Promise<any> {
  const API_KEY = getApiKey()
  let attempts = 0
  const maxAttempts = 60 // 5 minutes of polling

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
        headers: {
          Authorization: API_KEY,
        },
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Failed to get transcription status: ${response.status} ${response.statusText}\n${errorBody}`)
      }

      const data = await response.json()

      if (data.status === "completed") {
        return data
      } else if (data.status === "error") {
        throw new Error(`Transcription failed: ${data.error}`)
      }

      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    } catch (error) {
      console.error("Error in pollForTranscriptionResult:", error)
      throw error
    }
  }

  throw new Error("Transcription timed out")
}

export async function getTranscriptInFormat(transcriptId: string, format: "txt" | "srt" | "vtt"): Promise<string> {
  const API_KEY = getApiKey()
  try {
    const response = await fetch(`${BASE_URL}/transcript/${transcriptId}/${format}`, {
      headers: {
        Authorization: API_KEY,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Failed to get transcript in ${format} format: ${response.status} ${response.statusText}\n${errorBody}`,
      )
    }

    return await response.text()
  } catch (error) {
    console.error(`Error in getTranscriptInFormat:`, error)
    throw error
  }
}

export async function startRealTimeTranscription(audioStream: MediaStream): Promise<string> {
  const API_KEY = getApiKey()

  try {
    const response = await fetch(`${BASE_URL}/realtime/token`, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in: 3600 }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Failed to get real-time transcription token: ${response.status} ${response.statusText}\n${errorBody}`,
      )
    }

    const data = await response.json()
    if (!data.token) {
      throw new Error("Token not found in the response")
    }

    return data.token
  } catch (error) {
    console.error("Error in startRealTimeTranscription:", error)
    throw error
  }
}

