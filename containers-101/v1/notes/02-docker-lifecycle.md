# 02 - Docker: from Dockerfile to a dead container

**Time:** ~8 min - **Audience level:** everyone

## Hook

Run `docker ps -a` on your laptop right now. Count the corpses.

Every one of those rows is a container that already stopped and still has a
writable layer sitting on your disk. Nothing cleaned them up, because nothing
was asked to. That is the whole lesson: a container has states, and you move
between them with explicit commands.

## Walkthrough

- **Dockerfile -> Image built.** `docker build -t app:1.0 .` turns a recipe into
  a set of read-only layers. The image is inert - no process, no network.
- **Image built -> Created.** `docker create` (or the first half of `docker run`)
  materialises the writable layer and the config. The filesystem is ready, but
  there is still no process.
- **Created -> Running.** Start execs PID 1 inside the namespaces. The container
  is alive exactly as long as that one process is alive.
- **The three ways out of Running:**
  - **Stop.** `docker stop` sends SIGTERM, waits for the grace period (10s by
    default), then SIGKILL. You land in Exited - the writable layer is still on
    disk, and `docker start` brings the same container back.
  - **Pause.** `docker pause` freezes the process with the cgroup freezer.
    Memory is retained, nothing is killed, `docker unpause` resumes it.
  - **OOMKilled.** Cross the memory limit and the kernel kills PID 1 for you.
    A restart policy (`on-failure` / `always`) is what puts it back to Running.
- **Exited -> Removed.** `docker rm` is the only step that deletes the writable
  layer. Until then, exited is not deleted.

## Questions you will get

- **"Why did my container exit with 0 immediately?"** PID 1 finished. A container
  lives exactly as long as its main process - if that process is a script that
  ends, or a shell with nothing on stdin, the container is done and the exit
  code is honestly 0.
- **"Why is SIGKILL bad?"** There is no graceful drain. In-flight requests die,
  connections are cut mid-response, buffers are never flushed. SIGKILL cannot be
  caught, so the process gets no chance to finish work.
- **"What is the difference between stop and kill?"** The grace period.
  `docker stop` = SIGTERM, wait, then SIGKILL. `docker kill` = SIGKILL now. If
  PID 1 does not handle SIGTERM, both look identical from the outside.

## Bridge to the next diagram

Restart policies save one host. They restart a container in place; they do not
move work to another machine, they do not know about load balancers, rollouts,
or capacity. Now we need something that thinks about fleets.
