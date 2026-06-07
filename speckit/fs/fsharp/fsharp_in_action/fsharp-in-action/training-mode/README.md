# F# in Action Training Mode

This is a local browser tutorial inspired by Try F# style learning. It maps the repository's topic samples into small runnable steps and executes each editor cell through `dotnet fsi`.

## Run

```powershell
python .\training-mode\server.py
```

Then open:

```text
http://127.0.0.1:8765
```

## Notes

- The server is dependency-free Python and binds to `127.0.0.1` by default.
- The browser posts code to `/api/run`; the server writes a temporary `.fsx` file and executes `dotnet fsi --exec`.
- The workbench includes Code, Output, and Inference tabs. Inference uses F# Interactive to return `val`, `type`, and `module` signatures.
- The editor uses local F# syntax highlighting. Full Ionide/FSAutocomplete hover and completion is not bundled; install FSAutocomplete separately if you want to build that next.
- Scripts run from the OS temp directory so the repo's `global.json` does not pin the tutorial runner to .NET 6.
- Each run has a 12 second timeout.
- Lesson snippets are standalone, even when the original topic files include intentional non-compiling examples, NuGet references, or full project setup.
