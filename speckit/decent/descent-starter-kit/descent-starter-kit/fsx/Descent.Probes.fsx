namespace Descent
#load "Descent.Domain.fsx"
// TODO: add your clients, e.g.
// #r "nuget: FSharp.Data"
// #r "nuget: Oracle.ManagedDataAccess.Core"   // ⚠️ C# client — wrap at this boundary only
open Descent.Domain

/// Read-only shell. The ONLY I/O. parse-don't-validate the connection so a write is unrepresentable.
module Probes =

    // A ReadOnly handle cannot express a write: there is simply no `execute`/`index` function on it.
    type private OracleRO = OracleRO of obj   // obj = your real connection; kept opaque
    type private EsRO     = EsRO of string    // base url
    type private KafkaRO  = KafkaRO of string // bootstrap

    // ----- connection (read-only by construction) -----
    let openOracleRO (connStr: string) : Result<OracleRO, ProbeError> =
        // TODO: open connection; run `SET TRANSACTION READ ONLY`. Return Error on failure (never throw).
        Ok (OracleRO (box connStr))

    let esRO (baseUrl: string) = EsRO baseUrl
    let kafkaRO (bootstrap: string) = KafkaRO bootstrap

    // ----- Oracle (ground truth) -----
    let oracleRead (_ro: OracleRO) (_sql: string) : Async<Result<Map<string,string> list, ProbeError>> =
        async { return Ok [] } // TODO: parameterised read-only query -> rows

    // ----- Elasticsearch (read-only GET/_search only) -----
    let esSearch (_ro: EsRO) (EsIndex idx) (_queryJson: string) : Async<Result<int * string list, ProbeError>> =
        async { return Ok (0, []) } // TODO: GET /idx/_search -> (hitCount, ids). hitCount=0 means empty.

    let esAnalyze (_ro: EsRO) (EsIndex idx) (field: string) (text: string)
        : Async<Result<string list, ProbeError>> =
        async { return Ok [] } // TODO: GET /idx/_analyze {field;text;explain:true} -> tokens

    let esValidate (_ro: EsRO) (EsIndex idx) (_queryJson: string) : Async<Result<string, ProbeError>> =
        async { return Ok "" } // TODO: GET /idx/_validate/query?rewrite=true -> rewritten lucene

    let esExplain (_ro: EsRO) (EsIndex idx) (EsId id) (_queryJson: string)
        : Async<Result<bool * string, ProbeError>> =
        async { return Ok (false, "") } // TODO: GET /idx/_explain/{id} -> (matched, detail)

    let esFieldCaps (_ro: EsRO) (EsIndex idx) (field: string)
        : Async<Result<{| Type: string; Searchable: bool |}, ProbeError>> =
        async { return Ok {| Type = "TODO"; Searchable = true |} } // GET /idx/_field_caps?fields=field

    let esGetDoc (_ro: EsRO) (EsIndex idx) (EsId id) (_sourceFields: string list)
        : Async<Result<Map<string,string> option, ProbeError>> =
        async { return Ok None } // TODO: GET /idx/_doc/{id}

    // ----- Kafka (read-only; never commit/reset) -----
    let kafkaReadOne (_ro: KafkaRO) (_topic: string) (_partition: int) (_offset: int64)
        : Async<Result<Map<string,string> option, ProbeError>> =
        async { return Ok None } // TODO: read one message (key/op_type/op_ts/pos/csn/after). NO commit.

    let kafkaGroupLag (_ro: KafkaRO) (_group: string)
        : Async<Result<(int * int64) list, ProbeError>> =       // (partition, lag)
        async { return Ok [] } // TODO: describe consumer group -> per-partition lag
