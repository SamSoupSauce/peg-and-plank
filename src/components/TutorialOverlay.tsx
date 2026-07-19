import { useMemo, useState } from 'react'
import type { LevelDef, TutorialBubble, Vec } from '@/game/types'
import { slotPos } from '@/game/types'
import { H, W } from '@/game/engine'

interface TutorialOverlayProps {
  level: LevelDef
  bubbles: TutorialBubble[]
  onComplete: () => void
  onMarkSeen: (ids: string[]) => void
}

export function TutorialOverlay({ level, bubbles, onComplete, onMarkSeen }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0)
  const bubble = bubbles[index]

  const slots = useMemo<Vec[]>(() => {
    const total = level.grid.cols * level.grid.rows
    return Array.from({ length: total }, (_, i) => slotPos(level.grid, i))
  }, [level.grid])

  if (!bubble) return null

  const finish = () => {
    onMarkSeen(bubbles.map((b) => b.id))
    onComplete()
  }

  const highlight = bubble.highlight
  const highlightPos = highlight?.target.slot !== undefined ? slots[highlight.target.slot] : null

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8 pointer-events-auto">
      {highlightPos && highlight && (
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${(highlightPos.x / W) * 100}%`,
            top: `${(highlightPos.y / H) * 100}%`,
            width: 56,
            height: 56,
            transform: 'translate(-50%, -50%)',
            borderWidth: 4,
            borderStyle: 'dashed',
            borderColor: `rgb(${highlight.color.r}, ${highlight.color.g}, ${highlight.color.b})`,
            boxShadow: `0 0 24px rgba(${highlight.color.r}, ${highlight.color.g}, ${highlight.color.b}, 0.75)`,
          }}
        />
      )}

      <div className="w-full max-w-md mx-4 bg-stone-900/95 border border-amber-500/40 rounded-2xl px-6 py-5 text-center shadow-2xl backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-amber-100 whitespace-pre-line text-sm leading-relaxed text-left flex-1">
            {bubble.message}
          </p>
          <button
            onClick={finish}
            className="text-amber-100/40 hover:text-amber-100 text-xs font-medium shrink-0"
          >
            Skip
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {bubbles.map((_, i) => (
            <span
              key={i}
              className={[
                'w-2 h-2 rounded-full',
                i === index ? 'bg-amber-400' : 'bg-stone-600',
              ].join(' ')}
            />
          ))}
        </div>
        <button
          onClick={() => {
            if (index >= bubbles.length - 1) {
              finish()
            } else {
              setIndex(index + 1)
            }
          }}
          className="mt-4 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold text-sm transition-colors"
        >
          {bubble.buttonText}
        </button>
      </div>
    </div>
  )
}
