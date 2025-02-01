"use client"

import { useRef, useEffect } from "react"

interface AudioVisualizerProps {
  audioStream: MediaStream | null
}

export default function AudioVisualizer({ audioStream }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!audioStream || !canvasRef.current) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(audioStream)
    source.connect(analyser)

    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!

    function draw() {
      const WIDTH = canvas.width
      const HEIGHT = canvas.height

      requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = "rgb(20, 20, 20)"
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      const barWidth = (WIDTH / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2

        const hue = (i / bufferLength) * 360
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`

        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      source.disconnect()
      audioContext.close()
    }
  }, [audioStream])

  return <canvas ref={canvasRef} width="640" height="100" className="w-full h-24 rounded-lg shadow-lg" />
}

