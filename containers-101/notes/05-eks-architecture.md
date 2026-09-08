# 05 - Amazon EKS: managed Kubernetes, your data plane

**Time:** ~10 min - **Audience level:** assumes the ECS segment is done

## Hook

"Everything left of the boundary is AWS's problem. Everything right of it is yours - and there is a lot of it."

Say it while the diagram is on screen and let the two dashed boxes do the talking. The AWS-managed box holds two things. Your VPC box holds six, and every one of them is something you will eventually get paged about.

## Walkthrough

**1. Control plane vs data plane.** You run `kubectl apply` against the EKS API server. That API server, the scheduler and the controllers live in an AWS-owned account, spread across Availability Zones, with etcd behind them - encrypted, backed up, multi-AZ, and completely invisible to you. You cannot SSH to it, you cannot see the instances, and you cannot break it. That is the good news. The bad news is the other box: everything that actually runs your containers is in your VPC, on your account bill, under your operational ownership.

**2. Three ways to get nodes.** Point at the three runners stacked in the VPC box.
- **Managed node groups** - EC2 instances running the EKS-optimized AMI with kubelet already wired up. You pick instance types, you handle the AMI upgrade cycle (AWS makes it a one-click-ish operation, but it is still your cycle).
- **Karpenter** - a controller that watches for unschedulable pods and launches right-sized nodes just in time. Note the dashed arrow going *back* to the control plane: Karpenter is a client of the Kubernetes API, not a thing AWS runs for you by default.
- **EKS Auto Mode** - AWS provisions and manages the nodes, the core add-ons and the compute lifecycle for you. This is where AWS is steering new clusters (see Verified facts). Fargate profiles still exist and still work; they are just no longer the recommended default.

The teaching point: on ECS you chose between EC2 and Fargate. On EKS the same question has more answers, and the answers are Kubernetes controllers rather than AWS service settings.

**3. Why the VPC CNI matters.** The Amazon VPC CNI is not a detail. It assigns every pod a **real, routable VPC IP address** from an ENI on the node. Consequences worth saying out loud:
- Security groups and NACLs apply to pods, not merely to nodes.
- Load balancers can target pod IPs directly instead of hopping through node ports.
- Anything in the VPC can reach a pod's IP without an overlay or NAT.

And the planning concern nobody mentions until it bites: **IP exhaustion is real**. Each node holds a bounded number of ENIs, each ENI a bounded number of IPs, and every pod consumes one. A /24 subnet and a dense cluster will run out of addresses long before it runs out of CPU. Size subnets for pods, not for instances. (Prefix delegation and secondary CIDRs are the usual escape hatches - flag them, do not teach them here.)

**4. How pods get AWS permissions.** Follow the security-coloured arrow. IRSA and, more recently, EKS Pod Identity map a Kubernetes service account to an IAM role. The pod gets short-lived, scoped credentials for exactly the AWS APIs it needs. This is the Kubernetes equivalent of the ECS task role, and the same rule applies: never bake long-lived keys into an image, never hand the whole node role to every pod. ECR image pulls ride the node's own permissions - that is the dashed pull arrow.

**5. Ingress.** The AWS Load Balancer Controller runs *in your cluster*, watches Ingress and Service objects, and provisions an ALB or NLB to match. In IP mode the load balancer targets pod IPs directly - which only works because of point 3. Another controller you install, upgrade and own.

Close the walkthrough by counting: control plane (AWS), nodes (you), CNI (you), identity plumbing (you), ingress controller (you). That ratio is the whole lesson.

## Questions you will get

**"Is EKS harder than ECS?"**
Yes. Be straight about it. The price is a recurring Kubernetes version upgrade cycle - control plane, nodes and every add-on - plus managing the add-ons themselves (CNI, CoreDNS, kube-proxy, the load balancer controller, whatever operators you add). The payoff is the ecosystem and portability: Helm charts, operators, CRDs, admission controllers, a huge community, and manifests that run on any conformant Kubernetes. If you will not use those things, you are paying the tax and not collecting the benefit.

**"Do I need Karpenter?"**
Not to start. A managed node group is fine for a first cluster and is far easier to reason about. Add Karpenter (or move to Auto Mode) when node provisioning latency, bin-packing waste or spot-fleet diversity actually costs you money. Adopting a scaling controller on day one is a great way to debug two systems at once.

**"Can I run both ECS and EKS?"**
Yes, and plenty of teams do. They are separate control planes over the same primitives: your VPC, your ECR images, your IAM. A common split is ECS for the boring internal services and EKS where a team genuinely needs Kubernetes APIs. The cost is two operational models, so make it a deliberate choice rather than an accident of team preference.

## Verified facts

Both facts were checked with a web search on **2026-09-08** before this diagram was authored.

1. **EKS control-plane price (standard support): $0.10 per cluster per hour** (~$73/month per cluster at 730 hours), charged before any node, storage or networking cost, and excluding GovCloud/China. Extended support (after a version leaves the standard support window) is billed at a higher rate.
   - Verified: 2026-09-08, via web search of current published EKS pricing. Corroborating sources returned: `https://atmosly.com/blog/eks-pricing` and `https://tech-insider.org/ecs-vs-eks-vs-fargate-2026/`, both reporting the AWS list price of $0.10/cluster/hour for standard support.
   - Honest caveat: the canonical page `https://aws.amazon.com/eks/pricing/` could not be fetched directly from this environment (the fetch tool blocked the resolved address), so this figure rests on the search result above rather than on a first-party page I read myself. Re-check `aws.amazon.com/eks/pricing` before presenting.
   - This number is used verbatim in the first card: "An EKS cluster costs $0.10 per hour before any nodes".

2. **Fargate profiles for Amazon EKS: still generally available, no deprecation announced, but superseded as the recommendation by EKS Auto Mode.** AWS documentation states that Amazon EKS with AWS Fargate remains an option while "Amazon EKS Auto Mode is the recommended approach moving forward", and AWS publishes a Fargate-to-Auto-Mode migration guide; the two can coexist in one cluster during a transition. EKS Auto Mode has been generally available since December 2024 and adds capabilities Fargate lacks (DaemonSets, GPU support, broader networking, closer upstream conformance).
   - Verified: 2026-09-08, via web search. Sources returned: `https://docs.aws.amazon.com/eks/latest/userguide/auto-migrate-fargate.html` (the "recommended approach moving forward" wording and the migration guide), `https://docs.aws.amazon.com/eks/latest/userguide/automode.html`, and the GA announcement `https://aws.amazon.com/blogs/aws/streamline-kubernetes-cluster-management-with-new-amazon-eks-auto-mode/`. The AWS docs URLs could not be fetched directly from this environment either; the wording above is as returned by the search.
   - **Consequence applied to the diagram:** because AWS itself now recommends Auto Mode over Fargate, the `eks_fargate` component was replaced with `auto_mode` (type `backend`, label "EKS Auto Mode", sublabel "AWS-managed nodes, compute and add-ons") and its connection to `pods` is labelled "AWS provisions and manages nodes". If you are teaching a team with an existing Fargate-on-EKS estate, say explicitly that it is not deprecated and nothing is being switched off.

## Bridge to the next diagram

"Six options across two services. Let's make choosing mechanical."
