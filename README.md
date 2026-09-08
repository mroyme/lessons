# Lessons

Diagram-led teaching material for engineers. Each course is a self-contained folder of
interactive diagrams plus the talk track for delivering them to a room.

Browsing locally? Open [`index.html`](index.html) for the visual catalog.

## Courses

| Course | What it covers | Size |
|---|---|---|
| **[Containers 101 — Docker, ECS and EKS](containers-101/v1/)** | From "what actually runs when I type `docker run`" to choosing an AWS compute mode on purpose: the Docker runtime chain, the container lifecycle, the ECS control plane and all five of its compute modes, Amazon EKS, and a decision guide. | 6 diagrams · ~60 min |

### Containers 101

Start at [`containers-101/index.html`](containers-101/v1/index.html), or read the
[agenda and sources](containers-101/v1/README.md).

| # | Diagram | Talk track |
|---|---|---|
| 1 | [How a container actually runs](containers-101/v1/01-docker-platform.html) | [notes](containers-101/v1/notes/01-docker-platform.md) |
| 2 | [From Dockerfile to a dead container](containers-101/v1/02-docker-lifecycle.html) | [notes](containers-101/v1/notes/02-docker-lifecycle.md) |
| 3 | [One control plane, five places to run](containers-101/v1/03-ecs-control-plane.html) | [notes](containers-101/v1/notes/03-ecs-control-plane.md) |
| 4 | [Who manages what](containers-101/v1/04-ecs-compute-modes.html) | [notes](containers-101/v1/notes/04-ecs-compute-modes.md) |
| 5 | [Managed Kubernetes, your data plane](containers-101/v1/05-eks-architecture.html) | [notes](containers-101/v1/notes/05-eks-architecture.md) |
| 6 | [Which compute should this container use?](containers-101/v1/06-compute-decision-guide.html) | [notes](containers-101/v1/notes/06-compute-decision-guide.md) |

> **Note:** the diagrams are interactive HTML. GitHub's file viewer shows their source
> rather than rendering them — clone the repo and open the files, or serve the folder,
> to actually use them.

## How to view

The site is live at **<https://lessons.mroy.me/>**, published to GitHub Pages from
`main` and served over HTTPS.

To work with it locally:

```bash
git clone git@github.com:mroyme/lessons.git
cd lessons
open index.html          # macOS; or just open the file in any browser
```

Nothing loads from the network and there is no build step, so the whole set works
offline and on a locked-down conference laptop. Every diagram has a dark/light toggle,
pan and zoom, search, focus and relationship tracing, and export.

## Publishing

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys the repository
root to GitHub Pages on every push to `main`, and can also be run manually from the
Actions tab. There is no build step — the root is uploaded as-is, so `/` serves
[`index.html`](index.html) and `/containers-101/v1/` serves the course.

The deploy is gated on a link check:

```bash
node scripts/check-links.mjs .
```

It resolves every internal link in the authored HTML and Markdown and exits non-zero
if any target is missing, which catches the failure this layout is most prone to — a
relative link left behind when a course is copied into a new version folder. Generated
diagram artifacts are skipped, since their inline scripts contain href-like strings
that are not navigable links.

**Repository settings:** **Settings → Pages → Source** is **GitHub Actions**, with the
custom domain `lessons.mroy.me` (a DNS-only `CNAME` to `mroyme.github.io`, not proxied)
and **Enforce HTTPS** enabled. A fork will need its own values before the deploy step
can succeed.

## Repository layout

Each course is a top-level folder, and versions live *inside* the course so that every
course versions on its own schedule:

```
index.html                      catalog of all courses
scripts/check-links.mjs         internal link verification, run in CI
.github/workflows/pages.yml     GitHub Pages deploy
containers-101/
├── index.html                  points at the current version
└── v1/
    ├── index.html              entry point — links the diagrams in teaching order
    ├── README.md               agenda, timings, sources, re-render instructions
    ├── NN-<slug>.html          rendered diagrams, one self-contained file each
    ├── specs/                  the JSON specifications the diagrams are generated from
    └── notes/                  talk track per diagram: hook, walkthrough, expected questions
```

Every path inside a version folder is relative to that folder, so a version can be
copied to create the next one without rewriting a single link.

### Versioning

Version the course, not the catalog. When a course changes in a way that would break
someone mid-delivery — reordered segments, renamed diagrams, materially different
content — copy `vN/` to `vN+1/` and edit there, then repoint that course's
`index.html`. Leave the old version in place so an already-shared link keeps showing
what it showed when it was shared. Small corrections (a typo, a refreshed price, a
clearer label) are made in place and do not need a new version.

Because the version segment sits under the course, bumping one course never forces a
version decision about any other, and a course that has not changed is never
duplicated.

New courses are added as top-level folders starting at `v1/` and linked from
[`index.html`](index.html).

Diagrams are generated from the specs in `specs/` with the `archify` CLI; each course
README documents the exact re-render command.
