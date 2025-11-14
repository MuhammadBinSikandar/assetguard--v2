"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export type DocumentData = { type: "passport" | "driver" | "national" | null; file: File | null }

export function DocumentStep({
  value,
  onChange,
}: {
  value: DocumentData | null
  onChange: (v: DocumentData) => void
}) {
  const [v, setV] = useState<DocumentData>(value ?? { type: "passport", file: null })
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => onChange(v), [v]) // eslint-disable-line

  useEffect(() => {
    if (!v.file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(v.file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [v.file])

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setV({ ...v, file: e.dataTransfer.files[0] })
    }
  }

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    if (f) setV({ ...v, file: f })
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-semibold">Document Upload</h2>
      <p className="mb-4 text-slate-300">Choose a document type and upload a clear, glare‑free image.</p>

      <Tabs
        value={v.type ?? undefined}
        onValueChange={(val) => setV({ ...v, type: val as DocumentData["type"] })}
        className="mb-4"
      >
        <TabsList className="bg-slate-900/60">
          <TabsTrigger value="passport">Passport</TabsTrigger>
          <TabsTrigger value="driver">Driver&apos;s License</TabsTrigger>
          <TabsTrigger value="national">National ID</TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/40 p-6 text-center"
      >
        <p className="text-slate-300">Drag and drop your document here</p>
        <p className="text-sm text-slate-400">PNG, JPG or PDF up to 10MB</p>
        <div className="mt-4">
          <input id="browse" type="file" className="hidden" onChange={onPick} accept=".png,.jpg,.jpeg,.pdf" />
          <label htmlFor="browse">
            <Button type="button" variant="secondary">
              Browse Files
            </Button>
          </label>
        </div>
      </div>

      {preview && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Preview</span>
            <Button variant="ghost" onClick={() => setV({ ...v, file: null })}>
              Remove
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview || "/placeholder.svg"}
              alt="Uploaded document preview"
              className="max-h-72 w-full object-contain bg-slate-950"
            />
          </div>
        </div>
      )}

      <ul className="mt-4 grid gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-3">
        <li className="text-slate-300">• Clear image</li>
        <li className="text-slate-300">• All corners visible</li>
        <li className="text-slate-300">• No glare or blur</li>
      </ul>

      <div className="mt-4">
        <Button variant="outline" className="border-slate-700 text-slate-200 bg-transparent">
          Use Camera (mobile)
        </Button>
      </div>
    </section>
  )
}
