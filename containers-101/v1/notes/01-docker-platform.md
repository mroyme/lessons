# 01 — Docker: how a container actually runs

**Time:** ~10 min · **Audience level:** start here even with an experienced room

## Hook
"Everyone says containers are lightweight VMs. They are not. There is no second
operating system in this picture — point at the kernel box."

## Walkthrough
1. `dev → cli`: the command everyone has typed.
2. `cli → daemon`: the CLI is a REST client. Kill the daemon, the CLI does nothing.
3. `daemon → images → registry`: layers are cached; a pull only fetches what is missing.
4. `daemon → containerd → runc`: the part nobody sees. runc execs PID 1 and exits.
5. `container → kernel`: namespaces (what it sees) and cgroups (what it gets).
6. `container → volume / net`: the two things that must be explicit, or your data
   and your ports disappear.

## Questions you will get
- *"So is it faster than a VM?"* — Yes, because there is no boot of a second kernel.
- *"Can a container escape?"* — It is a process with restrictions; a kernel bug is a
  real boundary failure. This is why Fargate puts each task in its own microVM.
- *"Why does my data vanish?"* — The writable layer dies with the container. Volumes.

## Bridge to the next diagram
"You now know what runs. Next: what states it moves through."
