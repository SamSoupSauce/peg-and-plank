import { useEffect, useMemo, useRef, useState } from 'react'
import { Game, type Stats } from './game/engine'
import { usePacks } from './hooks/usePacks'
import { PackManager } from './components/PackManager'
import './App.css'

function computeStars(moves: number, drops: number, par?: number): number {
  if (par === undefined) return 0
  const total = moves + drops
  if (total <= par) return 3
  if (total <= par + 2) return 2
  return 1
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const levelIdxRef = useRef(0)

  const {
    packs,
    currentPackId,
    currentPack,
    progress,
    stats,
    getStatsForPack,
    selectPack,
    addPackFromURL,
    addPackFromFile,
    addPackFromJSON,
    removePack,
    winLevel,
    loseBall,
    loading,
  } = usePacks()

  const [levelIdx, setLevelIdx] = useState(0)
  const [statsState, setStatsState] = useState<Stats>({
    moves: 0,
    drops: 0,
    emptySlots: 0,
    ballLive: false,
    planksLive: false,
  })
  const [winStars, setWinStars] = useState(0)
  const [won, setWon] = useState(false)
  const [lostFlash, setLostFlash] = useState(false)
  const [chipVisible, setChipVisible] = useState(true)
  const [managerOpen, setManagerOpen] = useState(false)
  const statsRef = useRef(statsState)

  const levels = useMemo(() => currentPack?.levels ?? [], [currentPack])
  const level = levels[levelIdx]

  useEffect(() => {
    statsRef.current = statsState
  }, [statsState])

  // Create / reset the game whenever the active pack changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || levels.length === 0) return

    levelIdxRef.current = 0
    setLevelIdx(0)
    setWon(false)

    const game = new Game(canvas, {
      onStats: (s) => setStatsState(s),
      onWin: () => {
        const s = statsRef.current
        const par = levels[levelIdxRef.current]?.par
        const stars = computeStars(s.moves, s.drops, par)
        setWinStars(stars)
        setWon(true)
        winLevel(levelIdxRef.current, stars)
      },
      onBallLost: () => {
        loseBall()
        setLostFlash(true)
        window.setTimeout(() => setLostFlash(false), 2200)
      },
    })
    gameRef.current = game
    game.loadLevel(levels[0])

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [currentPack, levels, winLevel, loseBall])

  const goLevel = (i: number) => {
    if (levels.length === 0) return
    const idx = Math.max(0, Math.min(i, levels.length - 1))
    levelIdxRef.current = idx
    setLevelIdx(idx)
    setWon(false)
    gameRef.current?.loadLevel(levels[idx])
  }

  return (
    <div className="min-h-screen bg-[#120d08] text-amber-50 flex flex-col items-center px-4 py-6">
      {/* header */}
      <header className="w-full max-w-[960px] flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-amber-200">
            Peg <span className="text-amber-500">&</span> Plank
          </h1>
          <p className="text-sm text-amber-100/60 mt-1">
            A 2D physics puzzle — pegs hold planks, planks guide the ball.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setManagerOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-600 text-amber-100/80 hover:bg-stone-700 hover:text-amber-100 text-sm font-medium transition-colors"
          >
            🎒 Packs
          </button>
          <div className="flex items-center gap-2">
            {levels.map((l, i) => {
              const locked = i > progress.unlocked
              const active = i === levelIdx
              const star = progress.stars[i] ?? 0
              return (
                <button
                  key={l.name}
                  disabled={locked}
                  onClick={() => goLevel(i)}
                  title={locked ? 'Finish the previous level to unlock' : l.name}
                  className={[
                    'w-9 h-9 rounded-lg font-semibold text-sm transition-colors border relative',
                    active
                      ? 'bg-amber-400 text-amber-950 border-amber-300'
                      : locked
                        ? 'bg-stone-800/50 text-stone-600 border-stone-700 cursor-not-allowed'
                        : 'bg-stone-800 text-amber-100/80 border-stone-600 hover:bg-stone-700',
                  ].join(' ')}
                >
                  {locked ? '🔒' : i + 1}
                  {!locked && star > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] leading-none">{'⭐'.repeat(star)}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* stage */}
      <div className="relative w-full max-w-[960px] rounded-2xl overflow-hidden ring-1 ring-amber-900/50 shadow-2xl shadow-black/60">
        <canvas ref={canvasRef} className="game-canvas" />

        {loading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="text-amber-200 text-lg font-semibold animate-pulse">Loading pack…</div>
          </div>
        )}

        {/* level title chip */}
        {!loading && level && chipVisible ? (
          <div className="absolute top-3 left-3 pl-3 pr-1.5 py-1.5 rounded-lg bg-black/45 backdrop-blur-sm text-sm flex items-center gap-2">
            <span className="text-amber-300 font-semibold">
              {levelIdx + 1}. {level.name}
            </span>
            <span className="text-amber-100/50 ml-1">Moves: {statsState.moves}</span>
            <span className="text-amber-100/50 ml-1">Drops: {statsState.drops}</span>
            {level?.maxDrops !== undefined && (
              <span className="text-amber-100/50 ml-1">/ {level.maxDrops}</span>
            )}
            {level?.par !== undefined && (
              <span className="text-amber-100/50 ml-1">Par: {level.par}</span>
            )}
            <span className="text-amber-100/40 text-xs ml-1 border border-amber-500/20 px-1.5 py-0.5 rounded truncate max-w-[120px]">
              {currentPack?.name}
            </span>
            <button
              onClick={() => setChipVisible(false)}
              title="Hide panel"
              className="ml-1 w-5 h-5 rounded flex items-center justify-center text-amber-100/50 hover:text-amber-100 hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : !loading && level ? (
          <button
            onClick={() => setChipVisible(true)}
            title={`${levelIdx + 1}. ${level.name} — show panel`}
            className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-black/45 backdrop-blur-sm text-amber-100/50 hover:text-amber-100 hover:bg-black/60 text-xs font-semibold transition-colors"
          >
            {levelIdx + 1}
          </button>
        ) : null}

        {/* ball lost toast */}
        {lostFlash && !won && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-200 text-sm animate-pulse">
            Ball lost — drop it again!
          </div>
        )}

        {/* win overlay */}
        {won && level && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-stone-900/95 border border-amber-500/40 rounded-2xl px-10 py-8 text-center shadow-2xl">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-amber-300">Level complete!</h2>
              <p className="text-amber-100/60 mt-1 text-sm">
                {winStars > 0 ? '⭐'.repeat(winStars) : '⭐'} · {statsState.moves} moves · {statsState.drops} drops
              </p>
              {level?.par !== undefined && (
                <p className="text-amber-100/40 mt-0.5 text-xs">Par: {level.par}</p>
              )}
              <div className="mt-5 flex gap-3 justify-center">
                <button
                  onClick={() => goLevel(levelIdx)}
                  className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-amber-100 text-sm font-medium"
                >
                  Replay
                </button>
                {levelIdx < levels.length - 1 ? (
                  <button
                    onClick={() => goLevel(levelIdx + 1)}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 text-sm font-semibold"
                  >
                    Next level →
                  </button>
                ) : (
                  <span className="px-4 py-2 text-sm text-amber-200/80">
                    You finished every level. Master carpenter! 🪵
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      <div className="w-full max-w-[960px] mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => gameRef.current?.dropPlanks()}
          disabled={loading || !level || (level.maxDrops !== undefined && statsState.drops >= level.maxDrops)}
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-semibold text-sm shadow-lg shadow-amber-950/50 transition-colors"
        >
          🪵 Drop planks
          {level?.maxDrops !== undefined && (
            <span className="ml-1.5 text-xs opacity-80">({Math.max(0, level.maxDrops - statsState.drops)})</span>
          )}
        </button>
        <button
          onClick={() => gameRef.current?.dropBall()}
          disabled={loading || !level}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 transition-colors"
        >
          ⚪ Drop ball
        </button>
        <button
          onClick={() => goLevel(levelIdx)}
          disabled={loading || !level}
          className="px-5 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 disabled:bg-stone-800 disabled:text-stone-500 text-amber-100 font-semibold text-sm transition-colors"
        >
          ↺ Reset level
        </button>
        <div className="ml-auto text-sm text-amber-100/70 bg-stone-900/70 border border-stone-700/60 rounded-xl px-4 py-2.5 max-w-[430px]">
          {level ? `💡 ${level.hint}` : '💡 Loading hint…'}
        </div>
      </div>

      {/* pack progress footer */}
      {currentPack && (
        <div className="w-full max-w-[960px] mt-3 flex items-center gap-4 text-xs text-amber-100/55 bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-2">
          <span className="font-semibold text-amber-300">{currentPack.name}</span>
          <span>
            {stats.completed}/{stats.total} completed
          </span>
          <span>
            {stats.losses} ball loss{stats.losses === 1 ? '' : 'es'}
          </span>
          <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* rules */}
      <footer className="w-full max-w-[960px] mt-4 grid sm:grid-cols-3 gap-3 text-xs text-amber-100/55">
        <div className="bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3">
          <span className="text-amber-300 font-semibold">1 · Move pegs.</span> Drag a peg to any{' '}
          <em>empty</em> wall slot — or click a peg, then click a slot. No empty slot, no move.
        </div>
        <div className="bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3">
          <span className="text-amber-300 font-semibold">2 · Drop planks.</span> Planks fall and rest
          on your pegs, forming ramps and bridges. Re-drop them after every rebuild.
        </div>
        <div className="bg-stone-900/50 border border-stone-800 rounded-xl px-4 py-3">
          <span className="text-amber-300 font-semibold">3 · Drop the ball.</span> Guide it into the
          glowing cup. If it falls off the bottom, it's gone — adjust and retry.
        </div>
      </footer>

      <PackManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        packs={packs}
        currentPackId={currentPackId}
        getStats={getStatsForPack}
        onSelectPack={(id) => {
          selectPack(id)
          setManagerOpen(false)
        }}
        onDeletePack={removePack}
        onAddFromURL={addPackFromURL}
        onAddFromFile={addPackFromFile}
        onAddFromJSON={addPackFromJSON}
        loading={loading}
      />
    </div>
  )
}
