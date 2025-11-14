"use client"

import type React from "react"

import { useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type UploadStatus = "Pending" | "Uploaded" | "Verified"

export type DocumentState = {
  titleDeed: {
    file: File | null
    status: UploadStatus
  }
}

export default function DocumentUpload({
  state,
  onChange,
}: {
  state: DocumentState
  onChange: (s: DocumentState) => void
}) {
  const onPick = useCallback(
    (file?: File) => {
      onChange({
        ...state,
        titleDeed: { file: file ?? null, status: file ? ("Uploaded" as const) : "Pending" },
      })
    },
    [state, onChange],
  )

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    onPick(f || undefined)
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Upload Ownership Documents</h2>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Title deed / Ownership certificate</CardTitle>
            <Badge
              variant={
                state.titleDeed.status === "Verified"
                  ? "default"
                  : state.titleDeed.status === "Uploaded"
                    ? "secondary"
                    : "outline"
              }
            >
              {state.titleDeed.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-accent p-4 text-sm">
              {state.titleDeed.file ? (
                <div>
                  <div className="font-medium">{state.titleDeed.file.name}</div>
                  <div className="text-muted-foreground">{Math.ceil((state.titleDeed.file.size || 0) / 1024)} KB</div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Drag & drop not implemented yet — click Upload to select a file.
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="title-deed-input">
                <input
                  id="title-deed-input"
                  type="file"
                  className="sr-only"
                  onChange={onFileInput}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <Button asChild>
                  <span>Upload</span>
                </Button>
              </label>
              {state.titleDeed.file && (
                <Button variant="outline" onClick={() => onPick(undefined)}>
                  Replace
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        We securely verify your ownership documents. Only required document for now: Title deed / Ownership certificate.
      </p>
    </div>
  )
}
