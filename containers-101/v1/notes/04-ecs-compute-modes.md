# 04 - Who manages what: the five ECS compute modes

**Time:** ~12 min - **Audience level:** the core of the session

## Hook

"Same container. Same task definition. The only question is how much of the machine you want to be responsible for."

Everything on this slide runs the *same image* with the *same container config*. Nothing about the application changes across the five modes. What changes is the ownership line - where AWS stops and you start.

## Walkthrough

Walk the ladder top to bottom. Each rung hands you back one more piece of the machine.

1. **ECS Express Mode - AWS does the wiring too.** One call:
   `aws ecs create-express-service --container-image <uri> --task-execution-role <arn> --infrastructure-role <arn>`.
   That single call provisions an ECS cluster on Fargate, a task definition, a service, an ALB with an HTTPS listener and target group (shared across up to 25 services via path/host routing), an ACM certificate, a Route 53 name like `my-service.ecs.<region>.on.aws`, VPC and subnets, security groups, service-linked roles, an Application Auto Scaling target and policy, a CloudWatch log group, and a failed-deployment alarm. AWS is not just running your container - it is building the network around it.

2. **AWS Fargate - AWS does the host.** You declare CPU and memory; you get a task with its own ENI inside its own microVM. There is no instance type to pick, no SSH, no custom AMI and no GPU. The boundary sits at the kernel: AWS owns the host and the kernel, you own the container.

3. **ECS Managed Instances - AWS operates *your* EC2.** GA late 2025. These are real EC2 instances, but AWS provisions, patches, scales and replaces them (roughly every 14 days). You still choose instance families and types, including GPU, Arm and Spot. No SSH, no custom AMI. Optimised for bin-packing and cost - Fargate ergonomics on EC2 hardware.

4. **ECS on EC2 - you operate it.** `launchType: EC2`. You own the Auto Scaling group, the AMI, patching, scaling and capacity-provider weights. This is the only mode with host access and custom kernels, and the reason to accept the operational load.

5. **ECS Anywhere - it is not even AWS hardware.** `launchType: EXTERNAL`. Your host runs the SSM Agent *and* the ECS Agent and registers into exactly one cluster with the `AmazonECSAnywhereRole`. There is no AWS load balancer integration for external instances - you route traffic yourself. Running containers survive a disconnect; new tasks are simply not scheduled until connectivity returns.

Land the point: the arrows into the workload nodes all come from one task definition on the left. The arrows into it from the right are the infrastructure ownership. The ladder is an ownership gradient, not five different products.

## Questions you will get

**"Is Managed Instances just Fargate with extra steps?"**
No. Fargate gives you a microVM with no instance concept at all. Managed Instances gives you real EC2: you pick instance families and types, including GPU, Arm and Spot, and ECS bin-packs tasks onto those instances for cost. AWS handles the provisioning, patching and the ~14-day replacement cycle. Different hardware model, different cost model.

**"Can I move between them?"**
The task definition is portable - that is the whole point of the diagram. What you change is the *service* configuration: launch type or capacity provider, networking mode, and whether you supply capacity. Expect to revisit host-dependent assumptions (GPU, custom kernels, daemons, host volumes) when moving toward Fargate.

**"Why is Express Mode not just a wizard?"**
Because a wizard hands you a template and walks away. Express Mode creates and owns real resources - the ALB, the ACM certificate, the Route 53 record, the autoscaling policy, the log group, the alarm. You can still see them in the console and edit them. It is a real service with real infrastructure, not scaffolding.

## Bridge to the next diagram

"That is all of ECS. Now the other orchestrator."
