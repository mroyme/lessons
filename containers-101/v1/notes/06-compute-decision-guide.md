# 06 — Which compute should this container use?

**Time:** ~10 min · **Audience level:** the closing exercise, everyone participates

## Hook
"Nobody remembers a comparison table. Everybody remembers a first question."

## Walkthrough
Read the gates aloud, left to right. Stress the split:

1. **Runs outside AWS?** (on-prem, edge, data residency) → **ECS Anywhere**.
   `launchType: EXTERNAL`; you route the traffic yourself, there is no AWS ELB
   integration for external instances.
2. **Need Kubernetes?** (CRDs, operators, multi-cloud portability) → **Amazon EKS**.
   You also inherit the upgrade cycle and the add-on estate.
3. **Plain HTTPS service that needs DNS and TLS now?** → **ECS Express Mode**.
   One call creates the ALB, the ACM certificate, the Route 53 name and the alarms.
4. **Special hardware?** (GPU, Arm, Spot families) — if *no*, → **AWS Fargate**.
   Declare CPU and memory and forget that hosts exist.
5. **Need the host?** (custom AMI, daemon containers, kernel tuning) — if *no*,
   → **ECS Managed Instances** (AWS provisions, patches and replaces the EC2);
   if *yes*, → **ECS on EC2**, where you own the ASG, the AMI and the patching.

Gates 1–3 are **constraints** — they decide for you. Gates 4–5 are the only genuine
engineering trade-offs on the chart.

## Questions you will get
- *"What if two answers fit?"* — Take the higher gate. Less to operate wins.
- *"Where does Kubernetes-on-EC2-by-hand fit?"* — Off this chart, and that is
  intentional. If you are building your own control plane, this talk is not the
  decision you are making.
- *"Is this reversible?"* — Within ECS, yes: the task definition is portable and you
  change the service configuration. ECS ↔ EKS is a real migration.

## Bridge to the next diagram
This is the last diagram. Run the exercise instead — give the room three scenarios
and have them walk the chart out loud:

| Scenario | Answer | Why |
|---|---|---|
| Internal ML batch job that needs an A10G GPU | **ECS Managed Instances** | Not outside AWS, no Kubernetes need, not a web service, *yes* to special hardware, *no* to host access |
| Factory-floor service that must keep running through a WAN outage | **ECS Anywhere** | Gate 1 stops it immediately; running containers survive a disconnect |
| Marketing site that must be live before lunch | **ECS Express Mode** | Gate 3 — HTTPS, DNS, autoscaling and alarms from one command |

## Authoring note
The diagram has no separate "container image" start node: the workflow compiler
could not place a sixth main-rail column without either overlapping nodes or
forcing the branch edges into shared corridors. The first gate carries a
`start here` tag instead, which costs nothing semantically.
