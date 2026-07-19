// A/B test with the pointB rotation fix applied to both configs.
// A: shipped geometry (rim anchor, 96px plank, cup x=420)
// B: center pivot + 140px plank, cup x=420
const Matter = require('matter-js')
const PEG_R = 12

function run(name, cfg) {
  const engine = Matter.Engine.create()
  const world = engine.world
  const fixedPeg = Matter.Bodies.circle(210, 170, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
  const supportPeg = Matter.Bodies.circle(300, 250, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
  const d = cfg.plank
  const plank = Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, {
    friction: 0.8, frictionStatic: 1.0, frictionAir: 0.008, restitution: 0.05,
    density: 0.002, chamfer: { radius: 5 }, angle: (d.angle * Math.PI) / 180,
  })
  const hinge = Matter.Constraint.create({
    bodyA: fixedPeg, pointA: cfg.pointA,
    bodyB: plank,
    pointB: Matter.Vector.rotate({ x: -d.w / 2, y: 0 }, (d.angle * Math.PI) / 180),
    stiffness: 1, length: 0,
  })
  fixedPeg.collisionFilter.group = -1
  plank.collisionFilter.group = -1
  // cup: center (420,540), inner w=140, walls t=16, depth 60
  const cupL = Matter.Bodies.rectangle(420 - 70 - 8, 570, 16, 76, { isStatic: true })
  const cupR = Matter.Bodies.rectangle(420 + 70 + 8, 570, 16, 76, { isStatic: true })
  const cupB = Matter.Bodies.rectangle(420, 612, 172, 16, { isStatic: true })
  Matter.World.add(world, [fixedPeg, supportPeg, plank, hinge, cupL, cupR, cupB,
    Matter.Bodies.rectangle(480, 660, 960, 40, { isStatic: true }),
    Matter.Bodies.rectangle(-10, 320, 20, 680, { isStatic: true }),
    Matter.Bodies.rectangle(970, 320, 20, 680, { isStatic: true })])

  for (let i = 0; i < 90; i++) Matter.Engine.update(engine, 1000 / 60)
  const ball = Matter.Bodies.circle(230, 20, 13, { friction: 0.05, frictionAir: 0.0012, restitution: 0.25, density: 0.003 })
  Matter.World.add(world, ball)

  const local = { x: -d.w / 2, y: 0 }
  let won = false
  for (let step = 1; step <= 600; step++) {
    Matter.Engine.update(engine, 1000 / 60)
    if (!won && ball.position.y > 545 && ball.position.y < 605 &&
        ball.position.x > 350 && ball.position.x < 490) won = true
  }
  const end = Matter.Vector.add(plank.position, Matter.Vector.rotate(local, plank.angle))
  const joint = cfg.pointA.x === 0 ? { x: 210, y: 170 } : { x: 222, y: 170 }
  const gap = Math.hypot(end.x - joint.x, end.y - joint.y)
  const speed = Matter.Vector.magnitude(plank.velocity)
  const fe = Matter.Vector.add(plank.position, Matter.Vector.rotate({ x: d.w / 2, y: 0 }, plank.angle))
  console.log(`\n${name}`)
  console.log(`  hinge gap:      ${gap.toFixed(2)} px ${gap < 3 ? 'PASS' : 'FAIL'}`)
  console.log(`  rest angle:     ${((plank.angle * 180) / Math.PI).toFixed(1)} deg   speed: ${speed.toFixed(2)} ${speed < 0.5 ? 'PASS' : 'FAIL'}`)
  console.log(`  far end:        (${fe.x.toFixed(1)}, ${fe.y.toFixed(1)})  support peg top (300,238)`)
  console.log(`  ball in cup:    ${won ? 'PASS' : 'FAIL'}   final ball=(${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)})`)
}

run('A: shipped geometry + pointB fix only (rim anchor, 96px)', {
  plank: { x: 261, y: 197.7, w: 96, h: 16, angle: 35.42 },
  pointA: { x: PEG_R, y: 0 },
})
run('B: center pivot + 140px + pointB fix', {
  plank: { x: 270.6, y: 205, w: 140, h: 16, angle: 30 },
  pointA: { x: 0, y: 0 },
})
