import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { downloadPack, isSeedPack, type LevelPack, type PackStats } from '@/game/packs'
import { AddPackDialog, type AddTab } from './AddPackDialog'


interface PackManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packs: LevelPack[]
  currentPackId: string | null
  getStats: (pack: LevelPack) => PackStats
  onSelectPack: (id: string) => void
  onDeletePack: (id: string) => void
  onAddFromURL: (url: string, name: string) => Promise<void>
  onAddFromFile: (file: File, name: string) => Promise<void>
  onAddFromJSON: (text: string, name: string) => void
  loading: boolean
}

const sourceLabel: Record<LevelPack['source'], string> = {
  'built-in': 'Built-in',
  url: 'URL',
  upload: 'Upload',
  paste: 'Paste',
}

export function PackManager({
  open,
  onOpenChange,
  packs,
  currentPackId,
  getStats,
  onSelectPack,
  onDeletePack,
  onAddFromURL,
  onAddFromFile,
  onAddFromJSON,
  loading,
}: PackManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addTab, setAddTab] = useState<AddTab>('url')
  const [addKey, setAddKey] = useState(0)

  const openAdd = (tab: AddTab) => {
    setAddTab(tab)
    setAddKey((k) => k + 1)
    setAddDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-stone-900 border-stone-700 text-amber-50 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-amber-200">Level packs</DialogTitle>
            <DialogDescription className="text-amber-100/60">
              Switch between packs or add new ones from a URL, file, or clipboard.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {packs.map((pack) => {
              const stats = getStats(pack)
              const active = pack.id === currentPackId
              return (
                <div
                  key={pack.id}
                  className={[
                    'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                    active
                      ? 'bg-amber-900/20 border-amber-600/40'
                      : 'bg-stone-950 border-stone-700 hover:border-stone-600',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-100 truncate">{pack.name}</span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                        {sourceLabel[pack.source]}
                      </span>
                    </div>
                    <div className="text-xs text-amber-100/50 mt-1">
                      {stats.completed}/{stats.total} completed · {stats.losses} ball loss
                      {stats.losses === 1 ? '' : 'es'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectPack(pack.id)
                        onOpenChange(false)
                      }}
                      className={[
                        'text-xs font-semibold',
                        active
                          ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                          : 'bg-stone-800 text-amber-100 hover:bg-stone-700',
                      ].join(' ')}
                    >
                      {active ? 'Selected' : 'Select'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPack(pack)}
                      className="text-xs border-stone-600 text-amber-100 hover:bg-stone-800 hover:text-amber-50"
                    >
                      Download
                    </Button>
                    {!isSeedPack(pack) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeletePack(pack.id)}
                        className="text-xs border-red-900/50 text-red-300 hover:bg-red-950/30 hover:text-red-200"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-500 text-white">+ Add pack</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-stone-900 border-stone-700 text-amber-50">
                <DropdownMenuItem
                  onClick={() => openAdd('url')}
                  className="hover:bg-stone-800 focus:bg-stone-800 cursor-pointer"
                >
                  Load from URL
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openAdd('upload')}
                  className="hover:bg-stone-800 focus:bg-stone-800 cursor-pointer"
                >
                  Upload JSON file
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openAdd('paste')}
                  className="hover:bg-stone-800 focus:bg-stone-800 cursor-pointer"
                >
                  Paste JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>

      <AddPackDialog
        key={addKey}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialTab={addTab}
        onAddFromURL={onAddFromURL}
        onAddFromFile={onAddFromFile}
        onAddFromJSON={onAddFromJSON}
        loading={loading}
      />
    </>
  )
}
