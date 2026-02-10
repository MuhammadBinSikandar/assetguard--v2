"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export type FacialData = { photo: string | null }

export function FacialStep({
  value,
  onChange,
}: {
  value: FacialData | null
  onChange: (v: FacialData) => void
}) {
  const [photo, setPhoto] = useState<string | null>(value?.photo ?? null)
  const [streamReady, setStreamReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => onChange({ photo }), [photo]) // eslint-disable-line

  useEffect(() => {
    let mounted = true
    const getStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        if (!mounted) return
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadeddata = () => setStreamReady(true)
        }
      } catch (e) {
        console.log("[v0] Camera error:", (e as Error).message)
      }
    }
    getStream()
    return () => {
      mounted = false
      const v = videoRef.current
      const s = v?.srcObject as MediaStream | null
      s?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    let raf = 0
    // Optional FaceDetector API
    const anyWin = window as any
    const FaceDetectorCtor = anyWin?.FaceDetector
    if (!FaceDetectorCtor || !videoRef.current) return
    const detector = new FaceDetectorCtor({ fastMode: true })
    const loop = async () => {
      try {
        if (videoRef.current && !videoRef.current.paused) {
          const faces = await detector.detect(videoRef.current)
          setFaceDetected((faces?.length ?? 0) > 0)
        }
      } catch (e) {
        // Ignore detection errors, keep UI usable
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [streamReady])

  const stopCamera = () => {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream | null
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      video!.srcObject = null
    }
    setStreamReady(false)
    setFaceDetected(false)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL("image/jpeg", 0.9)
    setPhoto(data)
    stopCamera()
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-semibold">Facial Verification</h2>
      <p className="mb-4 text-slate-300">
        Center your face in the guide and ensure good lighting. Capture will enable when a face is detected or camera is
        ready.
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="relative overflow-hidden rounded-lg border border-slate-800">
            <video ref={videoRef} playsInline autoPlay muted className="aspect-video w-full rounded-lg object-cover" />
            {/* Face position guide */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-40 w-40 rounded-full border-2 border-blue-500/50" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button
              onClick={capture}
              disabled={!streamReady || (!faceDetected && !!(window as any).FaceDetector)}
              className="w-36"
            >
              Capture Photo
            </Button>
            <span className="text-sm text-slate-400">
              {faceDetected ? "Face detected" : "Align face in the circle"}
            </span>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <aside className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="mb-2 font-medium">Instructions</h3>
          <ul className="space-y-1 text-slate-300">
            <li>• Face the camera</li>
            <li>• Remove glasses and hats</li>
            <li>• Ensure good, even lighting</li>
          </ul>

          {photo && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm text-slate-400">Captured Photo</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo || "/placeholder.svg"}
                alt="Captured face"
                className="w-full rounded-md border border-slate-800"
              />
              <Button variant="ghost" className="mt-2" onClick={() => {
                setPhoto(null)
                // Restart camera for retake
                navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then((stream) => {
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadeddata = () => setStreamReady(true)
                  }
                }).catch(() => {})
              }}>
                Retake
              </Button>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
