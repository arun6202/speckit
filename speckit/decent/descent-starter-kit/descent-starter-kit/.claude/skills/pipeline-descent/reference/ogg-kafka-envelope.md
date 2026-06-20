# Reference — OGG/Kafka CDC envelope & arrival check

## Default JSON envelope fields (OGG for Big Data)
| Field | Meaning |
|---|---|
| `table` | CATALOG.SCHEMA.TABLE (fully qualified) |
| `op_type` | I / U / D / T (insert/update/delete/truncate) |
| `op_ts` | operation timestamp from the SOURCE trail — replay-stable |
| `current_ts` | time the formatter processed the record — NOT replay-stable |
| `pos` | trail seqno + RBA (20 chars) — traces back to the source trail |
| `primary_keys` | array of PK column names |
| `tokens` | trail token key/values |

- before/after images: Insert → after only; Update → before+after; Delete → before only; Truncate → both null.
  Update/Delete before-images may be partial without full supplemental logging.
- There is NO default `csn` field. Emit it with the metacolumn template `${csn}` (source commit sequence number).
- Key the topic by `${primaryKeys}` so a row's changes land on one partition in commit order.
- `op` mode = one message per operation (key = PK). `tx` mode = concatenated, NULL key (breaks per-key reads).

## ★ Bonus tip — prove arrival between Oracle, the Kafka message, and temp ES
Because the topic is keyed by the business key, read the ONE message deterministically and follow the
`op_ts`/`pos`/`csn` trail; the hop where it goes cold is the stage that dropped the change.

```bash
# 1. one message at the business key's partition+offset
kafka-console-consumer.sh --bootstrap-server $B --topic $T \
  --partition $P --offset $O --max-messages 1 \
  --property print.key=true --property print.timestamp=true

# 2. is the consumer keeping up? LAG ~0 if the merge is healthy
kafka-consumer-groups.sh --bootstrap-server $B --describe --group $G

# 3. did the same id reach temp ES? (op_ts should match the Kafka op_ts)
GET temp_idx/_doc/<esId>?_source=op_ts,csn,after
```

## Ordering defect (stale-looking but really a reorder)
Last-write-wins lets an out-of-order replay overwrite newer data. Fix: index with `version_type=external`
keyed on CSN/SCN so a lower version can never overwrite a higher one. In-cluster: `if_seq_no` + `if_primary_term`.

> Verify `${csn}` availability, `op` vs `tx` mode, and supplemental logging against YOUR OGG version.
