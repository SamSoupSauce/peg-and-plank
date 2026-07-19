import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type LevelDef } from '@/game/levels'
import { parsePackJSON } from '@/game/packs'

export type AddTab = 'url' | 'upload' | 'paste'

interface AddPackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: AddTab
  onAddFromURL: (url: string, name: string) => Promise<void>
  onAddFromFile: (file: File, name: string) => Promise<void>
  onAddFromJSON: (text: string, name: string) => void
  loading: boolean
}

export function AddPackDialog({
  open,
  onOpenChange,
  initialTab = 'url',
  onAddFromURL,
  onAddFromFile,
  onAddFromJSON,
  loading,
}: AddPackDialogProps) {
  const [tab, setTab] = useState<AddTab>(initialTab)
  const [url, setUrl] = useState('')
  const [json, setJson] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [preview, setPreview] = useState<LevelDef[] | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetPreview = () => {
    setPreview(null)
    setPreviewError(null)
  }

  const applyPastePreview = (value: string) => {
    if (!value.trim()) {
      resetPreview()
      return
    }
    try {
      const { name: parsedName, levels } = parsePackJSON(value)
      setPreview(levels)
      setPreviewError(null)
      if (!name) setName(parsedName || levels[0]?.name || '')
    } catch (err) {
      setPreview(null)
      setPreviewError(err instanceof Error ? err.message : String(err))
    }
  }

  const applyFilePreview = (selected: File | null) => {
    if (!selected) {
      resetPreview()
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const { name: parsedName, levels } = parsePackJSON(text)
        setPreview(levels)
        setPreviewError(null)
        if (!name) {
          setName(parsedName || selected.name.replace(/\.json$/i, '') || levels[0]?.name || '')
        }
      } catch (err) {
        setPreview(null)
        setPreviewError(err instanceof Error ? err.message : String(err))
      }
    }
    reader.onerror = () => {
      setPreview(null)
      setPreviewError('Failed to read file')
    }
    reader.readAsText(selected)
  }

  const handleTabChange = (value: AddTab) => {
    setTab(value)
    resetPreview()
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    const finalName = name.trim() || 'Imported pack'
    try {
      if (tab === 'url') {
        await onAddFromURL(url.trim(), finalName)
      } else if (tab === 'upload' && file) {
        await onAddFromFile(file, finalName)
      } else if (tab === 'paste') {
        onAddFromJSON(json, finalName)
      }
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    }
  }

  const canSubmit =
    !loading &&
    !previewError &&
    ((tab === 'url' && url.trim()) ||
      (tab === 'upload' && file && !previewError) ||
      (tab === 'paste' && json.trim() && !previewError))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-stone-900 border-stone-700 text-amber-50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-200">Add level pack</DialogTitle>
          <DialogDescription className="text-amber-100/60">
            Load levels from a URL, a JSON file, or paste JSON directly.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => handleTabChange(v as AddTab)} className="mt-2">
          <TabsList className="bg-stone-800 border border-stone-700">
            <TabsTrigger
              value="url"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-amber-100/80"
            >
              URL
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-amber-100/80"
            >
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="paste"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-amber-100/80"
            >
              Paste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pack-url" className="text-amber-100/80">
                Level pack URL
              </Label>
              <Input
                id="pack-url"
                placeholder="https://example.com/levels.json"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-stone-950 border-stone-700 text-amber-50 placeholder:text-stone-500"
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-amber-100/80">JSON file</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null
                  setFile(selected)
                  applyFilePreview(selected)
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-stone-600 bg-stone-950 text-amber-100/70 hover:border-amber-500/50 hover:text-amber-200 transition-colors"
              >
                {file ? file.name : 'Click to choose a JSON file'}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pack-json" className="text-amber-100/80">
                JSON
              </Label>
              <Textarea
                id="pack-json"
                rows={8}
                placeholder={`[\n  { "name": "My Level", "hint": "...", ... }\n]`}
                value={json}
                onChange={(e) => {
                  setJson(e.target.value)
                  applyPastePreview(e.target.value)
                }}
                className="bg-stone-950 border-stone-700 text-amber-50 placeholder:text-stone-500 font-mono text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        {preview && (
          <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/50 px-3 py-2 text-sm text-emerald-200">
            Found {preview.length} level{preview.length === 1 ? '' : 's'}.
          </div>
        )}

        {(previewError || submitError) && (
          <div className="rounded-lg bg-red-950/40 border border-red-800/50 px-3 py-2 text-sm text-red-200">
            {previewError || submitError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pack-name" className="text-amber-100/80">
            Pack name
          </Label>
          <Input
            id="pack-name"
            placeholder="My level pack"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-stone-950 border-stone-700 text-amber-50 placeholder:text-stone-500"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-stone-600 text-amber-100 hover:bg-stone-800 hover:text-amber-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-amber-600 hover:bg-amber-500 text-white disabled:bg-stone-700 disabled:text-stone-500"
          >
            {loading ? 'Loading…' : 'Add pack'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
