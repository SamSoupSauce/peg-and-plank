import Matter from 'matter-js'
import type { LevelDef, Vec } from './types'
import { slotPos } from './types'

export const W = 960
export const H = 640

const SLOT_R = 9
const PEG_R = 12
const BALL_R = 13
const SNAP_DIST = 32
const CUP_WALL_T = 16

export interface Stats {
  moves: number
  emptySlots: number
  ballLive: boolean
  planksLive: boolean
}

export interface GameEvents {
  onStats: (s: Stats) => void
  onWin: () => void
  onBallLost: () => void
}

interface HeldPeg {
  fromSlot: number
  dragging: boolean // true once pointer moved enough (drag mode), false = click-carry mode
  startX: number
  startY: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

const CONFETTI = ['#f59e0b', '#4ade80', '#60a5fa', '#f472b6', '#facc15', '#a78bfa']

export class Game {
  private engine: Matter.Engine
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private events: GameEvents
  private raf = 0
  private lastTs = 0
  private acc = 0
  private time = 0
  private destroyed = false

  private level!: LevelDef
  private slots: Vec[] = []
  private pegs = new Map<number, Matter.Body>()
  private planks: (Matter.Body | null)[] = []
  private ball: Matter.Body | null = null
  private statics: Matter.Body[] = []
  private goalSensor: Matter.Body | null = null

  private moves = 0
  private won = false

  private pointer: Vec = { x: -999, y: -999 }
  private held: HeldPeg | null = null
  private hoverPeg = false
  private invalidFlash = 0
  private particles: Particle[] = []

  constructor(canvas: HTMLCanvasElement, events: GameEvents) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.events = events
    this.engine = Matter.Engine.create()
    this.engine.gravity.y = 1

    Matter.Events.on(this.engine, 'collisionStart', (e) => {
      if (this.won || !this.ball || !this.goalSensor) return
      for (const pair of e.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label]
        if (labels.includes('goal') && labels.includes('ball')) {
          this.handleWin()
          break
        }
      }
    })

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    canvas.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('keydown', this.onKeyDown)

    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    this.canvas.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('keydown', this.onKeyDown)
    Matter.Engine.clear(this.engine)
  }

  // ------------------------------------------------------------ level setup

  loadLevel(level: LevelDef) {
    const world = this.engine.world
    Matter.World.clear(world, false)
    this.level = level
    this.slots = Array.from({ length: level.grid.cols * level.grid.rows }, (_, i) =>
      slotPos(level.grid, i),
    )
    this.pegs.clear()
    this.planks = []
    this.ball = null
    this.statics = []
    this.goalSensor = null
    this.held = null
    this.moves = 0
    this.won = false
    this.particles = []
    this.invalidFlash = 0

    // boundary walls: left, right, ceiling — bottom stays open (ball can be lost)
    const wallOpts: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      label: 'wall',
      friction: 0.1,
      restitution: 0.1,
    }
    this.statics.push(
      Matter.Bodies.rectangle(-30, H / 2, 60, H * 3, wallOpts),
      Matter.Bodies.rectangle(W + 30, H / 2, 60, H * 3, wallOpts),
      Matter.Bodies.rectangle(W / 2, -40, W * 2, 80, wallOpts),
    )

    // the goal cup: two walls + a floor + a sensor inside
    const c = level.cup
    const cupOpts: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      label: 'cup',
      friction: 0.3,
      restitution: 0.1,
    }
    const floorY = c.y + c.h
    this.statics.push(
      Matter.Bodies.rectangle(c.x - c.w / 2 - CUP_WALL_T / 2, c.y + c.h / 2, CUP_WALL_T, c.h + CUP_WALL_T, cupOpts),
      Matter.Bodies.rectangle(c.x + c.w / 2 + CUP_WALL_T / 2, c.y + c.h / 2, CUP_WALL_T, c.h + CUP_WALL_T, cupOpts),
      Matter.Bodies.rectangle(c.x, floorY + CUP_WALL_T / 2, c.w + CUP_WALL_T * 2, CUP_WALL_T, cupOpts),
    )
    this.goalSensor = Matter.Bodies.rectangle(c.x, c.y + c.h / 2 + 6, c.w - 12, c.h - 12, {
      isStatic: true,
      isSensor: true,
      label: 'goal',
    })
    this.statics.push(this.goalSensor)

    // starting pegs
    for (const idx of level.pegs) {
      const p = this.slots[idx]
      this.pegs.set(idx, this.makePeg(p.x, p.y))
    }

    Matter.World.add(world, [...this.statics, ...this.pegs.values()])
    this.emitStats()
  }

  private makePeg(x: number, y: number): Matter.Body {
    return Matter.Bodies.circle(x, y, PEG_R, {
      isStatic: true,
      label: 'peg',
      friction: 0.8,
      restitution: 0.05,
    })
  }

  // ------------------------------------------------------------ public API

  dropPlanks() {
    const world = this.engine.world
    for (const p of this.planks) if (p) Matter.World.remove(world, p)
    this.planks = this.level.planks.map((d) =>
      Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, {
        label: 'plank',
        friction: 0.8,
        frictionStatic: 1.0,
        frictionAir: 0.008,
        restitution: 0.05,
        density: 0.002,
        chamfer: { radius: 5 },
        angle: ((d.angle ?? 0) * Math.PI) / 180,
      }),
    )
    Matter.World.add(world, this.planks as Matter.Body[])
    this.emitStats()
  }

  dropBall() {
    if (this.won) return
    if (this.planks.length === 0) this.dropPlanks()
    const world = this.engine.world
    if (this.ball) Matter.World.remove(world, this.ball)
    this.ball = Matter.Bodies.circle(this.level.ball.x, this.level.ball.y, BALL_R, {
      label: 'ball',
      friction: 0.05,
      frictionAir: 0.0012,
      restitution: 0.25,
      density: 0.004,
    })
    Matter.World.add(world, this.ball)
    this.emitStats()
  }

  // ------------------------------------------------------------ input

  private toLogical(e: PointerEvent): Vec {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    }
  }

  private pegSlotAt(p: Vec): number {
    for (const [idx, body] of this.pegs) {
      const dx = body.position.x - p.x
      const dy = body.position.y - p.y
      if (dx * dx + dy * dy < (PEG_R + 8) ** 2) return idx
    }
    return -1
  }

  private nearestSlot(p: Vec): number {
    let best = -1
    let bestD = SNAP_DIST
    for (let i = 0; i < this.slots.length; i++) {
      const dx = this.slots[i].x - p.x
      const dy = this.slots[i].y - p.y
      const d = Math.hypot(dx, dy)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best
  }

  /** Rule: a peg may only move if an empty slot exists on the wall. */
  private get emptySlotCount(): number {
    return this.slots.length - this.pegs.size - (this.held ? 1 : 0)
  }

  private onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    const p = this.toLogical(e)
    this.pointer = p
    this.canvas.setPointerCapture(e.pointerId)

    // carrying a peg in click mode -> try to place it
    if (this.held && !this.held.dragging) {
      const target = this.nearestSlot(p)
      if (target >= 0) {
        this.tryPlace(target)
      } else {
        this.cancelHold()
      }
      return
    }

    if (this.won) return

    const slot = this.pegSlotAt(p)
    if (slot >= 0) {
      if (this.emptySlotCount <= 0) {
        // no empty slot anywhere: pegs are locked in place
        this.invalidFlash = 1
        return
      }
      const body = this.pegs.get(slot)!
      this.pegs.delete(slot)
      Matter.World.remove(this.engine.world, body)
      this.held = { fromSlot: slot, dragging: false, startX: p.x, startY: p.y }
      this.emitStats()
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    const p = this.toLogical(e)
    this.pointer = p
    if (this.held && !this.held.dragging) {
      if (Math.hypot(p.x - this.held.startX, p.y - this.held.startY) > 6) {
        this.held.dragging = true
      }
    }
    this.hoverPeg = !this.held && this.pegSlotAt(p) >= 0
    this.canvas.style.cursor = this.held ? 'grabbing' : this.hoverPeg ? 'grab' : 'default'
  }

  private onPointerUp = (e: PointerEvent) => {
    const p = this.toLogical(e)
    this.pointer = p
    if (!this.held) return
    if (this.held.dragging) {
      const target = this.nearestSlot(p)
      if (target >= 0) {
        this.tryPlace(target)
      } else {
        this.cancelHold()
      }
    }
    // if it was a plain click, stay in click-carry mode (peg floats, next click places it)
  }

  private onPointerLeave = () => {
    this.pointer = { x: -999, y: -999 }
  }

  private onContextMenu = (e: Event) => {
    e.preventDefault()
    this.cancelHold()
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.cancelHold()
  }

  private cancelHold() {
    if (!this.held) return
    const s = this.slots[this.held.fromSlot]
    const body = this.makePeg(s.x, s.y)
    this.pegs.set(this.held.fromSlot, body)
    Matter.World.add(this.engine.world, body)
    this.held = null
    this.canvas.style.cursor = 'default'
    this.emitStats()
  }

  private tryPlace(target: number) {
    if (!this.held) return
    // target must be an EMPTY slot — the core rule of the game
    if (this.pegs.has(target)) {
      this.invalidFlash = 1
      if (this.held.dragging) this.cancelHold()
      return
    }
    const s = this.slots[target]
    // don't allow slamming a peg through a plank
    const test = Matter.Bodies.circle(s.x, s.y, PEG_R - 4, { isStatic: true })
    const livePlanks = this.planks.filter((p): p is Matter.Body => p !== null)
    const hits = Matter.Query.collides(test, livePlanks)
    if (hits.length > 0) {
      this.invalidFlash = 1
      if (this.held.dragging) this.cancelHold()
      return
    }
    const moved = target !== this.held.fromSlot
    const body = this.makePeg(s.x, s.y)
    this.pegs.set(target, body)
    Matter.World.add(this.engine.world, body)
    this.held = null
    this.canvas.style.cursor = 'default'
    if (moved) this.moves++
    this.emitStats()
  }

  // ------------------------------------------------------------ win / lose

  private handleWin() {
    this.won = true
    const c = this.level.cup
    for (let i = 0; i < 140; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 3 + Math.random() * 8
      this.particles.push({
        x: c.x,
        y: c.y + 10,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 6,
        life: 1,
        color: CONFETTI[i % CONFETTI.length],
        size: 3 + Math.random() * 4,
      })
    }
    this.events.onWin()
    this.emitStats()
  }

  private emitStats() {
    this.events.onStats({
      moves: this.moves,
      emptySlots: this.emptySlotCount,
      ballLive: this.ball !== null,
      planksLive: this.planks.length > 0,
    })
  }

  // ------------------------------------------------------------ main loop

  private loop = (ts: number) => {
    if (this.destroyed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(ts - this.lastTs || 16.7, 50)
    this.lastTs = ts
    this.time += dt / 1000
    this.acc += dt
    while (this.acc >= 16.666) {
      Matter.Engine.update(this.engine, 16.666)
      this.acc -= 16.666
    }

    // ball lost off the bottom
    if (this.ball && this.ball.position.y > H + 80) {
      Matter.World.remove(this.engine.world, this.ball)
      this.ball = null
      this.events.onBallLost()
      this.emitStats()
    }
    // sweep planks that fell out of the world (slot becomes a ghost again)
    for (let i = 0; i < this.planks.length; i++) {
      const p = this.planks[i]
      if (p && p.position.y > H + 200) {
        Matter.World.remove(this.engine.world, p)
        this.planks[i] = null
        this.emitStats()
      }
    }
    if (this.invalidFlash > 0) this.invalidFlash = Math.max(0, this.invalidFlash - dt / 500)

    // confetti
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i]
      pt.vy += 0.25
      pt.x += pt.vx
      pt.y += pt.vy
      pt.life -= dt / 1600
      if (pt.life <= 0) this.particles.splice(i, 1)
    }

    this.render()
  }

  // ------------------------------------------------------------ rendering

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cw = this.canvas.clientWidth
    const ch = this.canvas.clientHeight
    const w = Math.round(cw * dpr)
    const h = Math.round(ch * dpr)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
  }

  private render() {
    this.resize()
    const ctx = this.ctx
    const scale = this.canvas.width / W
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, W, H)

    // ---- backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#2b2116')
    bg.addColorStop(1, '#17100a')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // ---- wall panel
    const g = this.level.grid
    const px = g.x - 55
    const py = g.y - 55
    const pw = (g.cols - 1) * g.dx + 110
    const ph = (g.rows - 1) * g.dy + 110
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 6
    const panel = ctx.createLinearGradient(px, py, px, py + ph)
    panel.addColorStop(0, '#4a3822')
    panel.addColorStop(1, '#3a2b19')
    ctx.fillStyle = panel
    this.roundRect(px, py, pw, ph, 18)
    ctx.fill()
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,220,160,0.12)'
    ctx.lineWidth = 2
    this.roundRect(px, py, pw, ph, 18)
    ctx.stroke()

    // panel grooves
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    for (let i = 1; i < 6; i++) {
      const gy = py + (ph / 6) * i
      ctx.beginPath()
      ctx.moveTo(px + 10, gy)
      ctx.lineTo(px + pw - 10, gy)
      ctx.stroke()
    }

    // ---- ball spawn marker
    const b = this.level.ball
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(229,231,235,0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(b.x, b.y, BALL_R + 4 + Math.sin(this.time * 3) * 1.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // ---- goal cup
    this.renderCup(ctx)

    // ---- ghost planks (spawn markers for planks not currently in the world)
    for (let i = 0; i < this.level.planks.length; i++) {
      if (!this.planks[i]) this.renderGhostPlank(ctx, this.level.planks[i])
    }

    // ---- slots
    const hintSet = new Set(this.level.hintSlots ?? [])
    const target = this.held ? this.nearestSlot(this.pointer) : -1
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i]
      const occupied = this.pegs.has(i)
      // hole
      ctx.beginPath()
      ctx.arc(s.x, s.y, SLOT_R, 0, Math.PI * 2)
      ctx.fillStyle = occupied ? 'rgba(20,12,5,0.9)' : '#140d06'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(s.x, s.y + 1, SLOT_R - 2.5, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.strokeStyle = 'rgba(255,225,170,0.14)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      if (occupied) continue

      // hint pulse
      if (hintSet.has(i) && !this.won) {
        const pulse = 3 + Math.sin(this.time * 4) * 2
        ctx.beginPath()
        ctx.arc(s.x, s.y, SLOT_R + 4 + pulse, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(74,222,128,${0.55 + Math.sin(this.time * 4) * 0.25})`
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      // snap-target highlight while carrying a peg
      if (this.held && i === target) {
        const ok = !this.pegs.has(i)
        ctx.beginPath()
        ctx.arc(s.x, s.y, SLOT_R + 7, 0, Math.PI * 2)
        ctx.strokeStyle = ok ? '#4ade80' : '#f87171'
        ctx.lineWidth = 3
        ctx.stroke()
        if (ok) {
          ctx.beginPath()
          ctx.arc(s.x, s.y, PEG_R, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(74,222,128,0.25)'
          ctx.fill()
        }
      }
    }

    // ---- planks
    for (const p of this.planks) if (p) this.renderPlank(ctx, p)

    // ---- pegs
    for (const body of this.pegs.values()) this.renderPeg(ctx, body.position.x, body.position.y, 1)

    // ---- held peg ghost (floats at pointer, or at home slot in click-carry mode)
    if (this.held) {
      const home = this.slots[this.held.fromSlot]
      const gx = this.held.dragging || this.pointer.x > -100 ? this.pointer.x : home.x
      const gy = this.held.dragging || this.pointer.x > -100 ? this.pointer.y : home.y - 26
      const valid = target >= 0 && !this.pegs.has(target)
      this.renderPeg(ctx, gx, gy, 0.75, valid ? '#4ade80' : undefined)
      if (!this.held.dragging) {
        // bobbing hint ring at home slot
        ctx.beginPath()
        ctx.arc(home.x, home.y, PEG_R + 5 + Math.sin(this.time * 5) * 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(232,184,75,0.7)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    // ---- ball
    if (this.ball) {
      const { x, y } = this.ball.position
      const grad = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, BALL_R)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.4, '#cbd5e1')
      grad.addColorStop(1, '#64748b')
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.45)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 3
      ctx.beginPath()
      ctx.arc(x, y, BALL_R, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.restore()
    }

    // ---- confetti
    for (const pt of this.particles) {
      ctx.globalAlpha = Math.max(0, pt.life)
      ctx.fillStyle = pt.color
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size * 0.6)
    }
    ctx.globalAlpha = 1

    // ---- invalid action flash
    if (this.invalidFlash > 0) {
      ctx.fillStyle = `rgba(239,68,68,${this.invalidFlash * 0.12})`
      ctx.fillRect(0, 0, W, H)
    }
  }

  private renderCup(ctx: CanvasRenderingContext2D) {
    const c = this.level.cup
    const floorY = c.y + c.h
    // glow inside
    const glow = ctx.createLinearGradient(0, c.y, 0, floorY)
    glow.addColorStop(0, 'rgba(74,222,128,0.28)')
    glow.addColorStop(1, 'rgba(74,222,128,0.05)')
    ctx.fillStyle = glow
    ctx.fillRect(c.x - c.w / 2, c.y, c.w, c.h)
    // walls + floor
    ctx.fillStyle = '#475569'
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    const wallL = c.x - c.w / 2 - CUP_WALL_T
    const wallR = c.x + c.w / 2
    ctx.fillRect(wallL, c.y - 6, CUP_WALL_T, c.h + CUP_WALL_T)
    ctx.fillRect(wallR, c.y - 6, CUP_WALL_T, c.h + CUP_WALL_T)
    ctx.fillRect(wallL, floorY, c.w + CUP_WALL_T * 2, CUP_WALL_T)
    ctx.strokeRect(wallL, c.y - 6, CUP_WALL_T, c.h + CUP_WALL_T)
    ctx.strokeRect(wallR, c.y - 6, CUP_WALL_T, c.h + CUP_WALL_T)
    ctx.strokeRect(wallL, floorY, c.w + CUP_WALL_T * 2, CUP_WALL_T)
    // pulsing chevron
    if (!this.won) {
      const bob = Math.sin(this.time * 4) * 4
      ctx.save()
      ctx.translate(c.x, c.y - 26 + bob)
      ctx.fillStyle = 'rgba(74,222,128,0.9)'
      ctx.beginPath()
      ctx.moveTo(-10, 0)
      ctx.lineTo(10, 0)
      ctx.lineTo(0, 12)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }

  private renderGhostPlank(ctx: CanvasRenderingContext2D, d: { x: number; y: number; w: number; h: number; angle?: number }) {
    const pulse = 0.75 + Math.sin(this.time * 2.5) * 0.25
    ctx.save()
    ctx.translate(d.x, d.y)
    ctx.rotate(((d.angle ?? 0) * Math.PI) / 180)
    ctx.fillStyle = `rgba(217,160,94,${0.07 + pulse * 0.05})`
    ctx.strokeStyle = `rgba(217,160,94,${0.3 + pulse * 0.2})`
    ctx.lineWidth = 2
    ctx.setLineDash([7, 6])
    ctx.beginPath()
    ctx.roundRect(-d.w / 2, -d.h / 2, d.w, d.h, 5)
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])
    // small downward chevron above the ghost
    ctx.fillStyle = `rgba(217,160,94,${0.35 + pulse * 0.25})`
    ctx.beginPath()
    ctx.moveTo(-6, -d.h / 2 - 12)
    ctx.lineTo(6, -d.h / 2 - 12)
    ctx.lineTo(0, -d.h / 2 - 4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  private renderPlank(ctx: CanvasRenderingContext2D, body: Matter.Body) {
    const v = body.vertices
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 3
    ctx.beginPath()
    ctx.moveTo(v[0].x, v[0].y)
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y)
    ctx.closePath()
    const grad = ctx.createLinearGradient(
      body.position.x,
      body.position.y - 12,
      body.position.x,
      body.position.y + 12,
    )
    grad.addColorStop(0, '#d9a05e')
    grad.addColorStop(1, '#b87c3c')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
    ctx.beginPath()
    ctx.moveTo(v[0].x, v[0].y)
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y)
    ctx.closePath()
    ctx.strokeStyle = '#7a4f22'
    ctx.lineWidth = 2
    ctx.stroke()
    // grain lines along the plank
    const angle = body.angle
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const len = Math.max(body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y) / 2 - 14
    ctx.strokeStyle = 'rgba(122,79,34,0.45)'
    ctx.lineWidth = 1.5
    for (const off of [-3.5, 3.5]) {
      ctx.beginPath()
      ctx.moveTo(body.position.x - c * len - s * off, body.position.y - s * len + c * off)
      ctx.lineTo(body.position.x + c * len - s * off, body.position.y + s * len + c * off)
      ctx.stroke()
    }
  }

  private renderPeg(ctx: CanvasRenderingContext2D, x: number, y: number, alpha = 1, ring?: string) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3
    const grad = ctx.createRadialGradient(x - 3, y - 4, 2, x, y, PEG_R)
    grad.addColorStop(0, '#ffe9b0')
    grad.addColorStop(0.5, '#e8b84b')
    grad.addColorStop(1, '#a67c1e')
    ctx.beginPath()
    ctx.arc(x, y, PEG_R, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(x, y, PEG_R, 0, Math.PI * 2)
    ctx.strokeStyle = '#6b4e12'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x - 3.5, y - 4, 2.6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fill()
    if (ring) {
      ctx.beginPath()
      ctx.arc(x, y, PEG_R + 4, 0, Math.PI * 2)
      ctx.strokeStyle = ring
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
    ctx.restore()
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
}
