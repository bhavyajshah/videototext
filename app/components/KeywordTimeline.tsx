"use client"
import { motion } from "framer-motion"

interface KeywordTimelineProps {
  keywords: Array<{ text: string; start: number }>
}

export default function KeywordTimeline({ keywords }: KeywordTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute h-full w-1 bg-gray-200 dark:bg-gray-600 left-1/2 transform -translate-x-1/2"></div>
      {keywords.map((keyword, index) => (
        <motion.div
          key={index}
          className={`flex items-center ${index % 2 === 0 ? "justify-start" : "justify-end"} mb-8`}
          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className={`w-5/12 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}>
            <div className="font-bold text-primary">{keyword.text}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{formatTime(keyword.start)}</div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary"></div>
        </motion.div>
      ))}
    </div>
  )
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`
}

