# Online Fate reward canonical — 2026-09-17

The periodic online Fate reward is a reward source, not an exceptional direct mutation.
When the expansion runtime is available, `processOnlineFateReward` routes the Fate through
`grantCanonicalReward` using the deterministic key `online_fate:<absoluteDay>`. The receipt
records the Fate result, including a pending vault state when the active Fate slots are full.

The next reward day is advanced before resolution, and replaying the same day returns the
existing receipt without adding a second Fate or reward summary. The legacy direct path
remains only as a compatibility fallback when expansion has not been loaded.

**Note chưa hoàn thiện:** faction-specific legacy currencies still use their own namespace;
they are not interchangeable with Fate/quest reward receipts.
