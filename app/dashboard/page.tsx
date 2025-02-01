import Dashboard from "../components/Dashboard"
import VideoUploader from "../components/VideoUploader"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <Dashboard>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground">Here's an overview of your video transcription activities</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video to Text Converter</CardTitle>
            <CardDescription>
              Upload your video or record audio to get accurate transcriptions with advanced AI-powered insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploader />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </Dashboard>
  )
}

