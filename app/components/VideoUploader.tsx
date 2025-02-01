"use client"

import "regenerator-runtime/runtime"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { convertVideoToText, getTranscriptFormat } from "../actions/convertVideoToText"
import { Progress } from "@/components/ui/progress"
import WordCloud from "./WordCloud"
import AudioVisualizer from "./AudioVisualizer"
import KeywordTimeline from "./KeywordTimeline"
import ChaptersList from "./ChaptersList"
import ContentSafety from "./ContentSafety"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Play, Pause, RotateCcw, Download, Mic, Volume2, VolumeX } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import TranscriptEditor from "./TranscriptEditor"
import AIInsights from "./AIInsights"
import LanguageSelector from "./LanguageSelector"
import { useSpeechRecognition } from "react-speech-recognition"

export default function VideoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [isAccessible, setIsAccessible] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("en-US")
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const {
    transcript,
    browserSupportsSpeechRecognition,
    resetTranscript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition()

  useEffect(() => {
    if (!isRecording) return

    if (browserSupportsSpeechRecognition) {
      resetTranscript()
      startListening({ continuous: true, language: selectedLanguage })
    }

    return () => {
      stopListening()
    }
  }, [isRecording, selectedLanguage, browserSupportsSpeechRecognition, resetTranscript, startListening, stopListening])

  useEffect(() => {
    setLiveTranscript(interimTranscript)
  }, [interimTranscript])

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
      setAudioStream(stream)
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
    }
    setIsRecording(false)
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
    }
  }

  useEffect(() => {
    if (file && file.type.startsWith("audio")) {
      const audioUrl = URL.createObjectURL(file)
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.load()
      }
    }
  }, [file])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-full">
                <Input
                  type="file"
                  name="file"
                  accept="video/*,audio/*"
                  onChange={handleFileChange}
                  disabled={isLoading || isRecording}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button type="submit" disabled={!file || isLoading || isRecording}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isLoading ? "Converting..." : "Convert"}
                </Button>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "secondary"}
                >
                  {isRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                  {isRecording ? "Stop" : "Record"}
                </Button>
              </div>
            </div>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              disabled={isRecording}
            />
          </form>

          {file && file.type.startsWith("audio") && (
            <div className="mt-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={togglePlayPause}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0
                          audioRef.current.pause()
                          setIsPlaying(false)
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary-foreground">
                        {formatTime(currentTime)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-primary">{formatTime(duration)}</span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-foreground">
                    <div
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                    ></div>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {audioStream && (
            <div className="mt-6">
              <AudioVisualizer audioStream={audioStream} />
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Processing Your File</h2>
              <p className="text-muted-foreground mb-4">This may take a few minutes for longer files.</p>
              <Progress value={progress} className="w-64 mx-auto" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {transcriptionResult && (
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="safety">Content Safety</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript">
                <h2 className="text-xl font-semibold mb-2">Transcription ({transcriptionResult.language}):</h2>
                <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap" lang={transcriptionResult.language}>
                    {transcriptionResult.text}
                  </p>
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
              <TabsContent value="editor">
                <TranscriptEditor transcript={transcriptionResult.text} onSave={console.log} />
              </TabsContent>
              <TabsContent value="insights">
                <AIInsights transcriptionResult={transcriptionResult} />
              </TabsContent>
              <TabsContent value="wordcloud">
                <WordCloud text={transcriptionResult.text} />
              </TabsContent>
              <TabsContent value="keywords">
                <KeywordTimeline keywords={transcriptionResult.auto_highlights_result.results} />
              </TabsContent>
              <TabsContent value="chapters">
                <ChaptersList chapters={transcriptionResult.chapters} />
              </TabsContent>
              <TabsContent value="safety">
                <ContentSafety results={transcriptionResult.content_safety_labels.summary} />
              </TabsContent>
              <TabsContent value="analytics">
                {/* Add an Analytics component here */}
                <p>Analytics content coming soon...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="accessibility-mode" checked={isAccessible} onCheckedChange={setIsAccessible} />
              <Label htmlFor="accessibility-mode">Accessibility Mode</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

