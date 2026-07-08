# Analytics Engine Design

This document details the aggregation math and pipeline logic implemented inside `@meter/analytics`.

---

## 1. Aggregation Lifecycle

1. **Ingestion Query**: Query raw events from the `@meter/storage` IndexedDB layer within a target time window.
2. **Batch In-Memory Scan**: Map and group the retrieved event array. We use highly optimized, single-threaded loops to prevent memory locks.
3. **Snapshot Generation**: Create `DailySnapshot`, `WeeklySnapshot`, or `MonthlySnapshot` rollups containing calculated sums.
4. **Cache Persistence**: Save the new snapshots to the database to ensure subsequent loads execute instantly.
5. **Dynamic Cache Invalidation**: When new events are inserted by a parser, METER invalidates all cached snapshots covering the dates of the updated ranges.

---

## 2. Key Analytics Heuristics

### 1. Focus & Productivity Score
A synthetic metric representing user coding momentum (0 to 100):

$$\text{Productivity Score} = (w_1 \times \text{AcceptRate}) + (w_2 \times \text{LinesChangedPerPrompt}) + (w_3 \times \text{FocusDensity})$$

- **AcceptRate**: Percentage of accepted completions.
- **LinesChangedPerPrompt**: Code modifications made per prompt.
- **FocusDensity**: Active coding blocks divided by elapsed session minutes.

---

### 2. Time Saved
An estimation of time saved using autocomplete and chat generators:

$$\text{Time Saved} = (N_{\text{autocomplete\_accept}} \times 15\text{s}) + (N_{\text{chat\_accept}} \times 180\text{s}) + (N_{\text{refactor\_accept}} \times 300\text{s})$$

- Autocomplete saves typing time (default: 15s).
- Chat completions save architecture design time (default: 3m).
- Complex refactoring updates save debugging time (default: 5m).

---

### 3. Estimated Cost
Tracks cost according to model inputs:

$$\text{Cost} = (\text{TokensIn} \times \text{InputPricePerToken}) + (\text{TokensOut} \times \text{OutputPricePerToken}) - (\text{CacheReadTokens} \times \text{CacheSavingsPerToken})$$

---

### 4. Interactive Timeline Output
Creates standard chronological node formats to feed timeline renderers:
- Session events are grouped and sorted by descending timestamps.
- Raw content text is excluded in the ingestion filter to protect security compliance.
