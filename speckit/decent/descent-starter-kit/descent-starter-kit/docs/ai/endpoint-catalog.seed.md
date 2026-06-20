# Endpoint catalog (SEED — fill from your sample request list)

The map from endpoint -> module -> ES index. Claude reads this in rung 1 to prune scope.
You said you have a sample endpoint list + sample requests — paste them here, one row per operation.

| operationId / path | Module | Method | ES index/alias | Key field(s) | Sample request file | Notes |
|---|---|---|---|---|---|---|
| GET /customers/search | Customers | GET | cust_target | customerId | samples/customers-search.json | TODO |
| GET /accounts/{id}/balance | Accounts | GET | acct_target | accountId | samples/account-balance.json | realtime (acct.cdc) |
| ... | ... | ... | ... | ... | ... | ... |

TODO: drop your real sample requests under `docs/ai/samples/` and reference them above.
