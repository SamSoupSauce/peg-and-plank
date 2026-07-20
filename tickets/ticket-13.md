## Ticket 13

**Status:** Closed — item 1 resolved in v2.1.2 ([`fc405ef`](https://github.com/SamSoupSauce/peg-and-plank/commit/fc405ef), per-hinge negative collision group), item 2 resolved in v2.1.3 ([`525b4c5`](https://github.com/SamSoupSauce/peg-and-plank/commit/525b4c5), center-pivot hinge with corrected `pointB`; plank sits flush on the peg-center joint and the far end settles just above the support peg, verified in `scripts/final-verify.cjs`).

[Image](images/245dc1840802feab95be7003af6a3b8b0a42178fd908451ec853f052a6470552.png)

The issue now seems to be 2 things:
1. The collider for the hinge joint still seems to be colliding with the collider for the static peg. When connected, hinged joints should not collide with planks to which they are connected other than as a hinge.
2. The side of the plank that connects to the fixed peg should be even with the fixed peg. The side resting atop a normal peg should be a tiny bit higher than it already is.
