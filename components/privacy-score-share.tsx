"use client"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Download, Copy } from "lucide-react"
import { usePrivacyScore } from "@/hooks/use-privacy-score"
import { useXMTP } from "@/hooks/use-xmtp"
import { toast } from "@/hooks/use-toast"

interface PrivacyScoreShareProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'icon'
}

export function PrivacyScoreShare({ size = 'md', variant = 'button' }: PrivacyScoreShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { metrics, getScoreLabel, lastUpdated } = usePrivacyScore()
  const { address, ensName } = useXMTP()

  const generateShareImage = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      // Set canvas size (Instagram post size)
      canvas.width = 1080
      canvas.height = 1080

      // Load background image
      const bgImage = new Image()
      bgImage.crossOrigin = 'anonymous'
      bgImage.onload = () => {
        try {
          // Draw background image
          ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)

          // Add dark overlay for better text readability
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Add gradient overlay
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)') // Red
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)')
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)') // Cyan
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Set text properties
          ctx.textAlign = 'center'
          ctx.fillStyle = 'white'

          // Title
          ctx.font = 'bold 48px Arial'
          ctx.fillText('PHENIX PRIVACY SCORE', canvas.width / 2, 150)

          // Subtitle
          ctx.font = '24px Arial'
          ctx.fillStyle = '#94a3b8'
          ctx.fillText('Decentralized Messaging Security Report', canvas.width / 2, 190)

          // Main score circle background
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2 - 50
          const radius = 120

          // Score circle background
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.fill()

          // Score circle border
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          ctx.strokeStyle = getScoreColor(metrics.overallScore)
          ctx.lineWidth = 8
          ctx.stroke()

          // Score progress arc
          const scoreAngle = (metrics.overallScore / 100) * 2 * Math.PI
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + scoreAngle)
          ctx.strokeStyle = getScoreColor(metrics.overallScore)
          ctx.lineWidth = 12
          ctx.stroke()

          // Main score text
          ctx.font = 'bold 72px Arial'
          ctx.fillStyle = getScoreColor(metrics.overallScore)
          ctx.fillText(metrics.overallScore.toString(), centerX, centerY - 10)

          // Score label
          ctx.font = 'bold 28px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(getScoreLabel(metrics.overallScore), centerX, centerY + 40)

          // Individual metrics
          const metricsY = centerY + 180
          const metricsData = [
            { label: 'ENCRYPTION', value: metrics.encryptionScore, iconType: 'lock' },
            { label: 'NETWORK', value: metrics.networkScore, iconType: 'network' },
            { label: 'DEVICE', value: metrics.deviceScore, iconType: 'device' },
            { label: 'METADATA', value: metrics.metadataScore, iconType: 'eye' }
          ]

          const metricWidth = canvas.width / 4
          metricsData.forEach((metric, index) => {
            const x = (index + 0.5) * metricWidth

            // Metric background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
            ctx.fillRect(x - 80, metricsY - 40, 160, 100)

            // Draw custom icons instead of emojis
            ctx.strokeStyle = '#94a3b8'
            ctx.fillStyle = '#94a3b8'
            ctx.lineWidth = 3

            const iconSize = 16
            const iconX = x
            const iconY = metricsY - 10

            switch (metric.iconType) {
              case 'lock':
                // Draw lock icon
                ctx.beginPath()
                ctx.roundRect(iconX - iconSize/2, iconY - iconSize/4, iconSize, iconSize/2, 2)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(iconX, iconY - iconSize/4, iconSize/3, Math.PI, 0, true)
                ctx.stroke()
                break

              case 'network':
                // Draw network/globe icon
                ctx.beginPath()
                ctx.arc(iconX, iconY, iconSize/2, 0, 2 * Math.PI)
                ctx.stroke()
                // Horizontal lines
                ctx.beginPath()
                ctx.moveTo(iconX - iconSize/2, iconY)
                ctx.lineTo(iconX + iconSize/2, iconY)
                ctx.moveTo(iconX - iconSize/3, iconY - iconSize/4)
                ctx.lineTo(iconX + iconSize/3, iconY - iconSize/4)
                ctx.moveTo(iconX - iconSize/3, iconY + iconSize/4)
                ctx.lineTo(iconX + iconSize/3, iconY + iconSize/4)
                ctx.stroke()
                // Vertical curve
                ctx.beginPath()
                ctx.ellipse(iconX, iconY, iconSize/4, iconSize/2, 0, 0, 2 * Math.PI)
                ctx.stroke()
                break

              case 'device':
                // Draw device/phone icon
                ctx.beginPath()
                ctx.roundRect(iconX - iconSize/3, iconY - iconSize/2, iconSize*2/3, iconSize, 3)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(iconX, iconY + iconSize/3, 2, 0, 2 * Math.PI)
                ctx.fill()
                break

              case 'eye':
                // Draw eye icon
                ctx.beginPath()
                ctx.ellipse(iconX, iconY, iconSize/2, iconSize/3, 0, 0, 2 * Math.PI)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(iconX, iconY, iconSize/4, 0, 2 * Math.PI)
                ctx.fill()
                break
            }

            // Metric value
            ctx.font = 'bold 24px Arial'
            ctx.fillStyle = getScoreColor(metric.value)
            ctx.fillText(metric.value.toString(), x, metricsY + 20)

            // Metric label
            ctx.font = '14px Arial'
            ctx.fillStyle = '#94a3b8'
            ctx.fillText(metric.label, x, metricsY + 40)
          })

          // User info
          const userText = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous')
          ctx.font = '20px Arial'
          ctx.fillStyle = '#94a3b8'
          ctx.fillText(userText, centerX, canvas.height - 120)

          // Timestamp
          const timeText = lastUpdated ? lastUpdated.toLocaleDateString() : new Date().toLocaleDateString()
          ctx.font = '16px Arial'
          ctx.fillStyle = '#64748b'
          ctx.fillText(`Generated on ${timeText}`, centerX, canvas.height - 90)

          // Branding
          ctx.font = 'bold 18px Arial'
          ctx.fillStyle = '#ef4444'
          ctx.fillText('PHENIX CHAT • XMTP + ANYONE PROTOCOL', centerX, canvas.height - 50)

          // Convert to data URL
          const dataURL = canvas.toDataURL('image/png', 0.9)
          resolve(dataURL)
        } catch (error) {
          reject(error)
        }
      }

      bgImage.onerror = () => {
        reject(new Error('Failed to load background image'))
      }

      // Use the Phenix background image
      bgImage.src = '/1.webp'
    })
  }, [metrics, getScoreLabel, lastUpdated, address, ensName])

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981' // Green
    if (score >= 70) return '#f59e0b' // Yellow
    if (score >= 50) return '#f97316' // Orange
    return '#ef4444' // Red
  }

  const handleShare = async () => {
    try {
      const imageDataURL = await generateShareImage()
      
      // Convert data URL to blob
      const response = await fetch(imageDataURL)
      const blob = await response.blob()
      
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'privacy-score.png', { type: 'image/png' })] })) {
        // Use native sharing if available
        await navigator.share({
          title: 'My Phenix Privacy Score',
          text: `I scored ${metrics.overallScore}/100 on privacy protection with Phenix Chat! 🔐`,
          files: [new File([blob], 'privacy-score.png', { type: 'image/png' })]
        })
      } else {
        // Fallback: copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        toast({
          title: "Image Copied!",
          description: "Privacy score image copied to clipboard. Paste it anywhere to share!"
        })
      }
    } catch (error) {
      console.error('Failed to share:', error)
      toast({
        title: "Share Failed",
        description: "Could not generate or share the image. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    try {
      const imageDataURL = await generateShareImage()
      
      // Create download link
      const link = document.createElement('a')
      link.download = `phenix-privacy-score-${metrics.overallScore}.png`
      link.href = imageDataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Downloaded!",
        description: "Privacy score image saved to your downloads."
      })
    } catch (error) {
      console.error('Failed to download:', error)
      toast({
        title: "Download Failed",
        description: "Could not generate the image. Please try again.",
        variant: "destructive"
      })
    }
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'

  if (variant === 'icon') {
    return (
      <>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="flex items-center space-x-1">
          <Button
            size={buttonSize}
            variant="ghost"
            onClick={handleShare}
            className="text-gray-400 hover:text-white"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            size={buttonSize}
            variant="ghost"
            onClick={handleDownload}
            className="text-gray-400 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="flex items-center space-x-2">
        <Button
          size={buttonSize}
          variant="outline"
          onClick={handleShare}
          className="flex items-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Score</span>
        </Button>
        <Button
          size={buttonSize}
          variant="ghost"
          onClick={handleDownload}
          className="flex items-center space-x-2 text-gray-400 hover:text-white"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </Button>
      </div>
    </>
  )
}
