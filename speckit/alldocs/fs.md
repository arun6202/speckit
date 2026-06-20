# F# — The Advanced & Unique Feature Set
### A coach's reference: warm up the intuition, drill the form, load the heavy set

> Voice: **functional trainer**. Each feature opens with a **Coach's note** (beginner→medium intuition), then the **working set** (idiomatic F#), then the **heavy load** (the deep point that makes the feature *uniquely F#*).
> Conventions: ⚠️ marks a C#-ism that would be a discipline violation if it leaked into idiomatic F#. Verified against **F# 10 / .NET 10** (Nov 2025).
> Officer's law in force: *parse don't validate · types as proofs · DUs over classes · Result over exceptions.*

---

## 0. Why F# is not "C# with `let`"

The features below are not syntactic sugar over the same semantics. They are *different semantics*: the type system does work at compile time that C# defers to runtime (or never does). The throughline of every section is **moving proof obligations to the compiler**.

---

## 1. Discriminated Unions — make illegal states unrepresentable

**Coach's note.** A DU is "this value is *exactly one* of these shapes." Where C# reaches for an `enum` + a bag of nullable fields ⚠️, F# encodes the *whole* shape, including the data each case carries, in one type.

```fsharp
// Each case can carry differently-typed payloads.
type ConnectionState =
    | Disconnected
    | Connecting of attempt: int
    | Connected of sessionId: string * since: System.DateTime
    | Failed of reason: string

// Recursive DUs model trees with zero ceremony.
type Json =
    | JNull
    | JBool   of bool
    | JNumber of float
    | JString of string
    | JArray  of Json list
    | JObject of (string * Json) list

// Single-case DU: a free, allocation-controllable newtype.
type CustomerId = CustomerId of int
type OrderId    = OrderId    of int
// CustomerId and OrderId are now NON-interchangeable. The classic bug
// `placeOrder customerId orderId` with the args swapped won't compile.

// Struct DU: stack-allocated, no heap pressure on hot paths.
[<Struct>]
type Cursor =
    | Start
    | At of offset: int64
    | Done
```

**Heavy load.** The payoff is *total reasoning*. Once you model `ConnectionState` like this, there is **no representable value** for "connected but no session id." In C# that invalid combination exists and you defend against it with runtime checks forever. Here, the set of illegal states is literally empty — the compiler enforces it. This is the foundation of every "parse don't validate" boundary you build.

---

## 2. Exhaustive pattern matching — the compiler audits your branches

**Coach's note.** `match` is `switch`'s stronger sibling: it *destructures* values and the compiler **fails the build** if you forget a case.

```fsharp
let describe (state: ConnectionState) =
    match state with
    | Disconnected                  -> "idle"
    | Connecting attempt            -> $"connecting (try {attempt})"
    | Connected (sid, _) when sid="" -> "connected, anonymous"   // guard
    | Connected (sid, since)        -> $"session {sid} since {since:O}"
    | Failed reason                 -> $"failed: {reason}"
    // Delete any arm above and the compiler errors: "incomplete matches".
```

The full pattern vocabulary — all composable:

```fsharp
let classify xs =
    match xs with
    | []                         -> "empty"
    | [x]                        -> $"singleton {x}"
    | [_; _]                     -> "pair"
    | first :: _ :: _ :: _       -> $"3+, head={first}"        // cons + wildcard
    | head :: tail               -> $"{head} then {List.length tail} more"

let route (method, path) =
    match method, path with                                    // tuple match
    | "GET",  "/health"          -> 200
    | "POST", p when p.StartsWith "/api" -> 202                // guard on tuple
    | ("PUT" | "PATCH"), _       -> 204                         // OR-pattern
    | _                          -> 404

// `as` binds the whole while also destructuring the parts:
let dedupeHead =
    function
    | (x :: _) as whole when List.length whole > 1 -> Some x
    | _ -> None
```

**Heavy load.** Exhaustiveness is a *theorem checker for your control flow*. Add a case to a DU used in 40 `match` sites and the compiler hands you the exact 40 places that now need a decision. This is refactoring as a type-driven worklist — the single biggest reason large F# changes are safe. ⚠️ A `_ ->` catch-all silently *defeats* this; reach for it only at genuine system boundaries, never to "save typing."

---

## 3. Active Patterns — extend `match` with your own deconstructors

**Coach's note.** Pattern matching is normally limited to a type's literal shape. Active patterns let you match on *computed* properties — you teach `match` new vocabulary. This feature essentially does not exist outside F#.

```fsharp
// (1) Total / multi-case ("banded") — partitions input into named cases.
let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd
match 17 with Even -> "e" | Odd -> "o"   // -> "o"

// (2) Partial — may not match; returns option. Note the |_| .
let (|Int|_|) (s: string) =
    match System.Int32.TryParse s with
    | true, v  -> Some v
    | false, _ -> None

let (|Prefixed|_|) (prefix: string) (s: string) =          // (3) Parameterized
    if s.StartsWith prefix then Some (s.Substring prefix.Length) else None

// Compose them — this reads like a grammar, not a parser:
let parseFlag (token: string) =
    match token with
    | Prefixed "--" (Int level) -> Ok (sprintf "verbosity=%d" level)
    | Prefixed "--" name        -> Ok (sprintf "flag=%s" name)
    | Int _                     -> Error "bare number, expected a flag"
    | _                         -> Error "unrecognised token"
```

A single-case active pattern as a *named view* over data:

```fsharp
let (|Cents|) (price: decimal) = int (price * 100M)
let priceBand (Cents c) = if c < 1000 then "cheap" else "premium"
//             ^^^^^^^ destructures via computation, right in the parameter list
```

**Heavy load.** Active patterns decouple *how you match* from *how data is stored*. You can present an immutable, total, abstract interface (`Even|Odd`, `Prefixed`) over arbitrary internals, and the rest of the codebase pattern-matches against the *interface* with full exhaustiveness checking on banded patterns. This is the idiomatic F# answer to the visitor pattern ⚠️ — without the boilerplate or the open-recursion footguns.

---

## 4. Units of Measure — dimensional analysis at compile time

**Coach's note.** Numbers that mean different things (metres, seconds, dollars) get *typed* so the compiler refuses to add a length to a time. No runtime cost — measures are erased after type-checking. Genuinely unique to F#.

```fsharp
[<Measure>] type m
[<Measure>] type s
[<Measure>] type kg

let distance = 100.0<m>
let time     = 9.58<s>
let speed    = distance / time          // inferred type: float<m/s>

// let nonsense = distance + time        // ⚠️ COMPILE ERROR: m vs s

[<Measure>] type N = kg m / s^2          // derived units compose algebraically
let force (mass: float<kg>) (a: float<m/s^2>) : float<N> = mass * a

// Strongly-typed domain quantities — not just physics:
[<Measure>] type USD
[<Measure>] type row
let unitPrice   = 0.0003<USD/row>
let rowsLoaded  = 1_000_000_000.0<row>
let billing     = unitPrice * rowsLoaded     // float<USD>, dimensionally checked
```

**Heavy load.** This catches an entire bug class — unit confusion, the Mars Climate Orbiter family — *at compile time, for free*. For your ETL world it's a quiet superpower: tag `<row>`, `<doc>`, `<byte>`, `<ms>` on the primitives flowing through the pipeline and the type checker guarantees you never divide bytes by rows where you meant rows by docs. Combine with §12's `Refined` to get *both* dimension and value-range proofs on one scalar.

---

## 5. Computation Expressions — build your own monad with first-class syntax

**Coach's note.** `async { }`, `task { }`, `seq { }` are not keywords — they're *user-definable* builders. You can author your own `{ }` block for any effect: option, result, parser, and — your house idiom — the **Writer** monad for telemetry.

```fsharp
// A Writer<'T> threading a log of telemetry events alongside a pure value.
type Writer<'T> = Writer of value: 'T * log: string list

module Writer =
    let run (Writer (v, log)) = v, List.rev log

type WriterBuilder() =
    member _.Return x                 = Writer (x, [])
    member _.ReturnFrom w             = w
    member _.Bind (Writer (x, l1), f) =
        let (Writer (y, l2)) = f x
        Writer (y, l2 @ l1)                       // accumulate effects
    member _.Zero ()                  = Writer ((), [])

let writer = WriterBuilder()
let tell msg = Writer ((), [msg])                 // emit one telemetry event

// Now business logic reads as straight-line code; the log threads invisibly.
let loadBatch (n: int) = writer {
    do! tell $"begin batch n={n}"
    let doubled = n * 2
    do! tell $"transformed -> {doubled}"
    return doubled
}

let value, telemetry = Writer.run (loadBatch 21)
// value = 42 ; telemetry = ["begin batch n=21"; "transformed -> 42"]
```

The `result { }` railway, the same machinery applied to short-circuiting:

```fsharp
type ResultBuilder() =
    member _.Return x        = Ok x
    member _.ReturnFrom r    = r
    member _.Bind (r, f)     = Result.bind f r
    member _.Zero ()         = Ok ()
let result = ResultBuilder()

let validateOrder qty price = result {
    let! q = if qty   > 0  then Ok qty   else Error "qty must be positive"
    let! p = if price > 0M then Ok price else Error "price must be positive"
    return q, p          // only reached if BOTH succeed; first Error wins
}
```

**Heavy load.** CEs are F#'s answer to Haskell's `do`-notation, but *open*: `let!`, `do!`, `return!`, `match!`, `use!`, `and!` (applicative), plus `Combine`/`Delay`/`Run`/`TryWith`/`Using` give you full control over sequencing, resource scope, and even *parallelism* (`and!`). Your typed-telemetry-as-first-class-DU design is exactly a Writer CE where the log is a `TelemetryEvent list` instead of strings — pure Planner code stays pure and *describes* its effects, the Runner interprets them. F# 10 also tightened CE binding consistency, smoothing some long-standing `let!`/`use!` edge cases.

---

## 6. SRTP + `inline` — statically-resolved duck typing

**Coach's note.** Sometimes you want "any type that has a `+`" or "anything with an `.Area` member" without an interface or base class. C# can't express this without an interface ⚠️. F# resolves it *at compile time* per call site via Statically Resolved Type Parameters.

```fsharp
// `inline` + ^T means: resolve the constraint at each usage, monomorphised.
let inline sumAll (xs: ^a list) : ^a =
    List.fold (+) LanguagePrimitives.GenericZero xs

sumAll [1; 2; 3]            // int
sumAll [1.0<m>; 2.0<m>]     // float<m> — measures survive!

// Explicit member constraint: "any ^T that has a float Area property."
let inline totalArea (shapes: ^T list) =
    shapes |> List.sumBy (fun s -> (^T : (member Area : float) s))

type Circle = { R: float } with member c.Area = System.Math.PI * c.R ** 2.0
type Square = { S: float } with member s.Area = s.S * s.S
totalArea [ {R=1.0}; {R=2.0} ]    // works structurally, no shared base type
```

**Heavy load.** SRTP is *parametric polymorphism over structure*, resolved and inlined with zero virtual-dispatch cost. It's how `FSharp.Core` defines generic arithmetic and how libraries do typeclass-style abstraction (the `Functor`/`Monad`-by-convention trick). Use it deliberately — it's contagious (`inline` propagates) and error messages degrade fast. The discipline: SRTP for genuine structural generality, plain generics + interfaces everywhere else.

---

## 7. Type Providers — types generated from live data at compile time

**Coach's note.** A type provider *manufactures types from an external schema during compilation* — a database, a JSON sample, a CSV, an OpenAPI doc. The IDE then autocompletes columns that exist in your actual Oracle table. Nothing remotely like this exists in mainstream languages.

```fsharp
// (Illustrative — requires FSharp.Data / a DB provider package.)
open FSharp.Data

type Stocks = CsvProvider<"Date,Open,Close\n2026-01-01,100.0,101.5">
let data = Stocks.Load "history.csv"
for row in data.Rows do
    printfn "%A closed at %f" row.Date row.Close   // row.Close is typed float,
                                                   // validated against the schema

type Api = JsonProvider<""" {"id":1,"tags":["a"]} """>
let parsed = Api.Parse """ {"id":7,"tags":["etl","fsharp"]} """
parsed.Tags |> Array.iter (printfn "%s")           // .Tags : string[], inferred
```

**Heavy load.** This is "parse don't validate" pushed *into the compiler's front end*. The schema is the single source of truth; drift between code and schema becomes a build error, not a 3 a.m. page. Your `OracleSchemaProvider`/`ElasticsearchProvider`/`LineageProvider` triangle is the apex use of this: three providers mutually constraining each other so a field-mapping mismatch between source and sink *cannot compile*. No other ecosystem lets the type system reach out and read your warehouse.

---

## 8. Code Quotations — F# expressions as inspectable data

**Coach's note.** Wrap code in `<@ … @>` and instead of *running* it you get its **AST** as a value — to analyse, transpile, or compile to something else (SQL, GPU kernels, JS).

```fsharp
open Microsoft.FSharp.Quotations
open Microsoft.FSharp.Quotations.Patterns

let q : Expr<int> = <@ 1 + 2 * 3 @>      // the EXPRESSION, not the number 7

let rec describe expr =
    match expr with
    | Value (v, _)              -> string v
    | Call (_, mi, args)        -> $"{mi.Name}({args |> List.map describe |> String.concat \", \"})"
    | Lambda (p, body)          -> $"λ{p.Name}.{describe body}"
    | _                         -> "<expr>"

describe q     // -> "op_Addition(1, op_Multiply(2, 3))"
```

**Heavy load.** Quotations are the mechanism behind LINQ-to-SQL-style translation done *right*: you write ordinary F# predicates, capture them as `Expr`, and a backend walks the tree to emit Elasticsearch query DSL, SQL, or a Lucene query — with the F# type checker having already validated the predicate. It's metaprogramming where the meta-language and object-language are the same typed language.

---

## 9. Object Expressions — implement an interface without writing a class

**Coach's note.** Need a one-off `IComparer` or `IDisposable`? Don't declare a class ⚠️. Instantiate the interface inline.

```fsharp
open System.Collections.Generic

let descending : IComparer<int> =
    { new IComparer<int> with
        member _.Compare(a, b) = compare b a }

// Multiple interfaces, captured closure state, all anonymous:
let scopedTimer (label: string) =
    let sw = System.Diagnostics.Stopwatch.StartNew()
    { new System.IDisposable with
        member _.Dispose() = printfn "%s took %dms" label sw.ElapsedMilliseconds }

let work () = use _ = scopedTimer "load"
              System.Threading.Thread.Sleep 10        // auto-times via `use`
```

**Heavy load.** Object expressions keep you in expression-oriented, closure-capturing style while still satisfying .NET's nominal interface contracts. They're the glue at the OO/FP boundary — adapt a functional core to an interface-shaped API surface without dragging class declarations and mutable fields into your domain.

---

## 10. Records — immutable by default, copy-and-update, anonymous, struct

**Coach's note.** Records are product types with structural equality *for free*. No `Equals`/`GetHashCode` boilerplate ⚠️, no `record class` ceremony.

```fsharp
type Address = { City: string; Pin: string }
type Person  = { Name: string; Age: int; Address: Address }

let arun = { Name = "Arun"; Age = 35; Address = { City = "Bangalore"; Pin = "560001" } }

// Copy-and-update: new value, original untouched.
let older = { arun with Age = 36 }

// NESTED copy-and-update (F# 8+) — no manual re-nesting:
let moved = { arun with Address.City = "Chennai" }

// Anonymous records — ad-hoc shapes, structurally typed, great for projections:
let summary = {| arun.Name; Rows = 1_000_000_000L; ok = true |}
//             {| Name: string; Rows: int64; ok: bool |}

// Struct record — value semantics, no heap allocation:
[<Struct>] type Point = { X: float; Y: float }

// Structural equality and comparison come built-in:
{ City="A"; Pin="1" } = { City="A"; Pin="1" }     // true
```

**Heavy load.** Immutability + structural equality means records are *values* in the mathematical sense: two records with equal contents are indistinguishable, safe as dictionary keys, safe to share across threads. Copy-and-update gives you cheap "modified versions" without mutation, which is what makes pure Planner code tractable. Anonymous records are your DTO/projection layer — no named type needed for a shape that exists only at one pipeline seam.

---

## 11. Currying, partial application, pipelines, composition

**Coach's note.** Every F# function of "two arguments" is really a function returning a function. That makes *partial application* the default and the pipeline `|>` the natural way to read data flow left-to-right.

```fsharp
let add a b = a + b          // val add : int -> int -> int  (curried)
let inc = add 1              // partial application -> int -> int

// Pipeline: subject-first, reads like a sentence.
[1..10]
|> List.filter (fun x -> x % 2 = 0)
|> List.map    (fun x -> x * x)
|> List.sum
//  ^ 4 + 16 + 36 + 64 + 100 = 220

// Composition (>>) builds a new function without naming the argument:
let normalise = String.map System.Char.ToLower >> fun s -> s.Trim()
//  point-free; no `fun input -> ...` plumbing

// Backward pipe and composition exist too (<|, <<) for the rare case they read better.
```

**Heavy load.** Currying makes *configuration via partial application* idiomatic: `let logInfo = log Level.Info` specialises a general function once, cheaply. Pipelines turn nested calls (`sum(map(filter xs)))` ⚠️ read inside-out) into top-to-bottom dataflow that matches how an ETL stage actually thinks. This is the spine of your cursor-algebra-and-combinators style.

---

## 12. Phantom types & `Refined<'T,'P>` — values that carry proofs

**Coach's note.** A *phantom* type parameter appears in the type signature but not in the runtime data. You use it to tag a value with a *property it has been proven to satisfy* — "this string is a validated email," "this int is positive."

```fsharp
// Predicate as a type. The instance is never constructed; it's a compile-time tag.
type Positive = interface end
type NonEmpty = interface end

// Smart-constructor pattern: the only way in is through validation.
type Refined<'T, 'P> = private Refined of 'T
module Refined =
    let value (Refined v) = v

    let positive (n: int) : Result<Refined<int, Positive>, string> =
        if n > 0 then Ok (Refined n) else Error "must be > 0"

    let nonEmpty (s: string) : Result<Refined<string, NonEmpty>, string> =
        if s <> "" then Ok (Refined s) else Error "must be non-empty"

// Downstream code DEMANDS the proof in its signature:
let openConnection (host: Refined<string, NonEmpty>) (poolSize: Refined<int, Positive>) =
    // host & poolSize are guaranteed valid HERE — no re-checking, ever.
    Refined.value host, Refined.value poolSize
```

**Heavy load.** This is "parse don't validate" expressed as *types as proofs*. A `Refined<int, Positive>` is a value that **cannot exist** unless validation passed — the `private` constructor seals the only entrance. Functions downstream stop defensively re-checking; the proof travels in the type. This is precisely your Oracle→Elasticsearch boundary library: the constraint vacuum closes because every scalar crossing the seam is `Refined`, the predicate algebra composes (`Positive` ∧ `NonEmpty`), and applicative validation accumulates *all* errors instead of failing on the first. Stack it with §4 Units of Measure for a scalar that proves *both* its dimension and its range.

---

## 13. Option / Result / ValueOption — null is not in the vocabulary

**Coach's note.** F# has no `null` for its own types. "Maybe absent" is `Option`; "succeeded or failed with a reason" is `Result`. Both are just DUs you already know how to `match`.

```fsharp
// Railway-oriented programming: chain fallible steps, short-circuit on first Error.
let parsePositive (s: string) : Result<int, string> =
    match System.Int32.TryParse s with
    | true, n when n > 0 -> Ok n
    | true, _            -> Error "not positive"
    | false, _           -> Error "not a number"

let pipeline raw =
    raw
    |> parsePositive
    |> Result.map    (fun n -> n * 10)
    |> Result.bind   (fun n -> if n < 1000 then Ok n else Error "too large")
    |> Result.mapError (fun e -> $"validation failed: {e}")

// Option combinators avoid nested null checks entirely:
let lookup key map = Map.tryFind key map           // 'a option
lookup "x" (Map ["x", 1]) |> Option.defaultValue 0

// ValueOption (voption) — STRUCT version, no heap alloc on hot paths:
let firstEven xs : int voption =
    xs |> List.tryFind (fun x -> x % 2 = 0)
       |> function Some v -> ValueSome v | None -> ValueNone
```

**Heavy load.** `Result` *is* your error channel — exceptions are reserved for the genuinely exceptional (the Runner's outermost supervisor), never for control flow ⚠️. `Option.bind`/`Result.bind` are the same monadic plumbing as §5's CE, just spelled with combinators when a `{ }` block would be overkill. F# 10 leans further into the struct path: optional parameters can now be backed by struct `ValueOption`, cutting allocations on hot APIs without changing call-site syntax.

---

## 14. Sequences, laziness, and infinite data

**Coach's note.** `seq { }` is a lazy, pull-based stream (`IEnumerable`). It computes elements *on demand*, so you can describe infinite series and take only what you need.

```fsharp
// Infinite, lazy, total — nothing computes until you pull.
let naturals = Seq.initInfinite id
let primes =
    let rec sieve (s: int seq) = seq {
        let p = Seq.head s
        yield p
        yield! sieve (Seq.filter (fun n -> n % p <> 0) (Seq.tail s)) }
    sieve (Seq.initInfinite (fun i -> i + 2))

primes |> Seq.take 5 |> List.ofSeq      // [2; 3; 5; 7; 11]

// `yield!` flattens; `seq` composes with all the same combinators as List.
let pages = seq {
    for p in 0 .. 99 do
        yield! fetchPage p              // streamed, one page resident at a time
}

// Lazy<'T> for memoised single values (compute once, cache):
let expensive = lazy (printfn "computing"; 42)
expensive.Force()   // prints once
expensive.Force()   // cached, silent
```

**Heavy load.** Laziness is what lets a billion-row source stream through ~100M documents with bounded memory: a `seq` pipeline holds one window resident, not the whole set. This is the streaming counterpart to your cursor algebra — the cursor *describes position*, the `seq` *describes the lazy unfold* from that position. ⚠️ Watch for accidental re-enumeration: a `seq` re-runs its body each time it's iterated; pin to a `List`/array when you need the values more than once.

---

## 15. Recursion: tail calls, `[<TailCall>]`, and mutual recursion

**Coach's note.** Recursion is the default loop in F#. The compiler can turn *tail*-recursion into a jump (no stack growth), and F# 8+ lets you *assert* that with an attribute that errors if you got it wrong.

```fsharp
// [<TailCall>] makes "is this actually tail-recursive?" a compile-time guarantee.
[<TailCall>]
let rec sum acc xs =
    match xs with
    | []      -> acc
    | x :: tl -> sum (acc + x) tl        // tail position ✓  — compiles
// A non-tail call here (e.g. `x + sum 0 tl`) would now be a COMPILE WARNING/ERROR.

// Mutual recursion with `and`:
let rec isEven n = n = 0 || isOdd  (n - 1)
and     isOdd  n = n <> 0 && isEven (n - 1)

// CPS / accumulator style for tree folds that would otherwise blow the stack:
let rec sumTree cont = function
    | JNumber n -> cont n
    | JArray xs -> foldK xs 0.0 cont
    | _         -> cont 0.0
and foldK xs acc cont =
    match xs with
    | []      -> cont acc
    | h :: t  -> sumTree (fun v -> foldK t (acc + v) cont) h
```

**Heavy load.** `[<TailCall>]` (F# 8) closes the one historically fragile thing about FP-in-.NET: silent stack growth from a call you *thought* was tail-recursive. Now the compiler proves it. For deep recursion over data (JSON, supervisor trees, your cursor unfolds) this is the difference between "works in tests, dies in prod on a deep input" and "provably bounded." Mutual recursion with `and` models naturally co-recursive state machines without forward-declaration hacks ⚠️.

---

## 16. Type-safe formatting & the small ergonomics that compound

**Coach's note.** `printfn`'s format string is *type-checked*: `%d` demands an int, `%s` a string, at compile time. And a cluster of recent niceties cut noise.

```fsharp
printfn "%d rows -> %s" 1000 "done"      // %d/%s checked against the args
// printfn "%d" "oops"                    // ⚠️ COMPILE ERROR: expected int

// _.Member shorthand (F# 8) — kills trivial lambdas:
let names = [ arun ] |> List.map _.Name           // == (fun p -> p.Name)
let cities = [ arun ] |> List.map _.Address.City  // chains too

// String interpolation with format specifiers and alignment:
let pct = 0.8734
printfn $"progress: {pct:P1}"             // progress: 87.3%

// while! (F# 8) inside task/async CEs — loop on an async condition:
let drain (q: System.Collections.Generic.Queue<int>) = task {
    while! task { return q.Count > 0 } do
        printfn "%d" (q.Dequeue())
}
```

**Heavy load.** `%`-formatting being type-checked means logging and serialization format mismatches are build errors, not corrupt output discovered downstream. `_.Member`, nested copy-update (§10), and `while!` are individually minor but collectively remove the "noise tax" that used to push people toward C# for terseness — F# now matches it without surrendering totality.

---

## 17. What F# 10 (Nov 2025) actually changed

F# 10 is a deliberate **refinement release** — clarity, consistency, performance — not a feature splash. The pieces worth knowing:

- **Scoped warning suppression** — `#nowarn` now pairs with a new **`#warnon`** directive to silence (and re-enable) specific warnings over an *arbitrary code span*, not just file-wide. Note the breaking tightening: no multiline/empty warn directives, no whitespace between `#` and `nowarn`, no triple-quoted/interpolated/verbatim strings for warning numbers.
- **Per-accessor access modifiers** — a property's getter and setter can take *distinct* access levels inline, e.g. publicly readable / privately settable, without the old backing-field boilerplate.
- **Struct `ValueOption` for optional parameters** — optional params can be backed by struct `ValueOption`, reducing heap allocations on hot APIs (relevant for your streaming sinks).
- **Computation-expression binding consistency** — `let!`/`use!` edge cases smoothed for more predictable CE authoring.
- **Deprecation warning for omitted `seq`** — relying on an implicit sequence expression now warns; be explicit.
- **Parallel compilation** — graph-based type checking, parallel IL gen, and parallel optimization are unified under the `ParallelCompilation` MSBuild property (on by default under `LangVersion=Preview`, planned default-on in .NET 11), plus a type-subsumption cache for faster type checking and IntelliSense.

The throughline of the release matches the throughline of this whole document: *make the compiler do more, more legibly.*

---

## Coach's closing set — the F# mental model in one rep

1. **Model the domain as DUs + records** until illegal states can't be written (§1, §10).
2. **Parse at the boundary into `Refined`/`Result`**; never validate twice (§12, §13).
3. **Tag scalars with measures** so unit bugs can't compile (§4).
4. **Describe effects with computation expressions** (Writer for telemetry, Result for railways); keep the Planner pure (§5).
5. **Match exhaustively, extend matching with active patterns**; let the compiler hand you the refactor worklist (§2, §3).
6. **Reach for SRTP, quotations, type providers** only where the structural/compile-time power is the actual point (§6, §7, §8).
7. **Stream lazily, recurse with proven tail calls** for bounded memory at billion-row scale (§14, §15).

The whole language pulls in one direction: *runtime errors become compile errors*. Everything above is a different lever on the same machine.
