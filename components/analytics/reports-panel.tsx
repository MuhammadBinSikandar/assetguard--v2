"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ReportsPanel() {
  const handleDownload = (path: string) => {
    const a = document.createElement("a")
    a.href = path
    a.download = ""
    a.rel = "noopener"
    a.click()
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="default" onClick={() => handleDownload("/api/analytics/reports/ownership")}>
            Download Ownership Report (CSV)
          </Button>
          <Button variant="secondary" onClick={() => handleDownload("/api/analytics/reports/transactions")}>
            Download Transactions Report (CSV)
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Reports are generated on demand based on the latest available data. You can import CSVs into your favorite
            spreadsheet tool.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

export default ReportsPanel
