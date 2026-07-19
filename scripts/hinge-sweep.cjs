// Parameter sweep: what makes the fixed-peg hinge actually hold?
const Matter = require('matter-js')
const PEG_R = 12

function run(name, opts) {
  const engine = Matter.Engine.create()
  if (opts.constraintIterations) engine.constraintIterations = opts.constraintIterations
  if (opts.positionIterations) engine.positionIterations = opts.positionIterations
  const world = engine.world

  const fixedPeg = Matter.Bodies.circle(210, 170, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
  const supportPeg = Matter.Bodies.circle(300, 250, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
  const d = opts.plank
  const plank = Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, {
    friction: 0.8, frictionStatic: 1.0, frictionAir: 0.008, restitution: 0.05,
    density: opts.density ?? 0.002, chamfer: { radius: 5 }, angle: (d.angle * Math.PI) / 180,
  })
  const hinge = Matter.Constraint.create({
    bodyA: fixedPeg, pointA: opts.pointA,
    bodyB: plank, pointB: { x: -d.w / 2, y: 0 },
    stiffness: opts.stiffness ?? 1, length: 0,
  })
  fixedPeg.collisionFilter.group = -1
  plank.collisionFilter.group = -1
  Matter.World.add(world, [fixedPeg, supportPeg, plank, hinge,
    Matter.Bodies.rectangle(480, 640, 960, 40, { isStatic: true })])

  // settle 2s, then ball, then 4s more
  for (let i = 0; i < 120; i++) Matter.Engine.update(engine, 1000 / 60)
  const ball = Matter.Bodies.circle(230, 20, 13, { friction: 0.05, frictionAir: 0.0012, restitution: 0.25, density: 0.003 })
  Matter.World.add(world, ball)
  for (let i = 0; i < 240; i++) Matter.Engine.update(engine, 1000 / 60)

  // TRUE gap using Matter's own world-point semantics (stored pointB is kept rotated)
  const gapB = Matter.Constraint.pointBWorld(hinge)
  const gapA = Matter.Constraint.pointAWorld(hinge)
  const gap = Math.hypot(gapA.x - gapB.x, gapA.y - gapB.y)
  const speed = Matter.Vector.magnitude(plank.velocity)
  console.log(
    `${name.padEnd(46)} gap=${gap.toFixed(2).padStart(6)}px  ` +
    `angle=${((plank.angle * 180) / Math.PI).toFixed(1).padStart(5)}deg  speed=${speed.toFixed(2)}  ` +
    `ball=(${ball.position.x.toFixed(0)},${ball.position.y.toFixed(0)})`
  )
}

const NEW = { x: 270.6, y: 205, w: 140, h: 16, angle: 30 }   // center-pivot geometry
const OLD = { x: 261, y: 197.7, w: 96, h: 16, angle: 35.42 } // shipped geometry

console.log('--- baseline: shipped config (rim anchor, 96px) ---')
run('OLD rim anchor, 96px, defaults', { plank: OLD, pointA: { x: 12, y: 0 } })
console.log('--- new center pivot, 140px ---')
run('NEW center, 140px, defaults', { plank: NEW, pointA: { x: 0, y: 0 } })
run('NEW center, 140px, constraintIterations=10', { plank: NEW, pointA: { x: 0, y: 0 }, constraintIterations: 10 })
run('NEW center, 140px, density=0.0005', { plank: NEW, pointA: { x: 0, y: 0 }, density: 0.0005 })
run('NEW center, 140px, density=0.0005, cIter=10', { plank: NEW, pointA: { x: 0, y: 0 }, density: 0.0005, constraintIterations: 10 })
run('NEW center, 140px, stiffness=0.1 (springy)', { plank: NEW, pointA: { x: 0, y: 0 }, stiffness: 0.1 })
