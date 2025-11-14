"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; ts: number }

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "w1",
      role: "assistant",
      ts: Date.now(),
      content:
        "Hi! I’m AssetGuard AI. How can I help?\n\n• How to buy property fractions?\n• Check KYC status\n• Property verification process\n• Calculate ROI",
    },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onToggle = () => setOpen((v) => !v)
    window.addEventListener("assetguard:chat:open", onOpen as EventListener)
    window.addEventListener("assetguard:chat:toggle", onToggle as EventListener)
    return () => {
      window.removeEventListener("assetguard:chat:open", onOpen as EventListener)
      window.removeEventListener("assetguard:chat:toggle", onToggle as EventListener)
    }
  }, [])

  const quick = useMemo(
    () => ["How to buy property fractions?", "Check KYC status", "Property verification process", "Calculate ROI"],
    [],
  )

  async function send(text: string) {
    if (!text.trim()) return
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text.trim(), ts: Date.now() }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
      })
      const data = await res.json()
      const aiMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content: data.text ?? "…", ts: Date.now() }
      setMessages((m) => [...m, aiMsg])
    } catch {
      const errMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I ran into an error.",
        ts: Date.now(),
      }
      setMessages((m) => [...m, errMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="Open AssetGuard AI Assistant"
        >
          <span className="relative">
            {/* Simple pulse */}
            <span className="absolute -inset-2 rounded-full bg-primary/30 animate-ping" aria-hidden />
            <span className="relative font-semibold">AI</span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <Card className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[90vw] p-0 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500" aria-hidden />
              <div className="text-sm font-medium">AssetGuard AI Assistant</div>
              <Badge variant="secondary" className="text-[10px]">
                Online
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Minimize">
                Minimize
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
                Close
              </Button>
            </div>
          </div>

          <div ref={listRef} className="h-72 overflow-y-auto px-3 py-2 space-y-2 bg-background">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    "inline-block rounded-md px-3 py-2 text-sm max-w-[80%] " +
                    (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                  }
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="text-left">
                <div className="inline-block rounded-md px-3 py-2 text-sm bg-muted text-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-200ms]" />
                    <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-100ms]" />
                    <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {quick.map((q) => (
                <button
                  key={q}
                  className="text-xs rounded-md px-2 py-1 border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => send(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                aria-label="Message"
              />
              <Button onClick={() => send(input)} disabled={sending}>
                Send
              </Button>
            </div>
          </div>

          <div className="px-3 py-2 border-t">
            <div className="text-xs text-muted-foreground">Was this helpful?</div>
            <div className="mt-1 flex items-center gap-2">
              <Button size="sm" variant="outline">
                👍
              </Button>
              <Button size="sm" variant="outline">
                👎
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
