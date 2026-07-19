// Final verification: config B (center pivot + 140px) with cup moved to the
// ball's natural landing point, plus the no-support-peg (unsolved) scenario.
const Matter = require('matter-js')
const PEG_R = 12

function run(name, cfg) {
  const engine = Matter.Engine.create()
  const world = engine.world
  const fixedPeg = Matter.Bodies.circle(210, 170, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 })
  const d = cfg.plank
  const plank = Matter.Bodies.rectangle(d.x, d.y, d.w, d.h, {
    friction: 0.8, frictionStatic: 1.0, frictionAir: 0.008, restitution: 0.05,
    density: 0.002, chamfer: { radius: 5 }, angle: (d.angle * Math.PI) / 180,
  })
  const hinge = Matter.Constraint.create({
    bodyA: fixedPeg, pointA: { x: 0, y: 0 },
    bodyB: plank,
    pointB: Matter.Vector.rotate({ x: -d.w / 2, y: 0 }, (d.angle * Math.PI) / 180),
    stiffness: 1, length: 0,
  })
  fixedPeg.collisionFilter.group = -1
  plank.collisionFilter.group = -1
  const bodies = [fixedPeg, plank, hinge,
    Matter.Bodies.rectangle(480, 660, 960, 40, { isStatic: true }),
    Matter.Bodies.rectangle(-10, 320, 20, 680, { isStatic: true }),
    Matter.Bodies.rectangle(970, 320, 20, 680, { isStatic: true })]
  if (cfg.support) bodies.push(Matter.Bodies.circle(300, 250, PEG_R, { isStatic: true, friction: 0.8, restitution: 0.05 }))
  if (cfg.cup) {
    const cx = cfg.cupX
    bodies.push(
      Matter.Bodies.rectangle(cx - 78, 570, 16, 76, { isStatic: true }),
      Matter.Bodies.rectangle(cx + 78, 570, 16, 76, { isStatic: true }),
      Matter.Bodies.rectangle(cx, 612, 172, 16, { isStatic: true }))
  }
  Matter.World.add(world, bodies)

  for (let i = 0; i < 90; i++) Matter.Engine.update(engine, 1000 / 60)
  const ball = Matter.Bodies.circle(230, 20, 13, { friction: 0.05, frictionAir: 0.0012, restitution: 0.25, density: 0.003 })
  Matter.World.add(world, ball)

  let won = false
  for (let step = 1; step <= 600; step++) {
    Matter.Engine.update(engine, 1000 / 60)
    if (cfg.cup && !won && ball.position.y > 545 && ball.position.y < 605 &&
        ball.position.x > cfg.cupX - 70 && ball.position.x < cfg.cupX + 70) won = true
  }
  const end = Matter.Vector.add(plank.position, Matter.Vector.rotate({ x: -d.w / 2, y: 0 }, plank.angle))
  const gap = Math.hypot(end.x - 210, end.y - 170)
  const speed = Matter.Vector.magnitude(plank.velocity)
  const fe = Matter.Vector.add(plank.position, Matter.Vector.rotate({ x: d.w / 2, y: 0 }, plank.angle))
  console.log(`\n${name}`)
  console.log(`  hinge gap:   ${gap.toFixed(2)} px ${gap < 3 ? 'PASS' : 'FAIL'}   plank speed: ${speed.toFixed(2)} ${speed < 0.5 ? 'PASS' : 'FAIL'}`)
  console.log(`  rest angle:  ${((plank.angle * 180) / Math.PI).toFixed(1)} deg   far end: (${fe.x.toFixed(1)}, ${fe.y.toFixed(1)})`)
  if (cfg.cup) console.log(`  ball in cup: ${won ? 'PASS' : 'FAIL'}   final ball=(${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)})`)
}

const PLANK = { x: 270.6, y: 205, w: 140, h: 16, angle: 30 }
run('SOLVED state: support peg placed, cup at x=545', { plank: PLANK, support: true, cup: true, cupX: 545 })
run('UNSOLVED state: no support peg (should hang stable, no explosion)', { plank: PLANK, support: false, cup: false })
