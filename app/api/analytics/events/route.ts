export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  let interval: ReturnType<typeof setInterval> | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  let isClosed = false

  const cleanup = () => {
    if (interval) {
      clearInterval(interval)
      interval = undefined
    }
    if (heartbeat) {
      clearInterval(heartbeat)
      heartbeat = undefined
    }
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  const streamChunk = (value: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (isClosed) return
    try {
      controller.enqueue(encoder.encode(value))
    } catch {
      isClosed = true
      cleanup()
    }
  }

  const closeStream = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (isClosed) return
    isClosed = true
    cleanup()
    try {
      controller.close()
    } catch {
      // Stream can already be closed if disconnect races with timeout.
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => streamChunk(`data: ${JSON.stringify(obj)}\n\n`, controller)

      // initial hello
      send({
        id: crypto.randomUUID(),
        type: "info",
        ts: new Date().toISOString(),
        message: "Analytics stream connected",
      })

      interval = setInterval(() => {
        const n = Math.random()
        const type = n > 0.66 ? "surge" : n < 0.33 ? "drop" : "info"
        const msg =
          type === "surge"
            ? "Portfolio gained 1.2% in the last hour"
            : type === "drop"
              ? "Portfolio dropped 0.8% in the last hour"
              : "New valuation report available"
        send({ id: crypto.randomUUID(), type, ts: new Date().toISOString(), message: msg })
      }, 5000)

      heartbeat = setInterval(() => {
        streamChunk(": ping\n\n", controller)
      }, 15000)

      // Close after 1 minute to be polite in preview
      timeout = setTimeout(() => {
        closeStream(controller)
      }, 60_000)
    },
    cancel() {
      isClosed = true
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  })
}
