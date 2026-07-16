"use client"

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        style: {
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      }}
    />
  )
}
