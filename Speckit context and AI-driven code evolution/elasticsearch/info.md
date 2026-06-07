{
  "query": {
    "bool": {
      "filter": [
        { "term":  { "carrier.keyword": "BlueDart" } },
        { "range": {
            "shipped_at": {
              "gte": "now-7d/d",
              "lte": "now/d",
              "format": "strict_date_optional_time||epoch_millis",
              "time_zone": "Asia/Kolkata"
            }
        }},
        { "exists": { "field": "destination_pincode" } },
        { "bool": {
            "must_not": [
              { "terms": { "status.keyword": ["Cancelled", "Returned"] } }
            ]
        }},
        { "nested": {
            "path": "packages",
            "score_mode": "none",
            "ignore_unmapped": true,
            "query": {
              "range": { "packages.weight_kg": { "gt": 5.0 } }
            }
        }}
      ],
      "should": [
        { "match_phrase": { "notes": { "query": "fragile handling", "slop": 0 } } }
      ],
      "minimum_should_match": 0
    }
  }
}

