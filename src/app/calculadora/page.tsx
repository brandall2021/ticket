"use client"

import { Calculator } from "@/components/calculator"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CalculatorPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Calculadora</h1>
      </div>
      <Calculator />
    </div>
  )
}
