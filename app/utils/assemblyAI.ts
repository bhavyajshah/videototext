const FETCH_TIMEOUT = 120000 // 2 minutes
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
const BASE_URL = "https://api.assemblyai.com/v2"

function getApiKey(): string {
  const API_KEY = process.env.ASSEMBLYAI_API_KEY
  if (!API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY is not set in the environment variables")
  }
  return API_KEY
}

export async function transcribeVideo(
  fileBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (progress: number) => Promise<void>,
): Promise<any> {
  const API_KEY = getApiKey()
  try {
    console.log("Starting file upload...")
    const uploadUrl = await uploadFile(fileBuffer, fileName, onProgress)
    console.log("File uploaded successfully. Starting transcription...")
    const transcriptId = await startTranscription(uploadUrl)
    console.log("Transcription started. Polling for results...")
    return await pollForTranscriptionResult(transcriptId)
  } catch (error) {
    console.error("Error in transcribeVideo:", error)
    throw error
  }
}

async function uploadFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (progress: number) => Promise<void>,
): Promise<string> {
  const API_KEY = getApiKey()
  try {
    const totalChunks = Math.ceil(fileBuffer.byteLength / CHUNK_SIZE)
    let uploadUrl = ""

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min((i + 1) * CHUNK_SIZE, fileBuffer.byteLength)
      const chunk = fileBuffer.slice(start, end)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      try {
        const response = await fetch(
          `${BASE_URL}/upload${uploadUrl ? "?upload_url=" + encodeURIComponent(uploadUrl) : ""}`,
          {
            method: "POST",
            headers: {
              Authorization: API_KEY,
              "Content-Type": "application/octet-stream",
            },
            body: chunk,
            signal: controller.signal,
          },
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorBody = await response.text()
          console.error(`Upload failed with status ${response.status}: ${errorBody}`)
          throw new Error(`Failed to upload file: ${response.status} ${response.statusText}\n${errorBody}`)
        }

        const data = await response.json()
        uploadUrl = data.upload_url

        if (onProgress) {
          await onProgress(((i + 1) / totalChunks) * 100)
        }
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    // Ensure the upload URL starts with http
    if (!uploadUrl.startsWith('http')) {
      uploadUrl = `http:${uploadUrl}`
    }

    return uploadUrl
  } catch (error) {
    console.error("Error in uploadFile:", error)
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Upload request timed out")
      }
      throw new Error(`Upload failed: ${error.message}`)
    } else {
      throw new Error("Upload failed due to an unknown error")
    }
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

      // Wait 5 seconds before next attempt
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