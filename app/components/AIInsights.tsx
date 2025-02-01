"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AIInsightsProps {
  transcriptionResult: any
}

export default function AIInsights({ transcriptionResult }: AIInsightsProps) {
  const [summary, setSummary] = useState("")
  const [keyTopics, setKeyTopics] = useState<string[]>([])

  useEffect(() => {
    // Simulate AI processing
    setTimeout(() => {
      setSummary("This is an AI-generated summary of the transcription...")
      setKeyTopics(["Topic 1", "Topic 2", "Topic 3"])
    }, 1500)
  }, []) // Removed unnecessary dependency: transcriptionResult

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{summary}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Key Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {keyTopics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

