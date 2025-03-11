"use client"

import { useEffect, useRef } from "react"

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // Set canvas dimensions
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      drawGrid()
    }

    // Apply fish-eye distortion to a point
    const applyFishEye = (x: number, y: number, centerX: number, centerY: number, radius: number, strength: number) => {
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < radius) {
        // Calculate the fish-eye effect
        const distortionFactor = 1 - Math.pow(distance / radius, 2) * strength
        const distortedX = centerX + dx * distortionFactor
        const distortedY = centerY + dy * distortionFactor
        return { x: distortedX, y: distortedY }
      }
      
      return { x, y }
    }

    // Draw grid with fish-eye effect
    const drawGrid = () => {
      const GRID_SPACING = 30
      
      // Create gradient background - darker but still with some color
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "rgb(0, 5, 15)")
      gradient.addColorStop(1, "rgb(1, 8, 20)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const cols = Math.floor(canvas.width / GRID_SPACING) + 4 // Add extra columns for fish-eye distortion
      const rows = Math.floor(canvas.height / GRID_SPACING) + 4 // Add extra rows for fish-eye distortion
      
      // Fish-eye parameters
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.8
      const strength = 0.3 // Fish-eye strength
      
      // Draw dots and lines with moderate opacity
      for (let i = -2; i <= cols + 2; i++) {
        for (let j = -2; j <= rows + 2; j++) {
          const originalX = i * GRID_SPACING
          const originalY = j * GRID_SPACING
          
          // Apply fish-eye distortion
          const { x, y } = applyFishEye(originalX, originalY, centerX, centerY, radius, strength)
          
          // Skip if outside canvas (with some margin)
          if (x < -GRID_SPACING || x > canvas.width + GRID_SPACING || 
              y < -GRID_SPACING || y > canvas.height + GRID_SPACING) continue
          
          const baseOpacity = 0.2 // Moderate base opacity
          
          // Add some variation to dot sizes
          const dotSize = (i % 4 === 0 && j % 4 === 0) ? 2 : 1
          
          // Draw dots with appropriate color
          ctx.fillStyle = `rgba(56, 189, 248, ${baseOpacity})`
          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fill()
          
          // Draw horizontal lines
          if (i < cols) {
            const nextOriginalX = (i + 1) * GRID_SPACING
            const nextOriginalY = j * GRID_SPACING
            const next = applyFishEye(nextOriginalX, nextOriginalY, centerX, centerY, radius, strength)
            
            const lineOpacity = (j % 2 === 0) ? baseOpacity * 0.8 : baseOpacity * 0.4
            ctx.beginPath()
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineOpacity})`
            ctx.lineWidth = j % 5 === 0 ? 0.8 : 0.4
            ctx.moveTo(x, y)
            ctx.lineTo(next.x, next.y)
            ctx.stroke()
          }
          
          // Draw vertical lines
          if (j < rows) {
            const nextOriginalX = i * GRID_SPACING
            const nextOriginalY = (j + 1) * GRID_SPACING
            const next = applyFishEye(nextOriginalX, nextOriginalY, centerX, centerY, radius, strength)
            
            const lineOpacity = (i % 2 === 0) ? baseOpacity * 0.8 : baseOpacity * 0.4
            ctx.beginPath()
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineOpacity})`
            ctx.lineWidth = i % 5 === 0 ? 0.8 : 0.4
            ctx.moveTo(x, y)
            ctx.lineTo(next.x, next.y)
            ctx.stroke()
          }
        }
      }
      
      // Add some larger accent dots for visual interest
      for (let i = 0; i < 15; i++) {
        const originalX = Math.random() * canvas.width
        const originalY = Math.random() * canvas.height
        const { x, y } = applyFishEye(originalX, originalY, centerX, centerY, radius, strength * 0.5)
        
        const size = 2 + Math.random() * 2.5
        
        ctx.fillStyle = "rgba(56, 189, 248, 0.5)"
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
        
        // Add subtle glow
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)"
        ctx.beginPath()
        ctx.arc(x, y, size * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout
    const throttledResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resize, 200)
    }

    resize()
    window.addEventListener("resize", throttledResize)

    return () => {
      window.removeEventListener("resize", throttledResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full animate-pulse "
      style={{ background: "linear-gradient(to bottom, rgb(0, 5, 15), rgb(1, 8, 20))" }}
    />
  )
}

