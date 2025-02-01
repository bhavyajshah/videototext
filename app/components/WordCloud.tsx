"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import cloud from "d3-cloud"

interface WordCloudProps {
  text: string
}

export default function WordCloud({ text }: WordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!text || !svgRef.current) return

    const words = text.split(/\s+/g)
    const wordFrequency = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {})

    const wordEntries = Object.entries(wordFrequency)
      .filter(([word]) => word.length > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)

    const layout = cloud()
      .size([500, 300])
      .words(wordEntries.map(([text, size]) => ({ text, size: size * 5 })))
      .padding(5)
      .rotate(() => (~~(Math.random() * 6) - 3) * 30)
      .font("Arial")
      .fontSize((d) => d.size)
      .on("end", draw)

    layout.start()

    function draw(words: { text: string; size: number; x: number; y: number; rotate: number }[]) {
      d3.select(svgRef.current).selectAll("*").remove()

      const color = d3.scaleOrdinal(d3.schemeCategory10)

      d3.select(svgRef.current)
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`)
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "Arial")
        .style("fill", (_, i) => color(i.toString()))
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text((d) => d.text)
        .transition()
        .duration(1000)
        .style("font-size", (d) => `${d.size}px`)
        .attr("transform", (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
    }
  }, [text])

  return <svg ref={svgRef} className="w-full h-64 md:h-96" />
}

