import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

interface ContentSafetyProps {
  results: {
    [key: string]: number
  }
}

export default function ContentSafety({ results }: ContentSafetyProps) {
  return (
    <div className="space-y-4">
      {Object.entries(results).map(([category, score], index) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold capitalize">{category.replace("_", " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={score * 100} className="w-full" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Confidence: {(score * 100).toFixed(2)}%</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

