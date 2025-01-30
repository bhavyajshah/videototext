"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { convertVideoToText, getTranscriptFormat } from "../actions/convertVideoToText"
import { Progress } from "@/components/ui/progress"
import { startRealTimeTranscription } from "../utils/assemblyAI"
import WordCloud from "./WordCloud"
import AudioVisualizer from "./AudioVisualizer"
import KeywordTimeline from "./KeywordTimeline"
import ChaptersList from "./ChaptersList"
import ContentSafety from "./ContentSafety"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Play, Pause, RotateCcw, Download, Mic, FileAudio } from "lucide-react"
import { motion } from "framer-motion"
import type React from "react" // Added import for React

export default function VideoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>("")
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [isAccessible, setIsAccessible] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<number | null>(null)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a video or audio file first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(0)
    try {
      const formData = new FormData(formRef.current!)
      const result = await convertVideoToText(formData)
      setTranscriptionResult(result)
      toast({
        title: "Success",
        description: "File converted to text successfully!",
      })
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to convert file to text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  const handleDownload = async (format: "txt" | "srt" | "vtt") => {
    if (!transcriptionResult || !transcriptionResult.id) {
      toast({
        title: "Error",
        description: "No transcription result available to download.",
        variant: "destructive",
      })
      return
    }

    try {
      const content = await getTranscriptFormat(transcriptionResult.id, format)
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transcript.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error in handleDownload:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Failed to download ${format.toUpperCase()} file. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const startRealTimeTranscriptionHandler = async () => {
    if (!videoRef.current) {
      toast({
        title: "Error",
        description: "Video or audio element not found.",
        variant: "destructive",
      })
      return
    }

    try {
      let stream: MediaStream
      if (file?.type.startsWith("audio")) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = audioContext.createMediaElementSource(videoRef.current as HTMLAudioElement)
        const destination = audioContext.createMediaStreamDestination()
        source.connect(destination)
        stream = destination.stream
      } else {
        stream = (videoRef.current as HTMLVideoElement).captureStream()
      }

      setAudioStream(stream)

      const token = await startRealTimeTranscription(stream)
      console.log("Received token:", token)

      const socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?token=${token}`)

      socket.onopen = () => {
        console.log("WebSocket connection opened")
        toast({
          title: "Success",
          description: "Real-time transcription started.",
        })
      }

      socket.onmessage = (message) => {
        const data = JSON.parse(message.data)
        if (data.message_type === "FinalTranscript") {
          setRealTimeTranscript((prev) => prev + " " + data.text)
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        toast({
          title: "Error",
          description: "WebSocket connection error. Please try again.",
          variant: "destructive",
        })
      }

      socket.onclose = () => {
        console.log("WebSocket connection closed")
      }
    } catch (error) {
      console.error("Failed to start real-time transcription:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start real-time transcription. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (file) {
      const mediaUrl = URL.createObjectURL(file)
      if (videoRef.current) {
        videoRef.current.src = mediaUrl
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    }
  }, [file])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const resetMedia = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setFile(new File([blob], "recorded_audio.webm", { type: "audio/webm" }))
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && transcriptionResult && transcriptionResult.utterances) {
      const currentTime = videoRef.current.currentTime * 1000 // Convert to milliseconds
      const currentUtterance = transcriptionResult.utterances.find(
        (u: any) => currentTime >= u.start && currentTime <= u.end,
      )
      setCurrentSpeaker(currentUtterance ? currentUtterance.speaker : null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Video and Audio Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <Input
                type="file"
                name="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
                disabled={isLoading || isRecording}
                className="flex-grow"
              />
              <Button type="submit" disabled={!file || isLoading || isRecording} className="w-full md:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isLoading ? "Converting..." : "Convert"}
              </Button>
            </div>
          </form>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              className="w-full md:w-auto"
            >
              {isRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>
          {file && (
            <div className="mt-4 relative">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {file.type.startsWith("video") ? (
                  <video ref={videoRef} className="w-full h-full object-cover" onTimeUpdate={handleTimeUpdate} controls>
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileAudio className="w-16 h-16 text-gray-400" />
                    <audio ref={videoRef as any} className="w-full" onTimeUpdate={handleTimeUpdate} controls>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
                <Button onClick={togglePlayPause} variant="secondary" size="icon" className="rounded-full">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button onClick={resetMedia} variant="secondary" size="icon" className="rounded-full">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {audioStream && <AudioVisualizer audioStream={audioStream} />}
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-6">
            <Progress value={progress} className="w-full" />
            <p className="text-center mt-2">Processing... This may take a while for longer files.</p>
          </CardContent>
        </Card>
      )}

      {realTimeTranscript && (
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">{realTimeTranscript}</p>
          </CardContent>
        </Card>
      )}

      {transcriptionResult && (
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl">
          <CardContent className="py-6">
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="safety">Content Safety</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript">
                <h2 className="text-xl font-semibold mb-2">Transcription ({transcriptionResult.language}):</h2>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {transcriptionResult.utterances ? (
                    transcriptionResult.utterances.map((utterance: any, index: number) => (
                      <motion.p
                        key={index}
                        className={`mb-2 p-2 rounded ${currentSpeaker === utterance.speaker
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-gray-200 dark:bg-gray-600"
                          }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <strong className="text-primary">Speaker {utterance.speaker}:</strong> {utterance.text}
                      </motion.p>
                    ))
                  ) : (
                    <p className="whitespace-pre-wrap" lang={transcriptionResult.language}>
                      {transcriptionResult.text}
                    </p>
                  )}
                </div>
                <div className="mt-4 space-x-2">
                  <Button onClick={() => handleDownload("txt")} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download TXT
                  </Button>
                  <Button onClick={() => handleDownload("srt")} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download SRT
                  </Button>
                  <Button onClick={() => handleDownload("vtt")} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download VTT
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="speakers">
                <h2 className="text-xl font-semibold mb-2">Speakers:</h2>
                {transcriptionResult.utterances ? (
                  <div className="space-y-2">
                    {transcriptionResult.utterances.map((utterance: any, index: number) => (
                      <motion.div
                        key={index}
                        className={`p-2 rounded ${currentSpeaker === utterance.speaker
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <strong className="text-primary">Speaker {utterance.speaker}:</strong> {utterance.text}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p>No speaker information available for this transcription.</p>
                )}
              </TabsContent>
              <TabsContent value="sentiment">
                <h2 className="text-xl font-semibold mb-2">Sentiment Analysis:</h2>
                {transcriptionResult.sentiment_analysis_results ? (
                  <div className="space-y-2">
                    {transcriptionResult.sentiment_analysis_results.map((result: any, index: number) => (
                      <motion.div
                        key={index}
                        className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <span
                          className={`font-bold ${result.sentiment === "POSITIVE"
                              ? "text-green-500"
                              : result.sentiment === "NEGATIVE"
                                ? "text-red-500"
                                : "text-yellow-500"
                            }`}
                        >
                          {result.sentiment}
                        </span>
                        : {result.text}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p>No sentiment analysis results available for this transcription.</p>
                )}
              </TabsContent>
              <TabsContent value="wordcloud">
                <h2 className="text-xl font-semibold mb-2">Word Cloud:</h2>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                  <WordCloud text={transcriptionResult.text} />
                </div>
              </TabsContent>
              <TabsContent value="keywords">
                <h2 className="text-xl font-semibold mb-2">Keyword Timeline:</h2>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                  <KeywordTimeline keywords={transcriptionResult.entities} />
                </div>
              </TabsContent>
              <TabsContent value="chapters">
                <h2 className="text-xl font-semibold mb-2">Auto-generated Chapters:</h2>
                {transcriptionResult.chapters ? (
                  <ChaptersList chapters={transcriptionResult.chapters} />
                ) : (
                  <p>No chapters available for this transcription.</p>
                )}
              </TabsContent>
              <TabsContent value="safety">
                <h2 className="text-xl font-semibold mb-2">Content Safety Analysis:</h2>
                {transcriptionResult.content_safety_labels ? (
                  <ContentSafety results={transcriptionResult.content_safety_labels} />
                ) : (
                  <p>No content safety analysis available for this transcription.</p>
                )}
              </TabsContent>
              <TabsContent value="categories">
                <h2 className="text-xl font-semibold mb-2">IAB Categories:</h2>
                {transcriptionResult.iab_categories_result?.labels ? (
                  <ul className="list-disc list-inside space-y-2">
                    {transcriptionResult.iab_categories_result.labels.map((category: string, index: number) => (
                      <motion.li
                        key={index}
                        className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        {category}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p>No IAB categories available for this transcription.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Switch id="accessibility-mode" checked={isAccessible} onCheckedChange={setIsAccessible} />
              <Label htmlFor="accessibility-mode">Accessibility Mode</Label>
            </div>
            <Button onClick={startRealTimeTranscriptionHandler} disabled={!file} className="w-full md:w-auto">
              Start Real-Time Transcription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}