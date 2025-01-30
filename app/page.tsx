import Dashboard from "./components/Dashboard"
import VideoUploader from "./components/VideoUploader"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <Dashboard>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Advanced Video and Audio Analysis</h2>
        <p className="text-muted-foreground">
          Upload your video or record audio to get accurate transcriptions with advanced AI-powered insights.
        </p>
        <VideoUploader />
      </div>
      <Toaster />
    </Dashboard>
  )
}

