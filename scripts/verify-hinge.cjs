// Headless verification of the Level 11 fixed-peg hinge fix (v2).
// Center pivot + 140px plank, support peg at slot 20, ball dropped after settle.
const Matter = require('matter-js')

const PEG_R = 12
const BALL_R = 13

const engine = Matter.Engine.create()
const world = engine.world

const fixedPeg = Matter.Bodies.circle(210, 170, PEG_R, {
  isStatic: true, label: 'peg-fixed', friction: 0.8, restitution: 0.05,
})
const supportPeg = Matter.Bodies.circle(300, 250, PEG_R, {
  isStatic: true, label: 'peg', friction: 0.8, restitution: 0.05,
})

const d = { x: 270.6, y: 205, w: 140, h: 16, angle: 30 }
const plank = Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, {
  label: 'plank', friction: 0.8, frictionStatic: 1.0, frictionAir: 0.008,
  restitution: 0.05, density: 0.002, chamfer: { radius: 5 },
  angle: (d.angle * Math.PI) / 180,
})

const hinge = Matter.Constraint.create({
  bodyA: fixedPeg, pointA: { x: 0, y: 0 },
  // FIXED: pointB as a world-axis offset = rotate(local end, spawn angle)
  bodyB: plank,
  pointB: Matter.Vector.rotate({ x: -d.w / 2, y: 0 }, (d.angle * Math.PI) / 180),
  stiffness: 1, length: 0,
})

fixedPeg.collisionFilter.group = -1
plank.collisionFilter.group = -1

// cup walls: center (420,540), opening w=140 -> walls at x=350 and x=490, depth 60
const cupL = Matter.Bodies.rectangle(350, 570, 16, 60, { isStatic: true })
const cupR = Matter.Bodies.rectangle(490, 570, 16, 60, { isStatic: true })
const cupB = Matter.Bodies.rectangle(420, 600, 156, 16, { isStatic: true })
const floor = Matter.Bodies.rectangle(480, 640, 960, 40, { isStatic: true })
const wallL = Matter.Bodies.rectangle(-10, 320, 20, 640, { isStatic: true })
const wallR = Matter.Bodies.rectangle(970, 320, 20, 640, { isStatic: true })

Matter.World.add(world, [fixedPeg, supportPeg, plank, hinge, cupL, cupR, cupB, floor, wallL, wallR])

const hingeWorldB = () =>
  Matter.Vector.add(plank.position, Matter.Vector.rotate({ x: -d.w / 2, y: 0 }, plank.angle))
const gap = () => {
  const b = hingeWorldB()
  return Math.hypot(b.x - 210, b.y - 170)
}
const farEnd = () =>
  Matter.Vector.add(plank.position, Matter.Vector.rotate({ x: d.w / 2, y: 0 }, plank.angle))

console.log('t=0  hinge gap:', gap().toFixed(3), 'px (expect ~0)')

let ball = null
let won = false
for (let step = 1; step <= 600; step++) {
  // drop the ball after the plank has settled (t=1.5s), like the real game flow
  if (step === 90) {
    ball = Matter.Bodies.circle(230, 20, BALL_R, {
      label: 'ball', friction: 0.05, frictionAir: 0.0012, restitution: 0.25, density: 0.003,
    })
    Matter.World.add(world, ball)
  }
  Matter.Engine.update(engine, 1000 / 60)
  if (ball && !won && ball.position.y > 540 && ball.position.y < 600 &&
      ball.position.x > 358 && ball.position.x < 482) won = true
  if (step % 60 === 0) {
    const fe = farEnd()
    console.log(
      `t=${(step / 60).toFixed(0)}s  gap=${gap().toFixed(2)}px  ` +
      `angle=${((plank.angle * 180) / Math.PI).toFixed(1)}deg  ` +
      `farEnd=(${fe.x.toFixed(1)}, ${fe.y.toFixed(1)})  ` +
      (ball ? `ball=(${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)})  ` : '') +
      `plankSpeed=${Matter.Vector.magnitude(plank.velocity).toFixed(2)}`
    )
  }
}

const finalGap = gap()
const speed = Matter.Vector.magnitude(plank.velocity)
const fe = farEnd()
console.log('\n--- RESULTS ---')
console.log('hinge drift:', finalGap.toFixed(2), 'px', finalGap < 3 ? 'PASS' : 'FAIL')
console.log('plank settled:', speed.toFixed(2), speed < 0.5 ? 'PASS' : 'FAIL')
console.log('plank rest angle:', ((plank.angle * 180) / Math.PI).toFixed(1), 'deg (expect ~30-40)')
console.log('far end:', fe.x.toFixed(1), fe.y.toFixed(1), '(support peg top = (300,238); end should overhang past x=300)')
console.log('ball in cup:', won ? 'PASS' : 'FAIL', ball ? `final=(${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)})` : '')
