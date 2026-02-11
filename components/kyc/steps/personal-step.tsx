"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type PersonalInfo = {
  first: string
  middle?: string
  last: string
  dob: string
  nationality: string
  idNumber: string
  address: { street: string; city: string; state?: string; zip?: string; country: string }
  phone: { code: string; number: string; verified?: boolean }
}

const countries = [
  { code: "+1", name: "United States" },
  { code: "+44", name: "United Kingdom" },
  { code: "+61", name: "Australia" },
  { code: "+65", name: "Singapore" },
  { code: "+971", name: "United Arab Emirates" },
]

export function PersonalStep({
  value,
  onChange,
}: {
  value: PersonalInfo | null
  onChange: (v: PersonalInfo) => void
}) {
  const [v, setV] = useState<PersonalInfo>(
    value ?? {
      first: "",
      middle: "",
      last: "",
      dob: "",
      nationality: "",
      idNumber: "",
      address: { street: "", city: "", state: "", zip: "", country: "" },
      phone: { code: "+1", number: "", verified: false },
    },
  )

  useEffect(() => onChange(v), [v]) // eslint-disable-line

  const valid = useMemo(() => {
    return (
      v.first &&
      v.last &&
      v.dob &&
      v.nationality &&
      v.idNumber &&
      v.address.street &&
      v.address.city &&
      v.address.country &&
      v.phone.number
    )
  }, [v])

  const inputBase =
    "peer block w-full rounded-lg border bg-slate-900/50 h-12 px-3 py-3 text-base text-slate-100 ring-offset-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 border-slate-700"

  return (
    <section>
      <h2 className="mb-1 text-xl font-semibold">Personal Information</h2>
      <p className="mb-5 text-slate-300">
        Tell us a bit about yourself. All fields use floating labels and validate as you type.
      </p>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="relative">
          <Input
            value={v.first}
            onChange={(e) => setV({ ...v, first: e.target.value })}
            className={cn(inputBase)}
            placeholder=" "
            id="first"
            data-has-value={Boolean(v.first)}
          />
          <Label
            htmlFor="first"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            First Name
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.middle}
            onChange={(e) => setV({ ...v, middle: e.target.value })}
            className={cn(inputBase)}
            placeholder=" "
            id="middle"
            data-has-value={Boolean(v.middle)}
          />
          <Label
            htmlFor="middle"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            Middle Name
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.last}
            onChange={(e) => setV({ ...v, last: e.target.value })}
            className={cn(inputBase)}
            placeholder=" "
            id="last"
            data-has-value={Boolean(v.last)}
          />
          <Label
            htmlFor="last"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            Last Name
          </Label>
        </div>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-3">
        <div className="relative">
          <Input
            type="date"
            value={v.dob}
            onChange={(e) => setV({ ...v, dob: e.target.value })}
            className={cn(inputBase)}
            placeholder=" "
            id="dob"
            data-has-value={Boolean(v.dob)}
          />
          <Label
            htmlFor="dob"
            className="pointer-events-none absolute left-3 top-2.5 -translate-y-1/2 bg-slate-900/0 px-1 text-xs text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs"
          >
            Date of Birth
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.nationality}
            onChange={(e) => setV({ ...v, nationality: e.target.value })}
            className={cn(inputBase)}
            placeholder=" "
            id="nationality"
            data-has-value={Boolean(v.nationality)}
          />
          <Label
            htmlFor="nationality"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            Nationality
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.idNumber}
            onChange={(e) => setV({ ...v, idNumber: e.target.value })}
            className={cn(inputBase)}
            placeholder=" "
            id="idNumber"
            data-has-value={Boolean(v.idNumber)}
          />
          <Label
            htmlFor="idNumber"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            ID / Passport Number
          </Label>
        </div>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="relative md:col-span-2">
          <Input
            value={v.address.street}
            onChange={(e) => setV({ ...v, address: { ...v.address, street: e.target.value } })}
            className={cn(inputBase)}
            placeholder=" "
            id="street"
            data-has-value={Boolean(v.address.street)}
          />
          <Label
            htmlFor="street"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            Street Address
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.address.city}
            onChange={(e) => setV({ ...v, address: { ...v.address, city: e.target.value } })}
            className={cn(inputBase)}
            placeholder=" "
            id="city"
            data-has-value={Boolean(v.address.city)}
          />
          <Label
            htmlFor="city"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            City
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.address.state}
            onChange={(e) => setV({ ...v, address: { ...v.address, state: e.target.value } })}
            className={cn(inputBase)}
            placeholder=" "
            id="state"
            data-has-value={Boolean(v.address.state)}
          />
          <Label
            htmlFor="state"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            State / Region
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.address.zip}
            onChange={(e) => setV({ ...v, address: { ...v.address, zip: e.target.value } })}
            className={cn(inputBase)}
            placeholder=" "
            id="zip"
            data-has-value={Boolean(v.address.zip)}
          />
          <Label
            htmlFor="zip"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            ZIP / Postal Code
          </Label>
        </div>
        <div className="relative">
          <Input
            value={v.address.country}
            onChange={(e) => setV({ ...v, address: { ...v.address, country: e.target.value } })}
            className={cn(inputBase)}
            placeholder=" "
            id="country"
            data-has-value={Boolean(v.address.country)}
          />
          <Label
            htmlFor="country"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            Country
          </Label>
        </div>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="relative">
          <select
            className={cn(
              "block w-full rounded-lg border border-slate-700 bg-slate-900/50 h-12 px-3 text-left text-base text-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-blue-600",
            )}
            value={v.phone.code}
            onChange={(e) => setV({ ...v, phone: { ...v.phone, code: e.target.value } })}
            aria-label="Country code"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Input
            value={v.phone.number}
            onChange={(e) => setV({ ...v, phone: { ...v.phone, number: e.target.value } })}
            className={cn(inputBase)}
            placeholder=" "
            id="phone"
            data-has-value={Boolean(v.phone.number)}
          />
          <Label
            htmlFor="phone"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/0 px-1 text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-data-[has-value=true]:top-2.5 peer-data-[has-value=true]:-translate-y-1/2 peer-data-[has-value=true]:text-xs"
          >
            Phone Number
          </Label>
        </div>
      </div>

      <p className={cn("mt-4 text-sm", valid ? "text-emerald-400" : "text-slate-400")}>
        {valid ? "Looks good — all required fields are present." : "Please complete all required fields to continue."}
      </p>
    </section>
  )
}
