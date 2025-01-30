"use client"

import React, { useRef, useEffect } from "react"

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

      ctx.fillStyle = "rgb(0, 0, 0)"
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      const barWidth = (WIDTH / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2

        ctx.fillStyle = `rgb(${barHeight + 100},50,50)`
        ctx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      source.disconnect()
      audioContext.close()
    }
  }, [audioStream])

  return <canvas ref={canvasRef} width="640" height="100" />
}

