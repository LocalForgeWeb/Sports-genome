# Higgsfield generation tool

A server-side command-line tool for generating images and videos through the
[Higgsfield](https://open.higgsfield.ai) API. It exists so the coding agent can
produce illustrations for this app (the slots recorded in
`docs/design-handoff/missing-illustrations.md`) when Gabe asks for them. It is
not a user-facing feature and nothing in `client/` imports it.

## Setup

Set the shared key as a server-only environment variable. It is the complete
key copied from [open.higgsfield.ai/api-keys](https://open.higgsfield.ai/api-keys),
pasted as-is; the tool adds the `Key` authorization scheme itself.

```
HF_API_KEY=<paste the key here>
# optional; defaults to https://api.higgsfield.ai
HF_API_BASE_URL=https://api.higgsfield.ai
```

Put it in an untracked `.env.local` (or export it in the shell). Never commit
it. `.env.example` carries an empty placeholder.

## Use

```
pnpm higgsfield models [--surface image|video]
pnpm higgsfield generate --model soul-2 --prompt "…" --label lat-pulldown-thumb --set aspectRatio=4:3
pnpm higgsfield generate --model kling-2.6 --prompt "…" --start design/ref.png --set duration=5
pnpm higgsfield upload design/ref.png          # prints the public URL
pnpm higgsfield status <request_id>
pnpm higgsfield wait <request_id> --label name
pnpm higgsfield cancel <request_id>
pnpm higgsfield runs
```

`generate` submits, polls until a terminal status (`completed`, `failed`,
`nsfw`, `canceled`), downloads the result into
`design/higgsfield/runs/<label>/` with a `manifest.json`, and prints the file
paths as JSON on stdout. Progress and errors go to stderr. Exit codes: 0
completed, 2 ended failed/nsfw/canceled, 3 duplicate refused, 4 key rejected.

`--set key=value` uses the catalog's setting names (`aspectRatio`,
`resolution`, `duration`, `generateAudio`, `batchSize`, …); `models` lists
each model's settings, allowed values and defaults. `--ref`, `--start`,
`--end`, `--video`, `--audio`, `--source` accept a local file (uploaded first)
or a public URL.

## Duplicate protection

Every submit is recorded in `design/higgsfield/runs/ledger.json` under a key
derived from the model path and the exact request body, **before** the POST is
sent. Running the same inputs again reuses a completed run instead of paying
for it twice, and refuses to resubmit while an earlier attempt's outcome is
unknown (a network failure mid-submit). `--force` overrides both. Timing out
while waiting never cancels the request; `cancel` does, and it reaches the
platform.

## Reference uploads

`POST /files/generate-upload-url` (authenticated) returns a signed ticket. The
tool then PUTs the bytes to the ticket's `upload_url` with exactly the
ticket's `upload_headers`, no Authorization header and no credentials, and
records the `public_url` only after the PUT succeeds. Signed URLs are never
logged or written to the ledger.

## Model catalog

`catalog/` is vendored from
[higgsfield-ai/app-templates](https://github.com/higgsfield-ai/app-templates)
at commit `9288d98` (`generation/catalog/`): every installed model file, the
mappers that turn a prompt, media and settings into the platform request, and
`sync-models.mjs`, which regenerates `catalog/models.generated.ts`. Add a model
by dropping a file in `catalog/models/` and running
`node scripts/higgsfield/sync-models.mjs`; never hand-edit the barrel. All 28
files (38 model entries) stay installed.

## What is verified and what is not

- Verified here: the client contract against a fake platform (auth header,
  submit/status/cancel/upload flows, backoff, terminal states, ledger), the
  catalog mapping for every installed model, typecheck and the test suite.
- **Not verified from this environment:** the sandbox's egress proxy blocks
  `api.higgsfield.ai`, `docs.higgsfield.ai` and `open.higgsfield.ai`, so the
  documentation index, per-model schemas and live behaviour could not be
  re-read or exercised. Endpoint paths and input schemas are exactly the
  template's at the commit above, which is the platform's own scaffold, but
  they are its mappings, not a fresh read of the docs. Before relying on a
  model, run `pnpm higgsfield models`, then a single small generation, and
  compare any `422` detail against that model's documentation. Access to a
  given model with Gabe's account has not been checked.
