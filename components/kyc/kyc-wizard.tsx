"use client"

import { useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Stepper } from "./stepper"
import { WelcomeStep } from "./steps/welcome-step"
import { PersonalStep, type PersonalInfo } from "./steps/personal-step"
import { DocumentStep, type DocumentData } from "./steps/document-step"
import { FacialStep, type FacialData } from "./steps/facial-step"
import { PendingStep } from "./steps/pending-step"
import { ShieldCheck, Award as IdCard, FileUp, ScanFace, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector } from "@/store/redux/store"

type StepKey = "welcome" | "personal" | "document" | "facial" | "pending"

const steps = [
  { key: "welcome", label: "Welcome", icon: ShieldCheck },
  { key: "personal", label: "Personal", icon: IdCard },
  { key: "document", label: "Documents", icon: FileUp },
  { key: "facial", label: "Face", icon: ScanFace },
] as const

export function KycWizard() {
  const { toast } = useToast()
  const user = useAppSelector((state) => state.user.user)
  const [stepIndex, setStepIndex] = useState(0)
  const [personal, setPersonal] = useState<PersonalInfo | null>(null)
  const [doc, setDoc] = useState<DocumentData | null>(null)
  const [facial, setFacial] = useState<FacialData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stepKey: StepKey =
    stepIndex === 0
      ? "welcome"
      : stepIndex === 1
        ? "personal"
        : stepIndex === 2
          ? "document"
          : stepIndex === 3
            ? "facial"
            : "pending"

  const canContinue = useMemo(() => {
    if (stepKey === "welcome") return true
    if (stepKey === "personal")
      return (
        !!personal?.first &&
        !!personal?.last &&
        !!personal?.dob &&
        !!personal?.nationality &&
        !!personal?.idNumber &&
        !!personal?.address?.street &&
        !!personal?.address?.city &&
        !!personal?.address?.country &&
        !!personal?.phone?.number
      )
    if (stepKey === "document") return !!doc?.type && !!doc?.file
    if (stepKey === "facial") return !!facial?.photo
    return false
  }, [stepKey, personal, doc, facial])

  const onBack = () => {
    if (stepKey === "welcome") return
    if (stepKey === "pending") return
    setStepIndex((i) => Math.max(0, i - 1))
  }

  /** Convert a base64 data URL to a File object */
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const [header, data] = dataUrl.split(",")
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg"
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new File([bytes], filename, { type: mime })
  }

  /** Submit all KYC data to the API */
  const submitKYC = useCallback(async () => {
    if (!personal || !doc?.file || !facial?.photo) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Get the current user's ID from Redux state
      if (!user?.id) {
        throw new Error("Could not identify the current user. Please log in again.")
      }
      const userId = user.id

      // 2. Build fullName and idNumber from personal info
      const fullName = [personal.first, personal.middle, personal.last].filter(Boolean).join(" ")
      const idNumber = personal.idNumber

      // 3. Build FormData with all files and fields
      const formData = new FormData()
      formData.append("userId", userId)
      formData.append("fullName", fullName)
      formData.append("idNumber", idNumber)

      // Append the ID document
      formData.append("documents", doc.file, doc.file.name)

      // Append the selfie photo (convert base64 to File)
      const selfieFile = dataURLtoFile(facial.photo, "selfie.jpg")
      formData.append("documents", selfieFile, "selfie.jpg")

      // 4. Submit to the API
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || "KYC submission failed.")
      }

      // 5. Success — go to pending step
      toast({
        title: "KYC Submitted",
        description: "Your documents have been submitted for review.",
      })
      setStepIndex(4)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again."
      setSubmitError(msg)
      toast({ title: "Submission Failed", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }, [personal, doc, facial, toast])

  const onContinue = () => {
    if (stepKey === "facial") {
      submitKYC()
      return
    }
    setStepIndex((i) => Math.min(3, i + 1))
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardContent className="p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <Stepper steps={steps} currentIndex={Math.min(stepIndex, 3)} />
          </div>

          <div className="mx-auto grid max-w-5xl gap-8">
            {stepKey === "welcome" && <WelcomeStep onBegin={() => setStepIndex(1)} />}
            {stepKey === "personal" && <PersonalStep value={personal} onChange={setPersonal} />}
            {stepKey === "document" && <DocumentStep value={doc} onChange={setDoc} />}
            {stepKey === "facial" && <FacialStep value={facial} onChange={setFacial} />}
            {stepKey === "pending" && <PendingStep />}
          </div>

          {submitError && stepKey === "facial" && (
            <p className="mt-4 text-center text-sm text-red-400">{submitError}</p>
          )}

          {stepKey !== "welcome" && stepKey !== "pending" && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={onBack} disabled={submitting}>
                Back
              </Button>
              <Button className="w-36" onClick={onContinue} disabled={!canContinue || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting
                  </>
                ) : stepKey === "facial" ? (
                  "Submit"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
