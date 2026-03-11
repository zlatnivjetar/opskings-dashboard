# Filter Logic Gap Analysis vs Original Interview README

## Scope checked
- `src/types/filters.ts`
- `src/components/filters/DateFilter.tsx`
- `src/components/filters/MultiSelectFilter.tsx`
- `src/components/filters/FilterBar.tsx`
- `src/lib/queries/filters.ts`
- `src/lib/queries/dashboard.ts`
- `src/lib/queries/response-time.ts`

## Findings

### 1) Multi-select operators are implemented in query logic and types, but not exposed in UI

**Requirement:** Team Member, Ticket Type, and Priority filters must support all operators:
- `is`
- `is not`
- `is any of`
- `is none of`

**Current implementation:**
- Filter types include all required operators.
- Query builders support all required operators.
- The current multi-select UI always writes `isAnyOf` when values are selected.

**Impact:** End users can only use one of the required operators from the filter bar, even though backend filtering supports all four.

---

### 2) Date operators are implemented in query logic and types, but not exposed in UI

**Requirement (by feature):** date filters require combinations of:
- `exact date`
- `date range`
- `date on or before`
- `date on or after`

**Current implementation:**
- Filter types include all required date operators.
- Query builders support all required date operators.
- The date filter UI is currently a fixed `From/To` range selector and always writes `operator: 'range'`.

**Impact:** Users cannot select `exact`, `onOrBefore`, or `onOrAfter` from the filter bar, despite backend support.

---

### 3) Per-widget allowed-filter scope appears aligned in data layer

The dashboard query layer narrows filters for charts that should only use subset filters (e.g., date + team member for distribution charts), which is aligned with original requirements.

---

## Conclusion

Your hypothesis is **partially true**:
- ✅ The missing multi-select operators (`is`, `is not`, `is any of`, `is none of`) are a real UI gap.
- ➕ There is also an additional UI gap for date operators (`exact`, `on or before`, `on or after`).

So the gap is not only the four multi-select operators; date operator selection is also missing from the current filter bar UI.

## Implementation plan

### Phase 1 — Data model + URL safety (small)
1. Add operator option constants in `src/types/filters.ts`:
   - `MULTI_FILTER_OPERATORS` with labels and values.
   - `DATE_FILTER_OPERATORS` with labels and values.
2. In `use-filter-state`, add normalization/guarding so invalid URL operator values gracefully fall back (e.g., `isAnyOf` for multi, `range` for date).

### Phase 2 — Multi-select operator UX
1. Update `MultiSelectFilter` API to include an operator selector:
   - Add `operator`, `onOperatorChange`, and `operatorOptions` props.
2. Add a compact operator dropdown at the start of each filter chip:
   - Example visual: `[is any of ▾] [Assignees (2) ▾] [x]`
3. Behavior rules:
   - Preserve selected values when operator changes.
   - If switching to `is` or `is not` with multiple selected values, keep the first selected value and show a small helper text in popover (`single-value operator`).

### Phase 3 — Date operator UX
1. Redesign `DateFilter` with operator-first layout:
   - `[date operator ▾]` followed by context-sensitive controls.
2. Control mapping:
   - `exact` → one date picker.
   - `onOrBefore` → one date picker.
   - `onOrAfter` → one date picker.
   - `range` → From/To date pickers (current behavior).
3. On operator change:
   - Migrate existing value(s) intelligently to avoid losing user input.

### Phase 4 — Filter bar styling alignment
1. Keep existing bar structure and token usage (`bg-card`, `border`, `rounded-lg`, `h-8`, etc.).
2. Style operator selectors with same visual language as existing filter triggers:
   - `h-8 px-2.5 bg-secondary/50 hover:bg-secondary border rounded-md text-sm`.
3. Keep responsive wrapping (`flex-wrap`) and add minimal gap tuning so operator + value controls read as one unit.
4. Preserve reset button placement (`ml-auto`) and divider behavior.

### Phase 5 — Validation + regression checks
1. Unit tests for operator serialization/parsing in `use-filter-state`.
2. Query-level tests for each operator path in `applyTicketFilters`.
3. E2E smoke:
   - Select each operator in filter bar.
   - Verify URL params update.
   - Verify tables/charts refresh and counts differ as expected.

## Suggested style details for the existing filter bar
- Operator dropdown width:
  - date: `w-[140px]`
  - multi-selects: `w-[120px]`
- Keep control height at `h-8` to match all existing pills.
- Keep labels hidden in dense mode and use placeholders/chip counts for clarity.
- Mobile behavior:
  - Wrap each filter group to next line;
  - Keep operator + value control adjacent via nested `inline-flex` container.
