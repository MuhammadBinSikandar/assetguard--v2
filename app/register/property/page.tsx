"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import BBLForm, { type BBLValues } from "@/components/register/bbl-form"
import PropertyDetails, { type PropertyData } from "@/components/register/property-details"
import DocumentUpload, { type DocumentState } from "@/components/register/document-upload"
import WalletForm from "@/components/register/wallet-form"
import ReviewAndSubmit from "@/components/register/review"

type Step = 1 | 2 | 3 | 4 | 5

export default function PropertyRegistrationPage() {
  const [step, setStep] = useState<Step>(1)
  const [bbl, setBBL] = useState<BBLValues | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [documents, setDocuments] = useState<DocumentState>({
    titleDeed: { file: null, status: "Pending" },
  })
  const [wallet, setWallet] = useState<{ address: string }>({ address: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const canContinue = useMemo(() => {
    // Temporarily enabled for all steps
    return true
  }, [step, bbl, property, documents, wallet])

  const onBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
  const onNext = () => setStep((s) => (s < 5 ? ((s + 1) as Step) : s))

  const onSubmitFinal = async () => {
    if (!bbl || !property) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()

      // BBL fields
      formData.append("borough", bbl.borough)
      formData.append("block", bbl.block)
      formData.append("lot", bbl.lot)

      // Property details
      formData.append("propertyAddress", property.address || "")
      formData.append("ownerName", property.owner || "")

      // Map free-text property type to the enum value the API expects
      const typeMap: Record<string, string> = {
        RESIDENTIAL: "RESIDENTIAL",
        COMMERCIAL: "COMMERCIAL",
        MIXED_USE: "MIXED_USE",
        "MIXED USE": "MIXED_USE",
        MIXEDUSE: "MIXED_USE",
        INDUSTRIAL: "INDUSTRIAL",
        LAND: "LAND",
      }
      const rawType = (property.type || "RESIDENTIAL").toUpperCase().replace(/[\s-]+/g, "_")
      formData.append("propertyType", typeMap[rawType] || typeMap[rawType.replace(/_/g, "")] || "RESIDENTIAL")
      formData.append("taxClass", property.taxClass || "1")

      // Helper: only append if the value is a finite positive number
      const appendNum = (key: string, val: number | null | undefined) => {
        if (val != null && Number.isFinite(val) && val > 0) formData.append(key, String(val))
      }

      // Building info
      appendNum("yearBuilt", property.building?.yearBuilt)
      appendNum("stories", property.building?.stories)
      appendNum("totalAreaSqFt", property.building?.totalArea)
      // Units can be 0
      if (property.building?.commercialUnits != null && Number.isFinite(property.building.commercialUnits)) {
        formData.append("commercialUnits", String(property.building.commercialUnits))
      }
      if (property.building?.residentialUnits != null && Number.isFinite(property.building.residentialUnits)) {
        formData.append("residentialUnits", String(property.building.residentialUnits))
      }

      // Land info
      appendNum("frontage", property.land?.frontage)
      appendNum("depth", property.land?.depth)
      appendNum("landAreaSqFt", property.land?.landArea)

      // Valuation
      const price = property.assessment?.marketValue
      formData.append("estimatedPriceUSD", String(price && Number.isFinite(price) && price > 0 ? price : 1))

      // Document
      if (documents.titleDeed.file) {
        formData.append("document", documents.titleDeed.file)
      }

      const res = await fetch("/api/properties/register", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        let msg = data.message || "Registration failed."
        if (data.errors) {
          const details = Object.entries(data.errors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
            .join("; ")
          msg += " " + details
        }
        setSubmitError(msg)
        return
      }

      // Navigate to confirmation page
      const masked = data.data?.walletAddress || ""
      const referenceId = data.data?.referenceId || ""
      router.push(
        `/register/property/confirmation?ref=${encodeURIComponent(referenceId)}&wallet=${encodeURIComponent(masked)}`,
      )
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-balance">Register a Property</h1>
        <p className="text-muted-foreground mt-1">
          Provide Borough, Block, and Lot to fetch official property details from the NYC Property Information Portal.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { n: 1, label: "Start Registration" },
                { n: 2, label: "Property Details" },
                { n: 3, label: "Upload Documents" },
                { n: 4, label: "Wallet Information" },
                { n: 5, label: "Review & Submit" },
              ].map((s) => (
                <div
                  key={s.n}
                  className={cn(
                    "rounded-md px-3 py-2",
                    step === s.n ? "bg-accent text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {s.n}. {s.label}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              {step === 1 && (
                <BBLForm
                  initialValues={bbl || undefined}
                  onFetched={(vals, data) => {
                    setBBL(vals)
                    setProperty(data)
                    setStep(2)
                  }}
                  onChange={(vals) => {
                    setBBL(vals)
                  }}
                />
              )}

              {step === 2 && (
                <PropertyDetails
                  property={property}
                  onBack={() => setStep(1)}
                  onContinue={() => setStep(3)}
                  onChange={(data) => setProperty(data)}
                />
              )}

              {step === 3 && <DocumentUpload state={documents} onChange={setDocuments} />}

              {step === 4 && <WalletForm value={wallet.address} onChange={(addr) => setWallet({ address: addr })} />}

              {step === 5 && (
                <ReviewAndSubmit
                  property={property}
                  documents={documents}
                  wallet={wallet.address}
                  onConfirm={() => onSubmitFinal()}
                  onBack={() => setStep(4)}
                />
              )}
            </CardContent>

            <Separator className="my-0" />
            <div className="flex items-center justify-between px-6 py-4">
              <Link href="/dashboard" className="text-sm text-primary underline underline-offset-4">
                Cancel
              </Link>

              {submitError && (
                <p className="text-sm text-destructive max-w-md text-center">{submitError}</p>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onBack} disabled={step === 1 || submitting}>
                  Back
                </Button>
                {step < 5 ? (
                  <Button onClick={onNext} disabled={!canContinue}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={() => onSubmitFinal()} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "✅ Confirm & Submit"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
