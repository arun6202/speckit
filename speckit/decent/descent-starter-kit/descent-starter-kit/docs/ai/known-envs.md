# Known environments (STUB — fill in)

| Env | ES host/alias | Oracle (read-only) | Kafka brokers | Notes |
|---|---|---|---|---|
| prod | TODO | TODO | TODO | read-only probes only |
| uat  | TODO | TODO | TODO | reproduction env; masked prod-like data? |
| sit  | TODO | TODO | TODO | |

Config drift to watch: alias -> write-index, index version, analyzer/normalizer changes, feature flags,
tenant/security filters. Record any per-env differences that have bitten you.
