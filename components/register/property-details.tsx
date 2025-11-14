"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { PropertyData } from "./bbl-form"

export type { PropertyData }

export default function PropertyDetails({
  property,
  onBack,
  onContinue,
  onChange,
}: {
  property: PropertyData | null
  onBack: () => void
  onContinue: () => void
  onChange: (data: PropertyData) => void
}) {
  const [formData, setFormData] = useState<PropertyData>(
    property || {
      address: "",
      borough: "",
      block: "",
      lot: "",
      owner: "",
      type: "",
      taxClass: "",
      building: {
        yearBuilt: null,
        stories: null,
        totalArea: null,
        commercialUnits: null,
        residentialUnits: null,
        constructionType: null,
      },
      land: {
        frontage: null,
        depth: null,
        landArea: null,
        zoning: null,
      },
      assessment: {
        marketValue: null,
        taxableValue: null,
        latestYear: null,
      },
    }
  )

  const handleChange = (field: string, value: any, section?: string) => {
    let newData: PropertyData
    if (section) {
      newData = {
        ...formData,
        [section]: {
          ...(formData[section as keyof PropertyData] as any),
          [field]: value,
        },
      }
    } else {
      newData = { ...formData, [field]: value }
    }
    setFormData(newData)
    onChange(newData)
  }
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Property Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Please enter the property information below</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter property address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => handleChange("owner", e.target.value)}
                placeholder="Enter owner name"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Property Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                placeholder="e.g., Residential"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxClass">Tax Class</Label>
              <Input
                id="taxClass"
                value={formData.taxClass}
                onChange={(e) => handleChange("taxClass", e.target.value)}
                placeholder="e.g., Class 1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Building Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={formData.building.yearBuilt || ""}
                  onChange={(e) => handleChange("yearBuilt", e.target.value ? Number(e.target.value) : null, "building")}
                  placeholder="e.g., 2000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stories">Stories</Label>
                <Input
                  id="stories"
                  type="number"
                  value={formData.building.stories || ""}
                  onChange={(e) => handleChange("stories", e.target.value ? Number(e.target.value) : null, "building")}
                  placeholder="e.g., 3"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalArea">Total Area (sq ft)</Label>
              <Input
                id="totalArea"
                type="number"
                value={formData.building.totalArea || ""}
                onChange={(e) => handleChange("totalArea", e.target.value ? Number(e.target.value) : null, "building")}
                placeholder="e.g., 2500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commercialUnits">Commercial Units</Label>
                <Input
                  id="commercialUnits"
                  type="number"
                  value={formData.building.commercialUnits || ""}
                  onChange={(e) =>
                    handleChange("commercialUnits", e.target.value ? Number(e.target.value) : null, "building")
                  }
                  placeholder="e.g., 0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="residentialUnits">Residential Units</Label>
                <Input
                  id="residentialUnits"
                  type="number"
                  value={formData.building.residentialUnits || ""}
                  onChange={(e) =>
                    handleChange("residentialUnits", e.target.value ? Number(e.target.value) : null, "building")
                  }
                  placeholder="e.g., 1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Land Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frontage">Frontage (ft)</Label>
                <Input
                  id="frontage"
                  type="number"
                  value={formData.land.frontage || ""}
                  onChange={(e) => handleChange("frontage", e.target.value ? Number(e.target.value) : null, "land")}
                  placeholder="e.g., 25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depth">Depth (ft)</Label>
                <Input
                  id="depth"
                  type="number"
                  value={formData.land.depth || ""}
                  onChange={(e) => handleChange("depth", e.target.value ? Number(e.target.value) : null, "land")}
                  placeholder="e.g., 100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="landArea">Land Area (sq ft)</Label>
              <Input
                id="landArea"
                type="number"
                value={formData.land.landArea || ""}
                onChange={(e) => handleChange("landArea", e.target.value ? Number(e.target.value) : null, "land")}
                placeholder="e.g., 2500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="marketValue">Estimated Price of Property ($)</Label>
            <Input
              id="marketValue"
              type="number"
              value={formData.assessment.marketValue || ""}
              onChange={(e) =>
                handleChange("marketValue", e.target.value ? Number(e.target.value) : null, "assessment")
              }
              placeholder="Enter estimated property value (e.g., 500000)"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Please provide your best estimate of the property's current market value
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
