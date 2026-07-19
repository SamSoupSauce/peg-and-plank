// Measure the ball's trajectory off the fixed Level 11 ramp (post-fix geometry).
const Matter = require('matter-js')
const PEG_R = 12

const engine = Matter.Engine.create()
const world = engine.world
const fixedPeg = Matter.Bodies.circle(210, 170, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
const supportPeg = Matter.Bodies.circle(300, 250, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
const d = { x: 270.6, y: 205, w: 140, h: 16, angle: 30 }
const plank = Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, {
  friction: 0.8, frictionStatic: 1.0, frictionAir: 0.008, restitution: 0.05,
  density: 0.002, chamfer: { radius: 5 }, angle: (d.angle * Math.PI) / 180,
})
const hinge = Matter.Constraint.create({
  bodyA: fixedPeg, pointA: { x: 0, y: 0 },
  bodyB: plank, pointB: Matter.Vector.rotate({ x: -d.w / 2, y: 0 }, (d.angle * Math.PI) / 180),
  stiffness: 1, length: 0,
})
fixedPeg.collisionFilter.group = -1
plank.collisionFilter.group = -1
Matter.World.add(world, [fixedPeg, supportPeg, plank, hinge,
  Matter.Bodies.rectangle(480, 640, 960, 40, { isStatic: true })])

for (let i = 0; i < 90; i++) Matter.Engine.update(engine, 1000 / 60)
const ball = Matter.Bodies.circle(230, 20, 13, { friction: 0.05, frictionAir: 0.0012, restitution: 0.25, density: 0.003 })
Matter.World.add(world, ball)

let crossed = null
for (let step = 1; step <= 600; step++) {
  Matter.Engine.update(engine, 1000 / 60)
  if (!crossed && ball.position.y - 13 >= 527) { // ball bottom reaches cup rim y=540
    crossed = { x: ball.position.x, y: ball.position.y, vx: ball.velocity.x, vy: ball.velocity.y, t: step / 60 }
  }
}
console.log('ball crosses cup-rim height (y=540) at:',
  crossed ? `x=${crossed.x.toFixed(1)} vx=${crossed.vx.toFixed(2)} vy=${crossed.vy.toFixed(2)} t=${crossed.t}s` : 'never')
console.log('cup opening: x 350 .. 490 (center 420, w 140)')
console.log('ball final:', ball.position.x.toFixed(1), ball.position.y.toFixed(1))
