"use client"

import { Button } from "@/components/ui/button"
import { FilePlus2, Plus, ShoppingBag } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function QuickActions() {
  return (
    <TooltipProvider>
      <div aria-label="Quick actions" className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        <div className="flex flex-col items-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" className="shadow-md" aria-label="Add Property">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Add Property</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" className="shadow-md" aria-label="Register Property">
                <FilePlus2 className="h-4 w-4 mr-2" />
                Register Property
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Register Property</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" className="shadow-md" aria-label="Buy Property">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Buy Property
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Buy Property</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
