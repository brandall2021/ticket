"use client"

import { useCallback, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ImageExtension from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, List, ListOrdered, Heading2, Image } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void
  active: boolean
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-brand-100 text-brand-700 dark:bg-navy-600 dark:text-brand-300"
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-navy-700",
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
}: RichTextEditorProps) {
  const uploadRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      Placeholder.configure({
        placeholder: placeholder || "Escribe aquí...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-3 py-2",
        style: `min-height: ${minHeight}px`,
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
              console.log("Pasting image:", file.name, file.type, file.size)
              uploadAndInsertImage(file)
            }
            return true
          }
        }
        return false
      },
    },
  })

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return

      const formData = new FormData()
      formData.append("archivos", file, file.name || "pasted-image.png")

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          console.error("Upload failed:", res.status, await res.text())
          return
        }
        const data = await res.json()
        if (data.archivos?.[0]?.url) {
          editor.chain().focus().setImage({ src: data.archivos[0].url }).run()
        }
      } catch (err) {
        console.error("Upload error:", err)
      }
    },
    [editor],
  )

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAndInsertImage(file)
    if (uploadRef.current) uploadRef.current.value = ""
  }

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white transition-all duration-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500 dark:border-navy-600 dark:bg-navy-800">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5 dark:border-navy-600 dark:bg-navy-700/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Negrita"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-neutral-300 dark:bg-navy-500" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="Subtítulo"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-neutral-300 dark:bg-navy-500" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-neutral-300 dark:bg-navy-500" />
        <ToolbarButton
          onClick={() => uploadRef.current?.click()}
          active={false}
          label="Insertar imagen"
        >
          <Image className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
