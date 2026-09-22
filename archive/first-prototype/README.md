# First prototype - frozen before state

The `dist/` code and original tests in this directory are byte-for-byte copies of the first working MoveGraph prototype from Git commit `d86a5ab0127733649b63734868b52a43266f01cd` (`Build MoveGraph dependency planning prototype`). This README was added only to explain how to use that frozen snapshot for the before-and-after demo. The current product remains in the repository's root `dist/` directory.

## Run

From the repository root:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory archive/first-prototype/dist
```

Open http://127.0.0.1:4174.

## What to show

1. Point out the sidebar, MoveGraph branding, always-visible timeline, and competing interface regions.
2. Select **Simulate a change**. The product immediately applies a preset seven-day Housing delay rather than beginning with the person's actual edit.
3. Point out that Housing is the only meaningful date input and that the interface carries existing timing assumptions through the plan.
4. Switch to the current build and show direct date editing, human timing choices, a fixed ready-by deadline, review, comparison, and undo.

## Validate

```sh
node --test archive/first-prototype/tests/model.test.mjs
node --check archive/first-prototype/dist/app.js
node --check archive/first-prototype/dist/model.mjs
```

The snapshot deliberately contains no `.openai/hosting.json`, so it cannot overwrite the current hosted site by accident.
