# 03 - Amazon ECS: one control plane, five places to run

**Time:** ~10 min - **Audience level:** first AWS-specific segment

## Hook

"ECS is not a place your containers run. It is an API that decides where they run."

Everything on this diagram to the left of the fan-out is a control plane you never
operate. Everything on the right is compute you may or may not operate. Keep that
split in your head for the whole segment.

## Walkthrough

Start at `You` on the far left, outside the region box. You call the ECS API with the
CLI, CDK or Terraform - `RegisterTaskDefinition` and `CreateService`. There is no
cluster to install first.

**Task definition = the recipe.** It names the image, the CPU/memory reservation, the
IAM roles and where logs go. It is immutable and versioned: you never edit revision 7,
you register revision 8. Point at the `taskdef` box and say "this is a document, not a
running thing".

**Service = desired state.** `ECS Service` holds the desired count, the rollout
strategy and the autoscaling rules. It is the thing that says "I want N copies of
revision 8, always".

**The scheduler reconciles desired vs running.** That is the whole job of the box
labelled `ECS API + Scheduler`. It compares what the service asked for with what is
actually alive, and it launches or stops tasks until the two match. Amazon ECR supplies
the image at task launch; the load balancer's target group is wired to the task ENIs.

Then walk the fan-out once, naming each destination exactly once:

- `ECS Express Mode` - one API call, opinionated defaults.
- `AWS Fargate` - serverless tasks, `launchType: FARGATE`.
- `ECS Managed Instances` - an AWS-operated EC2 fleet, selected by capacity provider.
- `ECS on EC2` - your Auto Scaling group, your AMI, `launchType: EC2`.
- `ECS Anywhere` - your own servers, on-premises, `launchType: EXTERNAL`. Note that it
  is deliberately drawn outside the AWS Region box.

Close by promising the next diagram: "The next slide compares these five side by side -
who patches, who scales, who pays."

## Questions you will get

**"Is ECS Kubernetes?"** No. ECS is AWS-proprietary with a far smaller API surface -
task definitions, services, clusters, capacity providers. There are no pods,
controllers, CRDs or an extensible scheduler. Smaller surface, less to learn, less to
bend.

**"What does ECS cost?"** The control plane is free. The ECS API and scheduler cost
nothing, and there is no per-cluster fee. You pay only for the compute your tasks land
on - Fargate vCPU/GB-seconds, EC2 instance hours, or nothing at all to AWS for your own
ECS Anywhere hardware.

**"Do I have to pick a mode up front?"** No. The task definition is portable - the same
revision can target `launchType: FARGATE`, `launchType: EC2` or `launchType: EXTERNAL`.
What changes is the service's launch type or capacity provider, not the recipe. Managed
Instances is the one chosen by capacity provider rather than by launch type.

## Bridge to the next diagram

"Five boxes on the right. Let's find out who does the work in each."
