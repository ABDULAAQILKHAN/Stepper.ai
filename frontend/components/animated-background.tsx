"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Modern floating elements
    const elements: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      pulseSpeed: number
      type: "circle" | "square" | "triangle"
    }> = []

    // Create modern geometric elements
    for (let i = 0; i < 12; i++) {
      elements.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 40 + 20,
        opacity: Math.random() * 0.15 + 0.05,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        type: ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as "circle" | "square" | "triangle",
      })
    }

    // Modern grid pattern
    const gridSize = 60
    const gridOpacity = 0.03

    let time = 0

    const drawTriangle = (x: number, y: number, size: number) => {
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.closePath()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // Draw modern grid
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`
      ctx.lineWidth = 1

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw floating elements
      elements.forEach((element) => {
        element.x += element.vx
        element.y += element.vy

        // Wrap around edges
        if (element.x < -element.size) element.x = canvas.width + element.size
        if (element.x > canvas.width + element.size) element.x = -element.size
        if (element.y < -element.size) element.y = canvas.height + element.size
        if (element.y > canvas.height + element.size) element.y = -element.size

        // Pulsing effect
        const pulse = Math.sin(time * element.pulseSpeed) * 0.3 + 0.7
        const currentSize = element.size * pulse
        const currentOpacity = element.opacity * pulse

        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`

        if (element.type === "circle") {
          ctx.beginPath()
          ctx.arc(element.x, element.y, currentSize / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (element.type === "square") {
          ctx.fillRect(element.x - currentSize / 2, element.y - currentSize / 2, currentSize, currentSize)
        } else if (element.type === "triangle") {
          drawTriangle(element.x, element.y, currentSize)
          ctx.fill()
        }
      })

      // Draw connecting lines between nearby elements
      elements.forEach((element, i) => {
        elements.slice(i + 1).forEach((otherElement) => {
          const dx = element.x - otherElement.x
          const dy = element.y - otherElement.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.05
            ctx.beginPath()
            ctx.moveTo(element.x, element.y)
            ctx.lineTo(otherElement.x, otherElement.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: "radial-gradient(ellipse at top, #111111 0%, #000000 50%, #0a0a0a 100%)",
      }}
    />
  )
}
