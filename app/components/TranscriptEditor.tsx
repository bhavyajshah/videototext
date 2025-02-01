"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface TranscriptEditorProps {
  transcript: string
  onSave: (editedTranscript: string) => void
}

export default function TranscriptEditor({ transcript, onSave }: TranscriptEditorProps) {
  const [editedTranscript, setEditedTranscript] = useState(transcript)

  const handleSave = () => {
    onSave(editedTranscript)
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={editedTranscript}
        onChange={(e) => setEditedTranscript(e.target.value)}
        className="min-h-[300px]"
      />
      <Button onClick={handleSave}>Save Changes</Button>
    </div>
  )
}

