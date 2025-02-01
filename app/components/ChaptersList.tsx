'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

interface Chapter {
  start: number
  end: number
  gist: string
  headline: string
  summary: string
}

interface ChaptersListProps {
  chapters: Chapter[]
}

export default function ChaptersList({ chapters }: ChaptersListProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {chapters.map((chapter, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex justify-between items-center">
                <span>{chapter.headline}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(chapter.start)} - {formatTime(chapter.end)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary mb-2">{chapter.gist}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{chapter.summary}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

