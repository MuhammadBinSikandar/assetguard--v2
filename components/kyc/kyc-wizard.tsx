"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Stepper } from "./stepper"
import { WelcomeStep } from "./steps/welcome-step"
import { PersonalStep, type PersonalInfo } from "./steps/personal-step"
import { DocumentStep, type DocumentData } from "./steps/document-step"
import { FacialStep, type FacialData } from "./steps/facial-step"
import { PendingStep } from "./steps/pending-step"
import { ShieldCheck, Award as IdCard, FileUp, ScanFace } from "lucide-react"

type StepKey = "welcome" | "personal" | "document" | "facial" | "pending"

const steps = [
  { key: "welcome", label: "Welcome", icon: ShieldCheck },
  { key: "personal", label: "Personal", icon: IdCard },
  { key: "document", label: "Documents", icon: FileUp },
  { key: "facial", label: "Face", icon: ScanFace },
] as const

export function KycWizard() {
  const [stepIndex, setStepIndex] = useState(0)
  const [personal, setPersonal] = useState<PersonalInfo | null>(null)
  const [doc, setDoc] = useState<DocumentData | null>(null)
  const [facial, setFacial] = useState<FacialData | null>(null)

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

  const onContinue = () => {
    if (stepKey === "facial") {
      // final submission mock: go to pending
      setStepIndex(4)
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

          {stepKey !== "welcome" && stepKey !== "pending" && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={onBack}>
                Back
              </Button>
              <Button className="w-36" onClick={onContinue} disabled={false}>
                {stepKey === "facial" ? "Submit" : "Continue"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
