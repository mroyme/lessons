# Containers 101 — Docker, ECS and EKS

A six-diagram teaching set for a mixed-experience room: from "what actually runs when
I type `docker run`" to "which AWS compute mode should this container use, and why".

Open [`index.html`](index.html) to start.

## Teaching order

| # | Diagram | Talk track | Time |
|---|---|---|---|
| 1 | [`01-docker-platform.html`](01-docker-platform.html) — how a container actually runs | [`notes/01-docker-platform.md`](notes/01-docker-platform.md) | ~10 min |
| 2 | [`02-docker-lifecycle.html`](02-docker-lifecycle.html) — from Dockerfile to a dead container | [`notes/02-docker-lifecycle.md`](notes/02-docker-lifecycle.md) | ~8 min |
| 3 | [`03-ecs-control-plane.html`](03-ecs-control-plane.html) — one control plane, five places to run | [`notes/03-ecs-control-plane.md`](notes/03-ecs-control-plane.md) | ~10 min |
| 4 | [`04-ecs-compute-modes.html`](04-ecs-compute-modes.html) — who manages what | [`notes/04-ecs-compute-modes.md`](notes/04-ecs-compute-modes.md) | ~12 min |
| 5 | [`05-eks-architecture.html`](05-eks-architecture.html) — managed Kubernetes, your data plane | [`notes/05-eks-architecture.md`](notes/05-eks-architecture.md) | ~10 min |
| 6 | [`06-compute-decision-guide.html`](06-compute-decision-guide.html) — which compute should this container use? | [`notes/06-compute-decision-guide.md`](notes/06-compute-decision-guide.md) | ~10 min |

Total: roughly 60 minutes of material plus questions.

## How to run this session

1. Open `index.html` in a browser. Everything is local — no network, no build step.
2. One diagram per segment, in order. Each notes file gives you a hook, a walkthrough,
   the questions you will actually get, and a one-line bridge to the next diagram.
3. Use the viewer as you talk: **Light/Dark** for the room's projector, **pan/zoom**
   to push a box to the front, **search** to jump to a node, and **focus** to isolate
   one relationship chain while you explain it.
4. Close with diagram 6 as a group exercise. Read the gates aloud and let the room
   answer. Three worked scenarios are at the bottom of
   [`notes/06-compute-decision-guide.md`](notes/06-compute-decision-guide.md).

Diagram 1 is worth keeping even for an experienced room — the `containerd` / `runc`
split is the part most people have never seen, and diagrams 3 and 5 both refer back
to it.

## Re-rendering

Specs live in [`specs/`](specs/). Each was validated at `showcase` quality and then
delivered; **a spec is frozen once its validation passes** — if you change one, you
must re-run the full validate → deliver → visual-check loop, not just re-render.

```bash
ARCHIFY=/Users/madhurjya.roy/.agents/skills/archify/bin/archify.mjs

# validate first (must report 9/9 checks, 0 errors, 0 warnings)
node $ARCHIFY validate architecture specs/01-docker-platform.architecture.json --quality showcase --json

# then deliver (final acceptance; non-zero exit is never success)
node $ARCHIFY deliver architecture specs/01-docker-platform.architecture.json 01-docker-platform.html --quality showcase --json

# then collect browser evidence from the delivered file
node $ARCHIFY visual-check 01-docker-platform.html --json
```

Diagram types by file: `architecture` for 01, 03, 04 and 05; `lifecycle` for 02;
`workflow` for 06.

`visual-check` writes `*.visual-check.*` PNG/JSON/HTML sidecars next to the artifact.
They are gitignored — they are evidence, not deliverables.

### What the checks do and do not prove

- `deliver` proves deterministic artifact checks and reports SHA-256 plus byte counts.
- `visual-check` proves bounded behaviour in a real browser (desktop containment and a
  minimum projected text size at 1440×900, 1600×1000, 1920×1080 and 2048×1320).
- Neither approves perceptual quality. Every diagram in this set was additionally
  reviewed by opening its 1440×900 capture; that is a human-equivalent glance, not a
  design sign-off.

## Facts verified on 2026-09-08

All AWS behaviour asserted in these diagrams was checked on 2026-09-08 rather than
recalled. Recent or volatile items:

- **ECS Express Mode** — `aws ecs create-express-service` and the full list of resources
  it provisions (Fargate cluster, task definition, service, ALB with HTTPS listener and
  target group shared across up to 25 services, ACM certificate, a
  `my-service.ecs.<region>.on.aws` Route 53 name, VPC/subnets, security groups,
  service-linked roles, Application Auto Scaling, CloudWatch log group, failed-deployment
  alarm).
- **ECS Managed Instances** — GA late 2025; AWS provisions, patches and replaces the EC2
  (roughly every 14 days), you still filter instance families including GPU, Arm and Spot,
  and there is no SSH or custom AMI.
- **ECS Anywhere** — `launchType: EXTERNAL`, SSM Agent plus ECS Agent, registration into
  exactly one cluster via `AmazonECSAnywhereRole`, **no AWS load balancer integration**,
  and running containers survive a disconnect while new tasks are not scheduled.
- **Amazon EKS** — control-plane price of **$0.10 per cluster per hour** on standard
  support, and the status of Fargate profiles versus EKS Auto Mode.

Two caveats are recorded honestly rather than smoothed over, both in
[`notes/05-eks-architecture.md`](notes/05-eks-architecture.md) under *Verified facts*:

1. `aws.amazon.com/eks/pricing` and the AWS EKS documentation pages could not be fetched
   directly from the authoring environment, so the $0.10/hour figure and the Auto Mode
   wording rest on search results rather than a first-party page that was read end to end.
   Re-check both before quoting them to a room that will act on the number.
2. **Fargate profiles for EKS are not deprecated.** AWS documents EKS Auto Mode as "the
   recommended approach moving forward" and publishes a Fargate-to-Auto-Mode migration
   guide, so diagram 5 shows `EKS Auto Mode`. If you are teaching a team with an existing
   Fargate-on-EKS estate, say explicitly that nothing is being switched off.

## Authoring notes

- No AWS brand marks appear anywhere. Only `docker` and `kubernetes` exist as built-in
  brand presets in the renderer, and no official logo URLs were supplied, so AWS
  components carry no badge. A missing badge costs nothing semantically.
- Diagram 6 has no separate "container image" start node: the workflow compiler could not
  place a sixth main-rail column without overlapping nodes or forcing branch edges into
  shared corridors. The first gate carries a `start here` tag instead.
- Diagram 2 uses the lifecycle renderer's reserved lane ids (`main`, `trouble`,
  `terminal`) rather than arbitrary ones. All eight states, their columns and all ten
  transition labels are unchanged.
- The diagrams are static. No trace motion and no guided view chapters were added,
  because neither was asked for. Both are a follow-up, not a fix.
