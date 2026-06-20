namespace Descent
#load "Descent.Domain.fsx"
open Descent.Domain

/// THE SHRINK — ddmin over predicates (= FsCheck shrinking the failing query) + classify.
module Shrink =

    /// Minimise the failing (empty) predicate set to a 1-minimal culprit set.
    /// `probe ps = NotFound` means "this subset STILL returns zero hits".
    let ddmin (probe: Predicate list -> Probe3) (failing: Predicate list) : Predicate list =
        let stillEmpty xs = (not (List.isEmpty xs)) && probe xs = NotFound
        let rec loop preds n =
            if List.length preds < 2 then preds
            else
                let size  = max 1 (List.length preds / n)
                let parts = preds |> List.chunkBySize size
                let reduced =
                    parts |> List.tryPick (fun part ->
                        let comp = preds |> List.filter (fun p -> not (List.contains p part))
                        if stillEmpty comp then Some comp else None)
                match reduced with
                | Some smaller                       -> loop smaller 2
                | None when n < List.length preds    -> loop preds (min (List.length preds) (n * 2))
                | None                               -> preds   // 1-minimal culprit set
        loop failing 2

    /// Classify WHY the culprit predicate empties the result. Pure decision over gathered evidence;
    /// the caller supplies field caps, index/query tokens, the stored value, and an _explain result.
    let classify
        (culprit: Predicate)
        (fieldType: string)
        (indexTokens: string list)
        (queryTokens: string list)
        (storedValue: string option)
        : RootCause =
        match culprit.Kind, fieldType with
        | Term, ("text" | "search_as_you_type") ->
            AnalyzerMismatch (culprit.Field, indexTokens, queryTokens)
        | Term, "keyword" ->
            match storedValue with
            | Some stored when stored <> culprit.Value
                              && System.String.Equals(stored, culprit.Value, System.StringComparison.OrdinalIgnoreCase)
                              -> CaseMismatch (culprit.Field, culprit.Value, stored)
            | _ -> MappingIssue (culprit.Field, "keyword present but value not found; check normalizer/exact value")
        | Nested path, _ -> NestedScope path
        | _ -> MappingIssue (culprit.Field, sprintf "review mapping/type=%s and _explain" fieldType)
