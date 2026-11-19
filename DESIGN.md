# DESIGN.md — Hızlı Rapor (Saha Periyodik Kontrol & Elektrik Muayene Uygulaması)

## 1. Visual Theme & Atmosphere
- **Mode:** Operate (Precision Field Utility — Mobile-First Android WebView & Web)
- **Aesthetic Direction:** Swiss Industrial Precision & Minimalism — designed for electrical engineers working on factory floors, dimly lit electrical panels, and bright outdoor sites.
- **Core Ethos:** Zero clutter, instant scanability, one-handed thumb operation, zero ambiguity between Pass (Green), Defect (Red), and N/A (Neutral). Every screen looks calm, crisp, and authoritative like an industrial calibration instrument (Fluke / Metrel meets Linear / Swiss grid).

## 2. Color Palette & Semantic Roles
- **Canvas Background:** `#F4F6F9` (Cool Industrial Slate Tint — reduces glare vs pure white, gives crisp separation for white surfaces)
- **Primary Surface (Cards & Sheets):** `#FFFFFF` with `1px solid #E2E8F0` hairline border
- **Elevated / Subtle Surface (Secondary rows, inputs):** `#F8FAFC`
- **Primary Ink (Headings & Measurements):** `#0F172A` (Slate 900 — ≥14:1 contrast)
- **Secondary Ink (Labels & Metadata):** `#475569` (Slate 600 — ≥7:1 contrast)
- **Muted Ink (Placeholders & Hints):** `#64748B` (Slate 500 — ≥4.6:1 contrast)
- **Brand Header / Primary Dark:** `#0F172A` (Deep Navy/Slate) with `#F59E0B` (Safety Amber) bolt accent
- **Primary Action / Focus Blue:** `#0284C7` (Sky 600 — clear action links & focus rings)
- **Pass / Selected / Active State (Green):** `#059669` (Emerald 600, `#FFFFFF` text) with `#ECFDF5` subtle row tint and `#A7F3D0` border
- **Defect / Missing / Critical State (Red):** `#DC2626` (Rose/Red 600, `#FFFFFF` text) with `#FEF2F2` subtle row tint and `#FECACA` border
- **Caution / Unseen / Warning State (Amber):** `#D97706` (Amber 600) with `#FFFBEB` tint

## 3. Typography & Hierarchy
- **Primary UI Font:** `Inter` / `Plus Jakarta Sans` / System Sans (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Technical / Measurement Font:** `JetBrains Mono` / `Fira Code` / Monospace with `font-variant-numeric: tabular-nums` for Report Nos, Serial Nos, Voltages (`230/400 V`), Impedance (`Zx Ω`), Current (`In A`), and RCD trip times (`mA / ms`).
- **Type Scale (Mobile 360px–430px):**
  - Page / Company Title: `16px` (`1.25rem`), Bold (`700`), tight tracking (`-0.02em`)
  - Section Header: `13px`, ExtraBold (`800`), uppercase subtle tracking (`0.03em`)
  - Field Label: `12px`, SemiBold (`600`), `#334155`
  - Input / Button Text: `13px`, Bold (`700`) — never smaller than `11px` for readable touch buttons
  - Compact Metadata / Badges: `11px`, SemiBold (`600`)

## 4. Layout, Spacing & Touch Ergonomics
- **Touch Target Floor:** All interactive buttons, segmented pills, and status toggles must be at least `40px–44px` tall (`min-h-[40px]` for primary actions, `36px–40px` for dense segmented rows) with minimum `6px–8px` gap between adjacent touch targets.
- **No Nested Cards:** Avoid boxes inside boxes inside boxes. Use clean full-width section headers, subtle dividers (`1px solid #F1F5F9`), and generous vertical rhythm (`12px–16px` between sections).
- **Sticky Top Context + Sticky Bottom Step Bar:**
  - Top bar keeps Equipment Name (`Ekipman Adı`) + Save/PDF actions instantly accessible.
  - 5-step horizontal progress tabs (`1. Genel`, `2. Gözle`, `3. Ölçüm`, `4. Foto`, `5. Sonuç`) stay clean on a single row with clear active state.
  - Sticky/clear bottom navigation (`← Önceki` / `Sonraki Adım →`) keeps thumb reach effortless.
- **No Raw Emojis as UI Icons:** Use crisp vector line icons (FontAwesome / Lucide SVG) with consistent stroke weight.

## 5. Component Patterns
- **Segmented Pill Selectors:** Replace native `<select>` dropdowns for ≤8 choices with 1-tap segmented buttons. Active choice turns solid Emerald Green (`#059669`), except defect/missing choices (`Yok` on Project/Diagram, `Uygunsuz`, `✕`) which turn solid Red (`#DC2626`).
- **2-Tier Priority Choice Rows:** For common vs rare options (e.g., `TT | TN-S` on Row 1, `TN | TN-CS | TN-C | IT` compact on Row 2; `Temel | Yüzeysel` on Row 1, `Ring | Derin | Belirlenemedi` on Row 2), prioritize the 2 most frequent field selections in large 50/50 split buttons.
- **Hybrid Preset + Custom Input:** For voltages, main breaker type/amps, and RCD settings, place quick-tap pill chips directly above a clean editable text input, with a subtle work-order memory badge (`İş Emri Hafızası`) on remembered RCD fields.
- **Visual Check Rows (Section 5):** Clean two-column row: criterion text on the left, compact 4-button tactile cluster `[✓] [✕] [N] [G]` on the right. Tapping `[✕]` highlights the row in soft red and opens the defect sentence picker immediately.
- **Draft List Cards (Folder View):** Clean card showing Panel Name, Template Category, Live Status Pill (`✓ UYGUN` / `✕ UYGUN DEĞİL (1)`), and 3 clear primary actions (`Doldur`, `PDF`, `Yükle`) + secondary quick tools (`Çoğalt`, `Ad Değiştir`, `Sil`).

## 6. Accessibility & Field Resilience
- High daylight contrast (≥4.5:1 on all body and button text).
- Clear focus ring (`0 0 0 3px rgba(2, 132, 199, 0.22)`) on inputs.
- Offline-first indicator and subtle autosave status badge (`Kaydedildi`) without jarring layout shifts.
