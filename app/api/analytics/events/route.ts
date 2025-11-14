export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      // initial hello
      send({
        id: crypto.randomUUID(),
        type: "info",
        ts: new Date().toISOString(),
        message: "Analytics stream connected",
      })

      const interval = setInterval(() => {
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

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"))
      }, 15000)

      // Close after 1 minute to be polite in preview
      const timeout = setTimeout(() => {
        clearInterval(interval)
        clearInterval(heartbeat)
        controller.close()
      }, 60_000)

      // Cleanup if client disconnects
      // @ts-expect-error signal present at runtime
      this.cancel = () => {
        clearInterval(interval)
        clearInterval(heartbeat)
        clearTimeout(timeout)
      }
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
