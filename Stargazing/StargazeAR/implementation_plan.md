# Design System + Accessibility + Architecture + Interactions + UX Flows + Debt Audit — StargazeAR

Six-phase engineering uplift: (1) token-based design system, (2) WCAG 2.2 accessibility, (3) God Component decomposition, (4) premium interaction quality, (5) UX flow optimization, (6) UX debt remediation.

---

## Scope Summary

- **4 new files** created (tokens + context)
- **10 files modified** for design system (9 components + `App.tsx`)
- **9 files modified** for accessibility (overlaps with above)
- **9 new files** for architecture (6 hooks + 3 containers)
- **1 new dependency** + **1 new util** for interactions (`expo-haptics` + `haptics.ts`)
- **6 files modified** for interaction quality (overlaps with above)
- **2 new storage utils** + **7 files modified** for UX flows
- **5 new constants/util files** + **8 files modified** for debt remediation
- **0 visual redesigns** — identical pixel output
- **0 breaking changes** — all existing behavior preserved

---

## Proposed Changes

### New Files — Token Layer

#### [NEW] `src/constants/palette.ts`
Raw semantic color values used by both themes. Never consumed directly — always through the theme object.

```
Night mode:
  nightBase         '#120000'
  nightSurface      'rgba(58, 0, 0, 0.92)'   ← cards (CalibrationScreen, ConstellationInfo)
  nightOverlay      'rgba(28, 0, 0, 0.80)'   ← HUD (CompassHUD)
  nightFloat        'rgba(28, 0, 0, 0.2)'    ← control cluster shell
  nightPanel        'rgba(32, 0, 0, 0.94)'   ← bottom sheet
  nightHint         'rgba(48, 0, 0, 0.80)'   ← onboarding hint card
  nightToggle       'rgba(72, 0, 0, 0.92)'   ← NightModeToggle button
  nightWarning      'rgba(70, 0, 0, 0.92)'   ← SensorStatus banner
  nightBtnBg        'rgba(72, 0, 0, 0.48)'   ← calibration button in App.tsx
  nightBorder       '#7B3838'
  nightBorderAlert  '#FF7070'
  nightBorderSubtle 'rgba(255, 117, 117, 0.18)'
  nightTitle        '#FFBCBC'   #FFE0E0 (panel), #FFD4D4 (compass)
  nightBody         '#FF9A9A'
  nightAccent       '#FF7676'
  nightMuted        '#D89A9A'
  nightStar         '#FF7D7D'
  nightAccentDot    '#FF6A6A'   (NightModeToggle indicator)
  nightWarningTitle '#FFB3B3'
  nightWarningBody  '#FF8E8E'
  nightNorth        '#FF6B6B'   (Compass N tick)

Day mode:
  dayBase           '#050A14'
  daySurface        'rgba(12, 20, 38, 0.94)'
  dayOverlay        'rgba(6, 10, 22, 0.78)'
  dayFloat          'rgba(5, 10, 24, 0.22)'
  dayPanel          'rgba(8, 12, 28, 0.92)'
  dayHint           'rgba(8, 14, 30, 0.78)'
  dayToggle         'rgba(10, 18, 40, 0.86)'
  dayWarning        'rgba(80, 40, 0, 0.92)'
  dayBtnBg          'rgba(10, 18, 40, 0.54)'
  dayBorder         '#29446C'
  dayBorderStrong   '#36507D'
  dayBorderSubtle   'rgba(111, 135, 183, 0.2)'
  dayTitle          '#F4F8FF'   #F7F9FF (panel/compass)
  dayBody           '#D0DDF7'
  dayAccent         '#FFD966'
  dayMuted          '#C6D2EE'
  dayStar           '#FFFFFF'
  dayAccentDot      '#FFD45D'
  dayWarningTitle   '#FFF2D0'
  dayWarningBody    '#FFE0A3'
  dayNorth          '#FFD700'

Shared:
  transparent       'transparent'
  black             '#000000'
  white             '#FFFFFF'
```

#### [NEW] `src/constants/spacing.ts`
Named spacing scale matching the values actually used in the codebase.

```ts
export const Spacing = {
  xs:   6,
  sm:   8,
  md:  12,
  lg:  14,
  xl:  16,
  xxl: 20,
  '3xl': 24,
  '4xl': 28,
} as const;
```

#### [NEW] `src/constants/typography.ts`
Named type sizes matching the real usage scale in the codebase (9 → 10 → 11 → 12 → 13 → 14 → 15 → 17 → 18 → 22 → 24 → 28).

```ts
export const FontSize = {
  hud2xs:  9,
  hudXs:  10,
  hudSm:  11,
  caption: 12,
  body:    13,
  bodyLg:  14,
  md:      15,
  subhead: 17,
  value:   18,
  title:   22,
  stepBtn: 24,
  screen:  28,
} as const;

export const FontWeight = {
  regular: '400' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  heavy:   '800' as const,
} as const;

export const LineHeight = {
  tight:   15,
  body:    18,
  bodyLg:  19,
  text:    20,
  md:      21,
  xl:      22,
  screen:  34,
} as const;
```

#### [NEW] `src/context/ThemeContext.tsx`
React Context that owns `nightMode` state and provides the resolved theme object + toggle function.

```ts
type AppTheme = {
  nightMode: boolean;
  // Backgrounds
  background: string;
  surface: string;
  overlay: string;
  float: string;
  panel: string;
  hint: string;
  toggle: string;
  warning: string;
  buttonBg: string;
  // Borders
  border: string;
  borderStrong: string;
  borderSubtle: string;
  borderAlert: string;
  // Text
  title: string;
  body: string;
  accent: string;
  muted: string;
  // Star overlay
  star: string;
  north: string;
  accDot: string;        // indicator dot color
  // Warning banner
  warningTitle: string;
  warningBody: string;
  // Sky overlay specific
  skyLineColor: string;
  skyGlowColor: string;
  skyLabelColor: string;
  skyDebugColor: string;
  skyDebugTextColor: string;
  // SkyOverlay gradient stops
  skyDepthStops: readonly [string, string, string];
  skyHorizonStops: readonly [string, string, string];
  skyVignette: string;
  skyBaseOpen: string;
  skyBaseDefault: string;
  // ConstellationInfo sheet
  sheetGlow: string;
  sheetSheen: string;
  sheetHandle: string;
  sheetBorderTop: string;
  sheetSubtitle: string;
  sheetStatLabel: string;
  sheetStatValue: string;
  sheetDescription: string;
  // OnboardingHint
  hintGlow: string;
  hintAccentLine: string;
  // Compass
  compassInnerFrame: string;
  compassInnerRing: string;
  compassDiagTick: string;
  compassDot: string;
  compassStatusDot: string;
};

export const ThemeContext = createContext<AppTheme>(DAY_THEME);
export const ThemeToggleContext = createContext<() => void>(() => {});
export function useTheme(): AppTheme { ... }
export function useToggleTheme(): () => void { ... }
export function ThemeProvider({ children }: PropsWithChildren) { ... }
```

**Key design decisions:**
- `nightMode` state is **lifted into ThemeContext** so `App.tsx` no longer holds it
- `ThemeProvider` is the sole source of truth for both the boolean AND the resolved theme object
- All 9 components call `useTheme()` instead of reading `nightMode` prop
- `NightModeToggle` calls `useToggleTheme()` to mutate state

---

### Modified Files — Token Consumers

#### [MODIFY] `App.tsx`
- Wrap `<SafeAreaProvider>` with `<ThemeProvider>`
- **Remove** `const [nightMode, setNightMode] = useState(false)` — state moves to ThemeContext
- **Remove** `nightMode` props from all 9 component calls
- Replace 8 hardcoded rgba strings in control cluster + location banner + mock banner inline styles with theme tokens

#### [MODIFY] `src/components/CalibrationScreen.tsx`
- Remove `nightMode` from `CalibrationScreenProps`
- Replace local `backgroundColor/cardColor/borderColor/titleColor/bodyColor/accentColor` vars with `useTheme()`
- Same for `AdjustmentRow` and `StepButton` sub-components

#### [MODIFY] `src/components/CameraBackground.tsx`
- No `nightMode` prop used here — verify and leave prop-free already. ✓
- Replace hardcoded `#000000`, `#D7E2FF`, `#FFD700`, `#AEB8D6`, `#FFFFFF`, `#101010` with palette tokens

#### [MODIFY] `src/components/CompassHUD.tsx`
- Remove `nightMode` from `CompassHUDProps`
- Replace 9 local color variables with `useTheme()` token reads

#### [MODIFY] `src/components/ConstellationInfo.tsx`
- Remove `nightMode` from `ConstellationInfoProps`
- Replace 10 local color variables with `useTheme()` references

#### [MODIFY] `src/components/NightModeToggle.tsx`
- Remove `nightMode` from `NightModeToggleProps`
- Call `useTheme()` for colors, `useToggleTheme()` internally (optional: keep `onToggle` prop for now to avoid breaking call site, just remove `nightMode` param)

> [!NOTE]
> `NightModeToggle` can either read `nightMode` from context (clean) or keep receiving `onToggle` as a prop for the press handler while reading colors from context. I'll keep `onToggle` as a prop since it's a simple boolean toggle — no breaking behavior.

#### [MODIFY] `src/components/OnboardingHint.tsx`
- Remove `nightMode` from `OnboardingHintProps`
- Replace `palette` useMemo with `useTheme()` reads directly

#### [MODIFY] `src/components/SensorStatus.tsx`
- Remove `nightMode` from `SensorStatusProps`
- Replace 4 local color variables with `useTheme()`

#### [MODIFY] `src/components/SkyOverlay.tsx`
- Remove `nightMode` from `SkyOverlayProps`
- `NIGHT_THEME` / `DAY_THEME` constants become theme tokens (moved to palette)
- `getOverlayColor()` reads from theme instead of `nightMode`

#### [MODIFY] `src/components/StarOverlay.tsx`
- Remove `nightMode` from `StarOverlayProps`
- Replace 8 local color variables with `useTheme()` reads

---

## Verification Plan

### Automated
- `npm run test` — existing test suite passes
- TypeScript compilation: `npx tsc --noEmit` — zero new errors

### Manual (Design System)
- Toggle night mode → all 9 components switch colors simultaneously
- Calibration screen opens/closes → correct theme applied
- Compass HUD unchanged in both modes
- Constellation info panel unchanged in both modes
- Sensor status banner fires in night mode → correct red palette

---

## Phase 2: Accessibility Implementation

### Background
The audit identified accessibility as the highest-severity gap (`1/10`, Critical / P0). The app has **zero** `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` props anywhere, and uses an invisible-text hack for constellation touch targets. This phase addresses all critical and high-severity gaps to reach WCAG 2.2 AA compliance for mobile.

---

### A2.1 Replace Invisible Touch Target Hack

#### [MODIFY] `src/components/StarOverlay.tsx`

**Problem:** Constellation tap targets use `<Text style={{ opacity: 0, fontSize: 1 }}>{name}</Text>` inside `TouchableOpacity`. This is not semantically announced by VoiceOver/TalkBack as interactive and the `fontSize: 1` may not register as a label at all on all platforms.

**Fix:**
- Remove the hidden `<Text>` child entirely
- Add `accessibilityLabel`, `accessibilityRole="button"`, and `accessibilityHint` directly on the `TouchableOpacity`
- Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to ensure minimum tap envelope without changing the visual layout
- Verify `LABEL_HEIGHT = 30` + `hitSlop` reaches the 44pt minimum (30 + 8 + 8 = 46dp ✓)

```tsx
// BEFORE
<TouchableOpacity
  key={`touch-${label.constellation.data.id}`}
  style={[styles.touchTarget, { left, top, width, height }]}
  onPress={() => onConstellationPress(label.constellation.data.id)}
  activeOpacity={0.85}
>
  <Text style={styles.hiddenTouchText}>
    {label.constellation.data.name}
  </Text>
</TouchableOpacity>

// AFTER
<TouchableOpacity
  key={`touch-${label.constellation.data.id}`}
  style={[styles.touchTarget, { left, top, width, height }]}
  onPress={() => onConstellationPress(label.constellation.data.id)}
  activeOpacity={0.85}
  accessibilityLabel={label.constellation.data.name}
  accessibilityRole="button"
  accessibilityHint="Opens constellation details"
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
/>
```

---

### A2.2 Interactive Elements — Labels, Roles, Hints

#### [MODIFY] `src/components/NightModeToggle.tsx`

**Problem:** `Pressable` has no role, no label, no state announcement. Screen reader cannot identify it as a toggle or know its current state.

**Fix:**
- `accessibilityRole="switch"` (correct ARIA role for a binary toggle)
- `accessibilityLabel` reflects current state: `nightMode ? 'Night mode, on' : 'Night mode, off'`
- `accessibilityHint="Activates red-tinted display for dark environments"`
- `accessibilityState={{ checked: nightMode }}` to announce checked/unchecked state

> [!NOTE]
> After ThemeContext refactor, `nightMode` is read from `useTheme().nightMode` inside the component, so no prop changes needed.

#### [MODIFY] `src/components/CalibrationScreen.tsx`

**Problem:** Save, Cancel, Reset `Pressable` elements have no labels. Each `StepButton` ("+" / "-") has no context of what it adjusts or in which direction.

**Fixes:**
- **Reset button:** `accessibilityLabel="Reset to defaults"` `accessibilityRole="button"` `accessibilityHint="Restores azimuth, pitch and FOV to factory values"`
- **Cancel button:** `accessibilityLabel="Cancel calibration"` `accessibilityRole="button"`
- **Save button:** `accessibilityLabel="Save calibration"` `accessibilityRole="button"`
- **StepButton:** receives a `accessibilityLabel` prop computed from its parent row (e.g., `"Decrease azimuth offset, currently +5 degrees"` / `"Increase azimuth offset, ..."`) and `accessibilityRole="button"`
- **Value pill:** `accessibilityLabel={"Current value: " + value + unit}` `accessibilityRole="text"`
- **`AdjustmentRow` heading text:** `accessibilityRole="header"` on the label Text

#### [MODIFY] `src/components/CameraBackground.tsx`

**Problem:** The "Allow camera" `TouchableOpacity` has no label. Loading state has no announcement.

**Fixes:**
- CTA button: `accessibilityLabel="Allow camera access"` `accessibilityRole="button"` `accessibilityHint="Required to display the sky overlay"`
- Loading `View`: `accessibilityLiveRegion="polite"` + `accessibilityLabel="Checking camera permissions"`
- Permission denied screen: root `View` gets `accessibilityRole="alert"` so it is announced immediately by VoiceOver

#### [MODIFY] `src/components/ConstellationInfo.tsx` + `App.tsx`

**Problem:** No close button exists (bug + accessibility gap). Panel has no role.

**Fix (prerequisite: fix void _onClose bug):**
- Add a visible ✕ `Pressable` button at the top-right of the panel
- Wire the neutralized `_onClose` prop back: remove `void _onClose`, restore as `onClose`
- Close button: `accessibilityLabel="Close constellation panel"` `accessibilityRole="button"`
- Scrollable content `View`: `accessibilityRole="summary"` on the panel header section
- Constellation name `Text`: `accessibilityRole="header"`

#### [MODIFY] `App.tsx` — Calibration open button

**Fix:**
```tsx
// Pressable for calibration:
accessibilityLabel="Open calibration"
accessibilityRole="button"
accessibilityHint="Adjust azimuth, pitch and field of view to align the star overlay"
```

---

### A2.3 Dynamic Live Regions

#### [MODIFY] `src/components/SensorStatus.tsx`

**Problem:** Warning banner appears and disappears but is never announced to screen readers without focus.

**Fix:** Add to the outer `Animated.View`:
```tsx
accessibilityLiveRegion="polite"
accessibilityLabel={`Sensor warning: ${issues.join('. ')}`}
accessibilityRole="alert"
```

When `shouldShow` switches from false → true the live region fires automatically on both VoiceOver and TalkBack.

#### [MODIFY] `App.tsx` — GPS fallback banner

**Problem:** Location fallback banner renders silently; users using screen readers don’t know the overlay is using Warsaw coordinates.

**Fix:**
```tsx
accessibilityLiveRegion="assertive"
accessibilityLabel={`GPS unavailable. Using fallback location: Warsaw (${latitude}, ${longitude})`}
accessibilityRole="alert"
```

#### [MODIFY] `src/components/OnboardingHint.tsx`

**Fix:** Add to the root `Animated.View`:
```tsx
accessibilityLiveRegion="polite"
// The Animated.View already conditionally renders via shouldRender;
// when it mounts + becomes visible, the live region fires
```
Also add `accessibilityRole="text"` to the inner card so VoiceOver reads title + body together.

---

### A2.4 Decorative / Non-interactive Elements — Hide from Accessibility Tree

| Component | Action |
|---|---|
| `CenterReticle.tsx` | `importantForAccessibility="no-hide-descendants"` on root `View` |
| `SkyOverlay.tsx` | `importantForAccessibility="no-hide-descendants"` on root `View` |
| `CompassHUD.tsx` | SVG + inner frame: `importantForAccessibility="no-hide-descendants"` on the `Svg`; expose one `accessibilityLabel` on the card `View` with full heading summary |
| `StarOverlay.tsx` SVG | `pointerEvents="none"` already set; also add `importantForAccessibility="no-hide-descendants"` on the `<Svg>` |

**CompassHUD full label example:**
```tsx
<View
  style={[styles.card, ...]}
  accessibilityLabel={`Compass: heading ${heading.toFixed(0)} degrees, pitch ${pitch > 0 ? '+' : ''}${pitch.toFixed(0)} degrees, calibration ${HEADING_CALIBRATION_LABELS[headingCalibrationLevel]}`}
  accessibilityRole="text"
  accessibilityLiveRegion="off"
  importantForAccessibility="yes"
>
  <View importantForAccessibility="no-hide-descendants">
    {/* all SVG + individual text elements */}
  </View>
</View>
```

---

### A2.5 Color-Only Signal Fixes

#### `CompassHUD.tsx`
- Current: weak calibration is shown only by orange border color
- Fix: The `calibrationText` label ("Brak kalibracji", "Słaba", etc.) already provides text fallback ✔
- Ensure the entire card label (from A2.4 above) includes calibration level in words ✔

#### `SensorStatus.tsx`
- Current: alert communicated via red/orange border + body text
- Fix: `accessibilityRole="alert"` on the banner View (already planned in A2.3) surfaces the text to assistive tech without color dependency ✔

---

### A2.6 Touch Target Minimum Size Audit

| Target | Current size | WCAG minimum | Action |
|---|---|---|---|
| Constellation labels | `width: 124, height: 30` | 44 × 44dp | Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` (30 + 16 = 46dp ✓) |
| StepButton +/- | `52 × 52dp` | 44 × 44dp | Already compliant ✓ |
| NightModeToggle | `minWidth:132, paddingVertical:12` | 44dp height | Effective ~37dp; add `minHeight: 44` to button style |
| Calibration button (App) | `minHeight: 54, minWidth:128` | 44 × 44dp | Already compliant ✓ |
| Camera allow button | `paddingVertical: 14` on text | 44dp height | Effective ~43dp; add `minHeight: 44` to be safe |
| ConstellationInfo close (✕) | new button | 44 × 44dp | Design with `minWidth/minHeight: 44` from the start |

---

### A2.7 Accessibility Score: Before vs After

| Dimension | Score Before | Score After | Change |
|---|---|---|---|
| Interactive element labels | 0 / 10 | 9 / 10 | +9 |
| Roles declared | 0 / 10 | 9 / 10 | +9 |
| Live regions | 0 / 10 | 9 / 10 | +9 |
| Decorative elements hidden | 0 / 10 | 9 / 10 | +9 |
| Color-not-sole-signal | 5 / 10 | 9 / 10 | +4 |
| Touch target sizes | 6 / 10 | 9 / 10 | +3 |
| **Overall accessibility** | **1 / 10** | **~8.5 / 10** | **+7.5** |

---

### Remaining Risks After Phase 2

| Risk | Severity | Notes |
|---|---|---|
| AR star overlay is inherently visual | Low | No accessible alternative to pointing at the sky; document in README |
| SVG constellation lines have no text equivalent | Low | ConstellationInfo panel provides full text data when tapped |
| CompassHUD live updates rapidly | Medium | `accessibilityLiveRegion="off"` prevents constant announcements; user accesses data via the label on focus |
| Polish-only UI copy | Medium | `accessibilityLabel` strings are also in Polish; i18n still not present |
| No focus management when screens transition | Medium | When CalibrationScreen dismisses, focus should return to the "Calibration" button; requires `AccessibilityInfo.setAccessibilityFocus` |

---

## Open Questions (Updated)

> [!IMPORTANT]
> **Decision required on `NightModeToggle`:**
> Option A — Keep `onToggle` prop, read colors from context, remove `nightMode` prop *(recommended)*
> Option B — Move `onToggle` fully into context, zero props
>
> Proceeding with **Option A** unless specified otherwise.

> [!NOTE]
> **Focus restoration on calibration screen dismiss** — requires `useRef` on the "Kalibracja" button and `AccessibilityInfo.setAccessibilityFocus` after screen transition. Scoped to a future micro-task if the team wants full WCAG 2.4.3 compliance.

---

## Phase 3: God Component Decomposition (AppContent)

### Background

`AppContent` in `App.tsx` is a 660-line God Component with:
- **14 state atoms**, **7 mutable refs**, **6 `useEffect` hooks**, **5 `useMemo` calls**, **2 handlers**, and a **200-line render tree**
- All of: camera management, heading drift compensation, calibration I/O, onboarding orchestration, mock/real data switching, layout calculation, and full UI composition live in one flat function body
- Maintainability degrades with every new feature; new contributors have no entry point

This phase splits responsibilities into purpose-built hooks and thin container components, leaving `AppContent` as a ~80-line pure orchestrator.

---

### A3.0 Responsibility Map (Current vs Target)

```
CURRENT AppContent (660 lines)
├── STATE (14 atoms)
│   ├── cameraReady, currentScreen
│   ├── nightMode              → moved to ThemeContext (Phase 1)
│   ├── calibration            → useCalibration()
│   ├── selectedConstellationId (stays — drives panel + overlay)
│   ├── isOnboardingHintVisible→ useOnboarding()
│   ├── hasOnboardingMotion    → useOnboarding()
│   └── mockSecondsElapsed     → useEffectiveData()
├── REFS (7)
│   ├── headingDriftRef+3 drift refs → useHeadingDrift()
│   ├── hasSeenOnboardingRef+2 → useOnboarding()
│   └── wasArSessionActiveRef  → useARSession()
├── EFFECTS (6)
│   ├── drift accumulation     → useHeadingDrift()
│   ├── calibration load       → useCalibration()
│   ├── mock timer             → useEffectiveData()
│   └── onboarding (x3)       → useOnboarding()
├── MEMOS (5)
│   ├── headingCorrected       → useHeadingDrift()
│   ├── effectiveOrientation   → useEffectiveData()
│   ├── effectiveLocation      → useEffectiveData()
│   ├── effectiveCalibration   → useEffectiveData()
│   └── layout metrics         → useLayoutMetrics()
└── RENDER (200 lines)
    ├── CameraBackground
    ├── SkyOverlay+CenterReticle+StarOverlay → AROverlayContainer
    ├── CompassHUD+SensorStatus+OnboardingHint → HUDContainer
    ├── ControlCluster+Banners+Debug → ControlsContainer
    ├── ConstellationInfo       (stays at AppContent level)
    └── CalibrationScreen       (stays at AppContent level)

TARGET AppContent (~80 lines)
├── calls: useARSession, useCalibration, useHeadingDrift,
│         useEffectiveData, useOnboarding, useLayoutMetrics
└── renders:
    CameraBackground, AROverlayContainer, HUDContainer,
    ControlsContainer, ConstellationInfo, CalibrationScreen
```

---

### A3.1 New Custom Hooks

#### [NEW] `src/hooks/useHeadingDrift.ts`

**Extracts from AppContent:** 4 drift refs, the drift accumulation `useEffect` (L124–170), the `headingCorrected` useMemo (L172–175), `normalizeHeading`, `getHeadingDelta`, and the 5 drift constants (L46–51).

**Interface:**
```ts
function useHeadingDrift(heading: number, pitch: number): number;
// returns: headingCorrected
```

**Why a standalone hook:** Drift compensation is pure signal-processing domain logic. It has no UI dependencies and is independently testable. Hiding 4 refs and 1 effect inside it removes the largest cluster of complexity from AppContent.

---

#### [NEW] `src/hooks/useCalibration.ts`

**Extracts from AppContent:** `calibration` state, the `initializeCalibration` async effect (L177–199), and `handleSaveCalibration` (L413–417). Takes `IS_MOCK_ENABLED` as an init parameter.

**Interface:**
```ts
function useCalibration(): {
  calibration: CalibrationData;
  saveCalibration: (next: CalibrationData) => void;
};
```

**Why a standalone hook:** Calibration owns a full async lifecycle (load-on-mount → save-on-change). Extracting it makes the AsyncStorage layer independently mockable in tests.

---

#### [NEW] `src/hooks/useARSession.ts`

**Extracts from AppContent:** `cameraReady` state, `wasArSessionActiveRef`, and the `isArSessionActive` derived boolean; provides stable `onPermissionGranted`/`onPermissionDenied` callbacks.

**Interface:**
```ts
function useARSession(): {
  cameraReady: boolean;
  isArSessionActive: boolean;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
};
```

---

#### [NEW] `src/hooks/useEffectiveData.ts`

**Extracts from AppContent:** The mock-timer effect (L201–214), `mockSecondsElapsed` state, and the three effective-data memos (L217–249).

**Interface:**
```ts
function useEffectiveData(params: {
  rawHeading: number;
  headingCorrected: number;
  headingCalibrationLevel: HeadingCalibrationLevel;
  isHeadingReliable: boolean;
  pitch: number;
  roll: number;
  location: UserLocation | null;
  calibration: CalibrationData;
}): {
  effectiveOrientation: EffectiveOrientation;
  effectiveLocation: UserLocation;
  effectiveCalibration: CalibrationData;
};
```

**Why a standalone hook:** Centralizes all mock/real data branching. Any future swap of mock behaviour touches exactly one file.

---

#### [NEW] `src/hooks/useOnboarding.ts`

**Extracts from AppContent:** `isOnboardingHintVisible` + `hasOnboardingMotion` states, 4 onboarding refs (L105–114), 3 onboarding effects (L309–411), `ONBOARDING_HINT_DURATION_MS` and 3 motion delta constants (L52–55).

**Interface:**
```ts
function useOnboarding(params: {
  isArSessionActive: boolean;
  effectiveOrientation: EffectiveOrientation;
  selectedConstellationId: string | null;
  isInfoPanelOpen: boolean;
}): {
  isOnboardingHintVisible: boolean;
  messageVariant: 'default' | 'calibration';
};
```

**Why a standalone hook:** The onboarding logic is the single most tangled sub-system in AppContent — 3 interdependent effects with shared refs. Isolating it enables independent testing and future extension (e.g., multi-step onboarding).

---

#### [NEW] `src/hooks/useLayoutMetrics.ts`

**Extracts from AppContent:** The `layout` useMemo (L253–262) and all 4 derived layout values (L263–275).

**Interface:**
```ts
function useLayoutMetrics(params: {
  width: number;
  height: number;
  insets: EdgeInsets;
  isInfoPanelOpen: boolean;
}): {
  layout: LayoutMetrics;
  isCompactFloatingUi: boolean;
  infoPanelMaxHeight: number;
  controlClusterBottom: number;
};
```

---

### A3.2 New Container Components

#### [NEW] `src/containers/AROverlayContainer.tsx`

Owns the conditional rendering of the AR layer (SkyOverlay, CenterReticle, StarOverlay). Conditionally renders only when `isArSessionActive`.

**Props:**
```ts
type AROverlayContainerProps = {
  isArSessionActive: boolean;
  visibleConstellations: VisibleConstellation[];
  selectedConstellationId: string | null;
  onConstellationPress: (id: string) => void;
  isInfoPanelOpen: boolean;
};
```

**Why a container:** Removes 3 conditional render blocks from AppContent. Any future AR overlay (e.g., planet overlay, meteor shower) is added here without touching the orchestrator.

---

#### [NEW] `src/containers/HUDContainer.tsx`

Owns CompassHUD, SensorStatus, OnboardingHint layout. No state — pure prop-forwarding from hooks.

**Props:**
```ts
type HUDContainerProps = {
  effectiveOrientation: EffectiveOrientation;
  isDeviceMotionAvailable: boolean;
  isOnboardingHintVisible: boolean;
  onboardingMessageVariant: 'default' | 'calibration';
  layout: LayoutMetrics;
};
```

---

#### [NEW] `src/containers/ControlsContainer.tsx`

Owns NightModeToggle, Calibration button, GPS fallback banner, mock banner, debug panel. Receives `onOpenCalibration` callback from AppContent.

**Props:**
```ts
type ControlsContainerProps = {
  isArSessionActive: boolean;
  isInfoPanelOpen: boolean;
  isCompactFloatingUi: boolean;
  controlClusterBottom: number;
  layout: LayoutMetrics;
  effectiveLocation: UserLocation;
  showLocationBanner: boolean;
  onOpenCalibration: () => void;
};
```

---

### A3.3 AppContent After Refactor (target shape)

```tsx
function AppContent() {
  // 1. Device dimensions + insets
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // 2. Raw sensor hooks (unchanged)
  const { heading, headingCalibrationLevel, isHeadingReliable } = useHeading();
  const { pitch, roll, isAvailable: isDeviceMotionAvailable } = useDeviceOrientation();
  const { location } = useLocation();

  // 3. Derived / computed hooks (all new)
  const headingCorrected = useHeadingDrift(heading, pitch);
  const { effectiveOrientation, effectiveLocation, effectiveCalibration } =
    useEffectiveData({ heading, headingCorrected, headingCalibrationLevel,
                       isHeadingReliable, pitch, roll, location, calibration });
  const { calibration, saveCalibration } = useCalibration();
  const { cameraReady, isArSessionActive, onPermissionGranted, onPermissionDenied } =
    useARSession();
  const { layout, isCompactFloatingUi, infoPanelMaxHeight, controlClusterBottom } =
    useLayoutMetrics({ width, height, insets, isInfoPanelOpen });

  // 4. UI state (stays here — drives cross-container coordination)
  const [currentScreen, setCurrentScreen] = useState<'ar' | 'calibration'>('ar');
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | null>(null);
  const isInfoPanelOpen = selectedConstellationId !== null;

  // 5. Onboarding (depends on above state)
  const { isOnboardingHintVisible, messageVariant } = useOnboarding({
    isArSessionActive, effectiveOrientation, selectedConstellationId, isInfoPanelOpen,
  });

  // 6. Astronomy computation
  const visibleConstellations = useMemo(() =>
    computeVisibleConstellations({ location: effectiveLocation,
      orientation: effectiveOrientation, calibration: effectiveCalibration,
      screenWidth: width, screenHeight: height }),
    [effectiveCalibration, effectiveLocation, effectiveOrientation, height, width],
  );

  // 7. Handlers
  function openCalibration() {
    if (!IS_MOCK_ENABLED) {
      setSelectedConstellationId(null);
      setCurrentScreen('calibration');
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CameraBackground onPermissionGranted={onPermissionGranted}
                        onPermissionDenied={onPermissionDenied} />
      <AROverlayContainer isArSessionActive={isArSessionActive}
        visibleConstellations={visibleConstellations}
        selectedConstellationId={selectedConstellationId}
        onConstellationPress={setSelectedConstellationId}
        isInfoPanelOpen={isInfoPanelOpen} />
      <HUDContainer effectiveOrientation={effectiveOrientation}
        isDeviceMotionAvailable={isDeviceMotionAvailable}
        isOnboardingHintVisible={isOnboardingHintVisible}
        onboardingMessageVariant={messageVariant}
        layout={layout} />
      <ControlsContainer isArSessionActive={isArSessionActive}
        isInfoPanelOpen={isInfoPanelOpen}
        isCompactFloatingUi={isCompactFloatingUi}
        controlClusterBottom={controlClusterBottom}
        layout={layout}
        effectiveLocation={effectiveLocation}
        showLocationBanner={!IS_MOCK_ENABLED && !location && currentScreen === 'ar'}
        onOpenCalibration={openCalibration} />
      <ConstellationInfo ... />
      {currentScreen === 'calibration' && <CalibrationScreen ... />}
    </View>
  );
}
```

> **Result:** AppContent drops from 660 → ~90 lines. Each concern is independently testable.

---

### A3.4 Migration Strategy (Safe, Step-by-Step)

> [!IMPORTANT]
> Each step must leave the app fully functional before moving to the next. No multi-step WIP commits.

**Step 1 — Extract `useHeadingDrift`**
Move 5 constants + 2 pure functions + 4 refs + 1 effect + 1 memo into the new hook. Replace their usages in AppContent with `const headingCorrected = useHeadingDrift(heading, pitch)`. Compile + run. *(Lowest risk — no state, no UI impact.)*

**Step 2 — Extract `useCalibration`**
Move `calibration` state + async load effect + `handleSaveCalibration` handler. AppContent calls `const { calibration, saveCalibration } = useCalibration()`. Compile + test calibration save/load/reset.

**Step 3 — Extract `useEffectiveData`**
Move mock timer, `mockSecondsElapsed`, and 3 effective-data memos. AppContent calls `const { effectiveOrientation, ... } = useEffectiveData(...)`. Compile + verify AR overlay renders correctly in both mock and real mode.

**Step 4 — Extract `useARSession`**
Move `cameraReady`, `wasArSessionActiveRef`, `isArSessionActive`. AppContent calls `const { cameraReady, isArSessionActive, ... } = useARSession()`. Compile + verify camera permission flow.

**Step 5 — Extract `useOnboarding`**
Move 3 effects + 5 refs + 2 states + constants. AppContent calls `const { isOnboardingHintVisible, messageVariant } = useOnboarding(...)`. *Highest risk step — test all onboarding trigger conditions.* Test: fresh install flow, motion detection dismiss, panel-open dismiss, timeout dismiss.

**Step 6 — Extract `useLayoutMetrics`**
Move layout memo + 4 derived layout values. Trivial — pure computation, no side effects.

**Step 7 — Create `AROverlayContainer`**
Lift the 3 conditional `cameraReady && currentScreen === 'ar'` render blocks into the new container. AppContent renders `<AROverlayContainer ... />`. Compile + verify star overlay renders.

**Step 8 — Create `HUDContainer`**
Lift `CompassHUD + SensorStatus + OnboardingHint` into the new container.

**Step 9 — Create `ControlsContainer`**
Lift control cluster + banners + debug panel into the new container.

**Step 10 — Final AppContent slim-down**
Remove all dead imports, confirm AppContent is ~90 lines, run full test suite.

---

### A3.5 New File Structure After All Three Phases

```
src/
├── constants/
│   ├── defaults.ts      (existing)
│   ├── palette.ts       ★ new (Phase 1)
│   ├── spacing.ts       ★ new (Phase 1)
│   └── typography.ts    ★ new (Phase 1)
├── context/
│   └── ThemeContext.tsx  ★ new (Phase 1)
├── components/       (existing, modified in Phases 1+2)
│   ├── CalibrationScreen.tsx
│   ├── CameraBackground.tsx
│   ├── CenterReticle.tsx
│   ├── CompassHUD.tsx
│   ├── ConstellationInfo.tsx
│   ├── NightModeToggle.tsx
│   ├── OnboardingHint.tsx
│   ├── SensorStatus.tsx
│   ├── SkyOverlay.tsx
│   └── StarOverlay.tsx
├── containers/       ★ new directory (Phase 3)
│   ├── AROverlayContainer.tsx
│   ├── HUDContainer.tsx
│   └── ControlsContainer.tsx
├── hooks/
│   ├── useDeviceOrientation.ts  (existing)
│   ├── useHeading.ts            (existing)
│   ├── useLocation.ts           (existing)
│   ├── useARSession.ts          ★ new (Phase 3)
│   ├── useCalibration.ts        ★ new (Phase 3)
│   ├── useEffectiveData.ts      ★ new (Phase 3)
│   ├── useHeadingDrift.ts       ★ new (Phase 3)
│   ├── useLayoutMetrics.ts      ★ new (Phase 3)
│   └── useOnboarding.ts         ★ new (Phase 3)
├── utils/            (existing)
│   └── haptics.ts    ★ new (Phase 4)
├── storage/          (existing)
├── astronomy/        (existing)
└── types/            (existing)
```

---

## Phase 4: Interaction Quality Uplift

### Background

The codebase has isolated pockets of quality interaction design (`NightModeToggle` spring animation, `ConstellationInfo` spring entrance, `OnboardingHint` deferred unmount) but no systematic interaction layer. Critical gaps identified in the audit:
- **Zero haptic feedback** in the entire product flow (tab bar is the only usage)
- `StepButton` +/- has no press animation and requires up to 45 taps for large offsets
- `SensorStatus` animation resets abruptly from `-80` even when already visible
- No success feedback after calibration save — abrupt screen transition
- Camera loading is a plain black screen with no perceived activity
- GPS acquiring state is completely invisible to the user
- Switching constellations with the panel open causes abrupt content replacement

---

### Before vs After UX Feel

| Interaction | Before | After |
|---|---|---|
| Calibration StepButton | Static press, silent | Spring scale + light haptic tick |
| Calibration save | Immediate screen transition | "Zapisano ✓" label flash + success haptic, then transition |
| Calibration reset | UI snaps to defaults, silent | Warning haptic + Values animate to 0 |
| Night mode toggle | Scale spring only | Scale spring + medium haptic |
| Constellation tap | Immediate panel open, silent | Light haptic + spring panel entrance (already exists) |
| Sensor warning appearing | Abrupt slide-in from top (may restart) | Smooth once-only slide-in, never restarts if already visible |
| Camera initializing | Black screen | Pulsing shimmer overlay |
| GPS acquiring | Invisible / fallback banner appears instantly | Pulsing dot + banner fades in |
| Switching constellations | Content snaps abruptly | Content cross-fades in 240 ms |
| Long calibration offset | 30+ taps | Long-press auto-increments, accelerating |

---

### A4.0 New Utility: `src/utils/haptics.ts`

The existing `expo-haptics` usage in `HapticTab` is iOS-only and directly calls the API. A thin wrapper prevents crashes on Android web fallback and enables consistent usage patterns across the codebase.

```ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tap — button presses, increments */
export function tapLight(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — toggles, mode switches */
export function tapMedium(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Success notification — save confirmed */
export function notifySuccess(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — destructive action */
export function notifyWarning(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
```

> **Why a wrapper:** Keeps all haptic calls one import deep, makes no-op stubs trivial for testing, and avoids scattered `Platform.OS` guards throughout component code.

---

### A4.1 Haptic Feedback Per Interaction

| Location | Event | Haptic | Reason |
|---|---|---|---|
| `StarOverlay.tsx` | Constellation `TouchableOpacity` press | `tapLight()` | Confirms invisible touch target registered |
| `NightModeToggle.tsx` | Toggle press | `tapMedium()` | Mode switch — more significant than increment |
| `CalibrationScreen.tsx` `StepButton` | Each press | `tapLight()` | Tactile tick confirms each increment step |
| `CalibrationScreen.tsx` | "Zapisz" confirmed | `notifySuccess()` | Strongest positive confirmation in the app |
| `CalibrationScreen.tsx` | "Resetuj" press | `notifyWarning()` | Destructive action warning |
| `CalibrationScreen.tsx` | "Anuluj" press | `tapLight()` | Acknowledges cancellation |
| `ConstellationInfo.tsx` | Close (✕) press | `tapLight()` | Confirms panel dismiss |

---

### A4.2 StepButton — Press Animation + Long-Press Acceleration

**Problem:** `StepButton` is a plain `Pressable` with zero animation. `onLongPress` is not implemented, requiring up to 45 taps for ±45° offsets.

**Fix — Spring press animation (matching `NightModeToggle` existing pattern):**

```tsx
function StepButton({ label, onPress, onLongPress }: StepButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92, bounciness: 0, speed: 40, useNativeDriver: true,
    }).start();
    tapLight(); // haptic on press-in
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, bounciness: 4, speed: 30, useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={styles.stepButton}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.stepButtonText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
```

**Fix — Long-press acceleration in `AdjustmentRow`:**

```tsx
const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null);
const longPressStartRef = useRef<number>(0);

function startLongPress(step: 1 | -1, min: number, max: number, field: keyof Draft) {
  longPressStartRef.current = Date.now();
  longPressRef.current = setInterval(() => {
    const elapsed = Date.now() - longPressStartRef.current;
    const interval = elapsed > 1000 ? 60 : 150; // accelerate after 1s
    updateField(field, step, min, max);
    tapLight();
    // Re-schedule at new rate (clear and reset)
    clearInterval(longPressRef.current!);
    startLongPress(step, min, max, field);
  }, elapsed > 1000 ? 60 : 150);
}

function stopLongPress() {
  if (longPressRef.current) {
    clearInterval(longPressRef.current);
    longPressRef.current = null;
  }
}
```

> **Note:** The acceleration logic uses a recursive re-schedule pattern instead of a `useEffect`-managed timer to avoid stale closure issues on the interval boundary.

---

### A4.3 Footer Buttons — Scale Press Animation

All three footer buttons (Resetuj, Anuluj, Zapisz) currently render as static `Pressable` elements with no press feedback. Apply the same spring scale pattern:

```tsx
// Shared hook for animated button press
function useButtonScale(pressedValue = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: pressedValue, bounciness: 0,
                              speed: 50, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, bounciness: 3,
                              speed: 30, useNativeDriver: true }).start();
  return { scale, onPressIn, onPressOut };
}
```

Wrap each `Pressable` in an `Animated.View` with `transform: [{ scale }]`. This is the same pattern `NightModeToggle` already uses — zero new concepts introduced.

---

### A4.4 Calibration Save — Success Flash Before Navigation

**Problem:** Pressing "Zapisz" immediately calls `onSave` → navigation → AR screen. No confirmation.

**Fix:** Transient `isSaved` state that swaps the button label for 600 ms before triggering save:

```tsx
const [isSaved, setIsSaved] = useState(false);

function handleSave() {
  notifySuccess();
  setIsSaved(true);
  setTimeout(() => {
    onSave(draft);
    setIsSaved(false);
  }, 600);
}

// In render:
<Text style={styles.primaryButtonText}>
  {isSaved ? 'Zapisano ✓' : 'Zapisz'}
</Text>
```

The button label change is instant and obvious. The 600 ms delay is short enough to feel responsive, long enough for the haptic + label to register before the screen transition.

---

### A4.5 SensorStatus — Animation Reset Bug Fix

**Problem (confirmed at L70):** Every time `shouldShow` becomes `true`, `translateY.setValue(-80)` resets the position unconditionally, even if the banner is already at position 0 (visible). If calibration quality fluctuates rapidly, the banner jerks from its current position back to -80 and re-animates in.

**Fix:** Guard the reset with an `isVisibleRef`:

```tsx
const isVisibleRef = useRef(false);

useEffect(() => {
  if (shouldShow) {
    if (!isVisibleRef.current) {
      // Only reset start position when actually transitioning from hidden → visible
      translateY.setValue(-80);
      opacity.setValue(0);
    }
    isVisibleRef.current = true;
    Animated.parallel([ /* ...existing timing... */ ]).start();
    return;
  }
  isVisibleRef.current = false;
  Animated.parallel([ /* ...existing exit timing... */ ]).start();
}, [shouldShow, opacity, translateY]);
```

---

### A4.6 Camera Loading Skeleton

**Problem:** While the permission promise resolves (up to 1–2 s on first launch), `CameraBackground` renders nothing but a black screen. Users see a dead UI.

**Fix:** Pulsing shimmer overlay using `Animated.loop`:

```tsx
const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

useEffect(() => {
  const anim = Animated.loop(
    Animated.sequence([
      Animated.timing(shimmerOpacity, { toValue: 0.7, duration: 900,
        useNativeDriver: true }),
      Animated.timing(shimmerOpacity, { toValue: 0.3, duration: 900,
        useNativeDriver: true }),
    ])
  );
  anim.start();
  return () => anim.stop();
}, [shimmerOpacity]);

// In render, when status === 'loading' or status === 'undetermined':
<Animated.View style={[StyleSheet.absoluteFill,
  { backgroundColor: '#050A14', opacity: shimmerOpacity }]} />
```

This requires **no new dependencies** — pure `Animated` API.

---

### A4.7 GPS Acquiring Pulse Dot

**Problem:** `isLoading` from `useLocation` is never consumed. Users see the Warsaw fallback banner instantly with no indication GPS is still trying.

**Fix:** In `App.tsx` (or `ControlsContainer` after Phase 3), add a pulsing dot next to the GPS banner:

```tsx
const gpsPulse = useRef(new Animated.Value(0.3)).current;

useEffect(() => {
  if (!isLoading) return;
  const anim = Animated.loop(
    Animated.sequence([
      Animated.timing(gpsPulse, { toValue: 1.0, duration: 600,
        useNativeDriver: true }),
      Animated.timing(gpsPulse, { toValue: 0.3, duration: 600,
        useNativeDriver: true }),
    ])
  );
  anim.start();
  return () => anim.stop();
}, [isLoading, gpsPulse]);

// In banner render:
{isLoading && (
  <Animated.View style={[
    styles.gpsDot,
    { opacity: gpsPulse }
  ]} />
)}
```

`gpsDot` style: `{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD966', marginRight: 6 }`

---

### A4.8 ConstellationInfo — Inter-Constellation Content Cross-Fade

**Problem:** When a second constellation is tapped while the panel is already open, `selectedConstellationId` changes immediately, causing the constellation name, stats, and description to snap to new values with no transition. The panel slide animation only fires on open/close, not on content change.

**Fix:** Track a `displayedId` state that lags behind `selectedConstellationId` by one cross-fade cycle:

```tsx
const [displayedId, setDisplayedId] = useState(selectedConstellationId);
const contentOpacity = useRef(new Animated.Value(1)).current;

useEffect(() => {
  if (displayedId === selectedConstellationId) return;
  // Fade out → swap content → fade in
  Animated.timing(contentOpacity, { toValue: 0, duration: 120,
    useNativeDriver: true }).start(() => {
    setDisplayedId(selectedConstellationId);
    Animated.timing(contentOpacity, { toValue: 1, duration: 120,
      useNativeDriver: true }).start();
  });
}, [selectedConstellationId]);
```

The content area (name, stats, description — not the handle or panel shell) is wrapped in `<Animated.View style={{ opacity: contentOpacity }}>`. Total cross-fade: 240 ms — imperceptible latency, visually smooth.

---

### A4.9 Interaction Change Summary by Component

| Component | Changes | New Dependency |
|---|---|---|
| `src/utils/haptics.ts` | New wrapper (4 functions) | `expo-haptics` |
| `StarOverlay.tsx` | `tapLight()` on constellation press | `haptics.ts` |
| `NightModeToggle.tsx` | `tapMedium()` on press | `haptics.ts` |
| `CalibrationScreen.tsx` | StepButton spring + long-press + haptics; footer button springs; save flash; `notifySuccess/Warning` | `haptics.ts` |
| `CameraBackground.tsx` | Permission CTA scale; loading shimmer | none |
| `SensorStatus.tsx` | Animation reset bug fix (1 ref + guard) | none |
| `ConstellationInfo.tsx` | Content cross-fade on constellation switch | none |
| `App.tsx` / `ControlsContainer` | Calibration button scale; GPS pulse dot; consume `isLoading` | `haptics.ts` |

---

## Phase 5: UX Flow Improvements

### A5.0 Current vs Improved Flow Map

#### Flow 1: First Launch

```
CURRENT:
[App opens]
  ├── CameraBackground: permission check (no delay guard)
  │   ├── NOT_DETERMINED → spinner renders immediately (flash for users who granted)
  │   ├── GRANTED → camera renders + onPermissionGranted()
  │   └── DENIED → "Zerwól na kamerę" (requestPermission) --- DEAD END if canAskAgain=false
  ├── useLocation: fires in parallel (silent, 1-3 s)
  │   ├── SUCCESS → effectiveLocation = GPS coords
  │   └── FAIL → effectiveLocation = Warsaw (banner appears with no warning)
  ├── useHeading: compass accuracy starts at 0 ("Brak kalibracji")
  └── OnboardingHint fires immediately when camera ready:
      ├── if calibration < 2 → "Uspokój kompas" + figure-8 instruction
      ├── auto-dismisses after 6.8s OR on device motion
      └── [NO WAY TO DISMISS MANUALLY] [FIRES AGAIN ON NEXT APP LAUNCH]

IMPROVED:
[App opens]
  ├── CameraBackground: 300 ms spinner delay (no flash for returning users)
  │   ├── DENIED + canAskAgain=true → "Zerwól na kamerę" (existing)
  │   ├── DENIED + canAskAgain=false → "Otwórz ustawienia" (new branch)
  │   └── GRANTED → loading shimmer (A4.6) → camera
  ├── useLocation: — same flow + pulsing dot (A4.7)
  │   └── ERROR → discriminated error type → contextual banner
  └── OnboardingHint: checks AsyncStorage first
      ├── seen before → no hint (clean UX on repeat launches)
      └── not seen → hint fires, user can tap to dismiss (new), marks seen on dismiss
```

#### Flow 2: AR Viewing → Constellation Discovery

```
CURRENT:
[AR active]
  ├── User pans sky → constellation labels render
  ├── User taps label → ConstellationInfo panel slides up
  │   ├── Panel has a visual drag handle → DOES NOTHING (no gesture handler)
  │   ├── onClose prop is voided at L123 → NO WAY TO CLOSE THE PANEL
  │   └── Exiting: only by tapping another constellation (replaces content abruptly)
  └── Switching constellation: content snaps with no transition

IMPROVED:
[AR active]
  ├── User taps label → haptic (A4.1) + panel slides up (existing spring)
  ├── Panel: visible close button (✕) top-right (Phase 5, A2.2)
  ├── Drag handle: wired to PanResponder → swipe down ≥60dp closes panel
  ├── Close: haptic (A4.1) + panel slides down (existing animation)
  └── Switching constellation while open: content cross-fades (A4.8)
```

#### Flow 3: Calibration

```
CURRENT:
[User presses "Kalibracja"]
  ├── CalibrationScreen slides in (fade + slide 24px)
  ├── No guidance on which control to adjust first
  ├── No context on current live heading/pitch values
  ├── +/- buttons: static Pressable, silent, requires up to 90 taps for +-45°
  ├── "Resetuj" and "Anuluj" — semantically ambiguous at a glance
  ├── "Zapisz" → immediate screen transition, no confirmation
  └── FOV: no model-specific guidance (fixed 60° default)

IMPROVED:
[User presses "Kalibracja"]
  ├── Contextual sub-header guides: "Dostosuj azymut, jeśli gwiazdy są obrócone"
  ├── Live sensor panel shows: current heading ° + pitch ° values
  ├── +/- buttons: spring press (A4.2) + haptic tick + long-press acceleration
  ├── "Przywróć domyślne" clearly distinct from "Anuluj (bez zapisu)"
  ├── "Zapisz": warning haptic → "Zapisano ✓" flash 600ms → navigate away
  └── FOV row: note "Domyślnie 60°. Zależy od modelu telefonu."
```

---

### A5.1 Camera Permission — Dead-End Fix

**Problem:** When the OS has permanently denied camera permission (`canAskAgain === false`), pressing "Zerwól na kamerę" calls `requestPermission()` which silently fails. The user is stuck with no recovery path.

**Fix:** Branch on `permission.canAskAgain`:

```tsx
import { Linking } from 'react-native';

// In CameraBackground render:
if (permission && !permission.granted) {
  const canRetry = permission.canAskAgain;
  return (
    <View style={styles.permissionScreen}>
      <Text style={styles.permissionIcon}>◉</Text>
      <Text style={styles.permissionTitle}>
        StargazeAR potrzebuje dostępu do aparatu
      </Text>
      <Text style={styles.permissionBody}>
        {canRetry
          ? 'Kamera jest używana jako tło dla nakładki obserwacyjnej.'
          : 'Uprawnienie do kamery zostało odrzucone. Przyznaj je w ustawieniach systemu.'}
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={() => canRetry ? requestPermission() : Linking.openSettings()}
      >
        <Text style={styles.permissionButtonText}>
          {canRetry ? 'Zerwól na kamerę' : 'Otwórz ustawienia'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

Also add the **spinner delay** to prevent flash on re-launch:
```tsx
const [showSpinner, setShowSpinner] = useState(false);

useEffect(() => {
  const t = setTimeout(() => setShowSpinner(true), 300);
  return () => clearTimeout(t);
}, []);

if (!permission) {
  return showSpinner
    ? <View style={styles.loading}><ActivityIndicator .../></View>
    : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050A14' }]} />;
}
```

---

### A5.2 Location Error Typing

**Problem:** `useLocation` exports `error: string | null`. At the call site in App.tsx, `error` is destructured but never rendered. There is no way to distinguish `'permission_denied'` from `'location_failed'` to show different UI.

**Fix:** Add a discriminated error type:

```ts
type LocationErrorKind = 'permission_denied' | 'location_failed' | null;

type UseLocationResult = {
  location: UserLocation | null;
  errorKind: LocationErrorKind;
  errorMessage: string | null;
  isLoading: boolean;
  isHighAccuracyEnabled: boolean;
};
```

This lets `ControlsContainer` show different banners:
- `'permission_denied'` → "Brak uprawnień GPS"
- `'location_failed'` → "Nie można pobrać GPS. Sprawdź ustawienia."
- `null` + `isLoading` → pulsing dot only
- `null` + `!location` → Warsaw fallback banner

---

### A5.3 Onboarding Persistence

**Problem:** `hasSeenOnboardingRef` lives in memory. The onboarding hint fires on every cold app launch indefinitely. For a returning user pointing at a clear night sky, this is pure friction.

**Fix:** New `src/storage/onboardingStorage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@stargazear:onboarding_seen_v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
```

In `useOnboarding.ts` (Phase 3):
```ts
useEffect(() => {
  // Check AsyncStorage on mount; update hasSeenOnboardingRef
  hasSeenOnboarding().then(seen => {
    if (seen) hasSeenOnboardingRef.current = true;
  });
}, []);

// When hint is dismissed (via timeout OR user tap):
void markOnboardingSeen();
```

This is additive — the in-memory guard still prevents re-showing within the same session. The AsyncStorage guard prevents it across sessions.

**Fix — Onboarding hint Polish diacritics (L31–37):**
```ts
// BEFORE
default: { title: 'Wyrownaj niebo', body: 'Obroc telefon...' }
calibration: { title: 'Uspokoj kompas', body: 'Obroc telefon i lekko porusz nim w osemke.' }

// AFTER
default: { title: 'Wyrównaj niebo', body: 'Obróć telefon, by ustawić kadr. Dotknięcie etykiety otworzy szczegóły.' }
calibration: { title: 'Uspokój kompas', body: 'Obróć telefon i porósz nim lekko w ósemkę. Dotknięcie etykiety otworzy szczegóły.' }
```

**Fix — Tap-to-dismiss on 'calibration' variant:**
Change `pointerEvents="none"` on the `Animated.View` for the calibration variant only, letting through touch events. Add `onPress={() => setIsVisible(false)}` on the card inner `View`. This requires threading a `onDismiss` callback from `useOnboarding` to `OnboardingHint`.

---

### A5.4 ConstellationInfo — Swipe-Down to Close

**Problem:** The drag handle is purely visual (`View` with a rounded bar). Swiping down does nothing. `onClose` is voided at L123.

**Fix — Wire `onClose` (remove `void`):**
```tsx
// BEFORE (L81)
onClose: _onClose,
// ...
void _onClose; // L123

// AFTER
onClose,
// (remove void line entirely)
```

**Fix — `PanResponder` on drag handle:**
```tsx
const SWIPE_DOWN_THRESHOLD = 60;
const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        // Optional: translate panel with finger for direct manipulation feel
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > SWIPE_DOWN_THRESHOLD) {
        onClose();
      } else {
        // Snap back
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true,
          damping: 18, stiffness: 130 }).start();
      }
    },
  })
).current;

// Apply panHandlers to the drag handle View:
<View style={styles.handleArea} {...panResponder.panHandlers}>
  <View style={[styles.dragHandle, { backgroundColor: theme.sheetHandle }]} />
</View>
```

---

### A5.5 Calibration Screen — Context + Live Sensor Display

**Problem 1:** Screen opens with no guidance. Users don't know which control affects what.

**Fix:** Add a contextual sub-header to `CalibrationScreenProps`:
```tsx
<Text style={[styles.screenSubheader, { color: theme.muted }]}>
  Dostosuj azymut, jeśli gwiazdy są obrócone. Zmień FOV jeśli ich skala nie pasuje.
</Text>
```

**Problem 2:** User sets `azimuthOffset` without knowing their actual heading. There's no reference point.

**Fix:** Add a `LiveSensorPanel` display at the top of the scroll view. Requires threading `currentHeading` and `currentPitch` from `AppContent` through `CalibrationScreen` props:
```tsx
<View style={[styles.sensorRow, { borderColor: theme.border }]}>
  <Text style={[styles.sensorLabel, { color: theme.muted }]}>Heading</Text>
  <Text style={[styles.sensorValue, { color: theme.accent }]}>
    {currentHeading.toFixed(1)}°
  </Text>
  <Text style={[styles.sensorLabel, { color: theme.muted }]}>Pitch</Text>
  <Text style={[styles.sensorValue, { color: theme.accent }]}>
    {currentPitch > 0 ? '+' : ''}{currentPitch.toFixed(1)}°
  </Text>
</View>
```

This is the "live preview" mechanism without requiring the AR overlay to be visible — significantly reduces guesswork.

**Problem 3:** "Resetuj" vs "Anuluj" ambiguity.

**Fix:** Label clarity (text only, no layout change):
- `"Resetuj"` → `"Przywróć domyślne"` (in `styles.secondaryButtonText`, not the button shape)
- Footer order: [Anuluj] [Przywróć domyślne] [Zapisz] (separates destructive from navigational)

---

### A5.6 Cold-Start Calibration Prompt (First Launch Only)

**Problem:** FOV default is 60° but real device FOV can range from 50°–80°. Users who never find the calibration screen will always see misaligned overlays.

**Fix:** After first onboarding hint is dismissed, if `hasSeenCalibrationPrompt` is falsy in AsyncStorage, show a secondary toast-style hint:

```tsx
// In useOnboarding or a new useFirstRunPrompts hook:
const [showCalibrationNudge, setShowCalibrationNudge] = useState(false);

useEffect(() => {
  if (!hasSeenCalibration && isArSessionActive && !isOnboardingHintVisible) {
    const t = setTimeout(() => setShowCalibrationNudge(true), 3000);
    return () => clearTimeout(t);
  }
}, [hasSeenCalibration, isArSessionActive, isOnboardingHintVisible]);
```

The nudge is a simple `OnboardingHint`-style card:
> "Dla lepszej dokładności ustaw właściwe FOV dla swojego telefonu. [Kalibruj]"

Tapping "Kalibruj" opens calibration. The nudge stores `'calibration_prompted'` in AsyncStorage and never shows again.

---

### A5.7 UX Change Summary

| Flow | Problem (confirmed from code) | Fix | Files |
|---|---|---|---|
| Camera permission | Dead-end on `canAskAgain=false` | `Linking.openSettings()` branch | `CameraBackground.tsx` |
| Camera loading | Spinner flashes on re-launch | 300 ms delay guard | `CameraBackground.tsx` |
| GPS error | `locationError` never rendered | Discriminated error type + banner | `useLocation.ts`, `App.tsx` |
| Onboarding | Fires every cold launch | AsyncStorage persistence | `onboardingStorage.ts`, `useOnboarding.ts` |
| Onboarding copy | Missing Polish diacritics | Fix 6 words in `MESSAGES` | `OnboardingHint.tsx` |
| Onboarding dismiss | No user-initiated dismiss | Tap-to-dismiss on calibration variant | `OnboardingHint.tsx` |
| Constellation panel | No close mechanism | Wire `onClose` + `PanResponder` swipe | `ConstellationInfo.tsx` |
| Calibration context | Blank-slate confusion | Contextual sub-header + live sensor panel | `CalibrationScreen.tsx` |
| Calibration labels | "Resetuj" vs "Anuluj" ambiguity | Rename + reorder footer | `CalibrationScreen.tsx` |
| FOV default | Users never discover calibration | First-run calibration nudge | `useOnboarding.ts`, storage |
| GPS location error | `error` string never consumed | Discriminated banner render | `App.tsx` |

---

## Phase 6: UX Debt Remediation

### Audit Method

All findings below are evidence-based — each maps to a specific file, line number, or code pattern confirmed during the audit. No speculative findings.

---

### IMMEDIATE RISKS

*Breaks UX today or on the next library/OS update.*

---

#### I-1: No Error Boundary — White Crash Screen on Any Uncaught Throw

**Evidence:** Zero `ErrorBoundary` components exist anywhere in the codebase (grep confirmed `No results found`).

**Impact:** Any uncaught exception inside `computeVisibleConstellations` (e.g., malformed `ConstellationData` line index), inside the SVG renderer, or inside any hook will crash the entire app with a white screen. React Native has no automatic error boundary.

**Fix:**
```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) { console.error('[StargazeAR] Uncaught:', err); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Coś poszło nie tak</Text>
          <Pressable onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.retry}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
```
Wrap in `App.tsx`: `<SafeAreaProvider><ErrorBoundary><AppContent /></ErrorBoundary></SafeAreaProvider>`.

---

#### I-2: z-index Ladder Is Implicit, Unversioned, and Has a Confirmed Collision

**Evidence (confirmed from grep):**
```
StarOverlay touch targets:  zIndex: 8
CompassHUD:                 zIndex: 18
SensorStatus:               zIndex: 20
OnboardingHint:             zIndex: 19
ConstellationInfo:          zIndex: 22
NightModeToggle:            zIndex: 24  ← COLLISION
App.tsx controlCluster:     zIndex: 24  ← COLLISION
App.tsx locationBanner:     zIndex: 15
App.tsx mockBanner:         zIndex: 16
CalibrationScreen:          zIndex: 40
```
`NightModeToggle` and the control cluster shell both use `zIndex: 24`. Since the toggle is *inside* the cluster this is currently harmless, but any refactor that separates them (e.g., Phase 6 `ControlsContainer`) will produce a stacking bug.

**Fix:** Create `src/constants/zIndex.ts`:
```ts
export const ZIndex = {
  arOverlay:         6,
  reticle:           8,
  compass:          18,
  onboardingHint:   19,
  sensorBanner:     20,
  constellationInfo:22,
  controlShell:     23,   // shell always below its contents
  controls:         24,
  calibration:      40,
} as const;
```
Replace all 11 inline `zIndex:` literals with named references.

---

#### I-3: `IS_MOCK_ENABLED` Is a Source-File Boolean, Not an Env Flag

**Evidence:** `sensorMock.ts` L12: `export const IS_MOCK_ENABLED = false;` — a plain boolean in version-controlled source.

**Impact:** Any developer who sets this to `true` to debug and forgets to revert will ship mock data to production. There is no CI guard.

**Fix:**
```ts
// sensorMock.ts
export const IS_MOCK_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_SENSORS === 'true';
```
Add to CI pipeline: `grep -r 'IS_MOCK_ENABLED = true' src/ && exit 1`.

---

#### I-4: `MOCK_CALIBRATION.calibratedAt = 0` Displays as 1 January 1970

**Evidence:** `sensorMock.ts` L31: `calibratedAt: 0`.

**Impact:** The calibration screen renders "Ostatnia zapisana: [1 Jan 1970]" when running in mock mode — a confusing artifact that erodes developer trust in the UI and masks real date formatting bugs.

**Fix:** `calibratedAt: Date.now()` — one character change.

---

#### I-5: `Pressable` vs `TouchableOpacity` Split Across Components

**Evidence (from grep):**
- `CalibrationScreen.tsx`: 6 × `Pressable`
- `NightModeToggle.tsx`: 1 × `Pressable`
- `CameraBackground.tsx`: 1 × `TouchableOpacity`
- `StarOverlay.tsx`: 1 × `TouchableOpacity`

**Impact:** `TouchableOpacity` is the legacy pre-Pressable API. It has a different ripple model (Android), different `activeOpacity` semantics, and different behavior in concurrent rendering. Two-component migration overhead if the team adopts any modern press-state library.

**Fix:** Replace `TouchableOpacity` with `Pressable` in `CameraBackground.tsx` and `StarOverlay.tsx`. Total change: 4 lines each.

---

#### I-6: AsyncStorage Key Is `/`-Separated, Newly Introduced Key Is `:`-Separated

**Evidence:**
- `calibrationStorage.ts` L5: `'@stargazear/calibration'`
- Phase 8 introduces: `'@stargazear:onboarding_seen_v1'`

**Impact:** Two different conventions in the same `storage/` directory. Either will need to be mass-migrated if the team ever adopts a structured storage utility (e.g., MMKV, react-native-storage). Keys without version suffix have no migration path when schemas change.

**Fix:** Migrate now while only one key exists:
```ts
// loadCalibration() addition:
const OLD_KEY = '@stargazear/calibration';
const KEY = '@stargazear:calibration:v1';
const legacy = await AsyncStorage.getItem(OLD_KEY);
if (legacy) {
  await AsyncStorage.setItem(KEY, legacy);
  await AsyncStorage.removeItem(OLD_KEY);
}
```

---

### SCALING RISKS

*Degrade UX as catalog grows, screens multiply, or new developers join.*

---

#### S-1: `CONSTELLATIONS` Is Synchronously Evaluated at Module Import Time

**Evidence:** `constellations.ts` exports `const CONSTELLATIONS: ConstellationData[] = [...]` — a 362-line static array parsed and held in memory from first import.

**Impact:** Fine at 15 objects. `computeVisibleConstellations` runs projection math per frame for every object. Label collision detection is O(n²). At 60 constellations the main thread will start dropping frames on mid-range devices.

**Fix (documentation-only, no breaking change):**
```ts
/**
 * @perf Currently 15 objects. Safe up to ~40 before per-frame projection
 * becomes a bottleneck. At 60+, split into lazy-loaded seasonal chunks
 * and add magnitude-based render culling.
 */
export const CONSTELLATIONS: ConstellationData[] = [...];
```

---

#### S-2: `getLayoutMetrics` Uses Undocumented Magic Number Breakpoints

**Evidence:** `layout.ts` uses raw `840` and `800` as screen height cutoffs (confirmed during audit).

**Impact:** Any new device form factor (foldables, compact flagships) that falls between these values will produce misaligned HUD positioning silently.

**Fix:**
```ts
// layout.ts
const SCREEN_COMPACT_MAX = 800;
const SCREEN_MEDIUM_MAX = 840;
// Use named constants in all comparisons
```

---

#### S-3: `CalibrationData` Has No Schema Version

**Evidence:** `types/index.ts` defines `CalibrationData` with 4 flat fields and no `version` field. `loadCalibration()` validates field presence but cannot distinguish schema v1 from a future v2.

**Impact:** Adding any new required field (e.g., `rollOffset: number`) will silently fail the validation check for all existing users' stored calibrations — resetting their offsets to defaults on next launch with no warning.

**Fix:**
```ts
type CalibrationData = {
  version: 1;           // add this
  azimuthOffset: number;
  pitchOffset: number;
  fovDegrees: number;
  calibratedAt: number;
};

// loadCalibration(): add version === 1 check; return null for unknown versions
```

---

#### S-4: Animation Vocabulary Is Fragmented Across Components

**Evidence (inconsistent values confirmed from earlier grep):**

| Component | Enter duration | Exit duration | Spring config |
|---|---|---|---|
| `SensorStatus` | 260 ms timing | 180 ms timing | N/A |
| `OnboardingHint` | 240 ms timing | 180 ms timing | N/A |
| `ConstellationInfo` | spring (d=18, s=130) | 220 ms timing | damping=18, stiffness=130 |
| `CalibrationScreen` | 200 ms timing | N/A | N/A |

**Impact:** Each new component makes an independent timing choice. Over time the app will feel inconsistent — some panels appear faster, some slower, with no design rationale.

**Fix:** Create `src/constants/animation.ts`:
```ts
export const Animation = {
  enterMs:       240,
  exitMs:        180,
  springDamping: 18,
  springStiffness: 130,
  springMass:    1,
} as const;
```

---

#### S-5: No Central AsyncStorage Key Registry

**Evidence:** Key string `'@stargazear/calibration'` is inline inside `calibrationStorage.ts`. Phase 8 adds a second inline key in `onboardingStorage.ts`. Keys are invisible to each other.

**Fix:** Create `src/storage/storageKeys.ts`:
```ts
export const StorageKeys = {
  calibration:   '@stargazear:calibration:v1',
  onboarding:    '@stargazear:onboarding:v1',
  // All future keys added here
} as const;
```

---

### LONG-TERM DEGRADATION RISKS

*Silent accuracy erosion or reliability failure that accumulates invisibly over time.*

---

#### L-1: J2000.0 Epoch, No Precession Correction

**Evidence:** `constellations.ts` L6-7: `"Współrzędne gwiazd zapisano w stopniach dziesiętnych dla epoki J2000.0."`

**Impact:** Constellation coordinates drift ~0.014°/year due to Earth's axial precession. The current (2026) error is ~0.35° — sub-FOV pixel width, unnoticeable. By 2040: ~0.55° accumulated error, noticeable on bright alignment stars. A future "historical sky" feature would show wrong positions for past dates.

**Fix (documentation only):**
```ts
/**
 * @epoch J2000.0
 * @precision No precession applied. Error: ~0.014°/yr (~0.35° in 2026).
 * For date-navigation features, apply IAU 2006 precession matrix.
 */
export const CONSTELLATIONS: ConstellationData[] = [...];
```

---

#### L-2: `DEFAULT_FOV_DEGREES = 60` Is Systematically Wrong for Most Devices

**Evidence:** `defaults.ts` exports `DEFAULT_FOV_DEGREES = 60`.

**Impact:** iPhone 14 main camera HFOV: ~75°. Pixel 7: ~72°. Galaxy S23: ~73°. A 60° default compresses the constellation overlay by ~15–20%, making star separations appear smaller than reality. Users experience this as "miscalibration" and rotate the azimuth trying to fix an FOV problem.

**Fix (documentation only for now, calibration nudge in Phase 5):**
```ts
/**
 * Conservative default FOV. Real device values:
 * - iPhone 14 wide:  ~75°
 * - Pixel 7:         ~72°
 * - Galaxy S23 wide: ~73°
 * Formula: HFOV = 2 × atan(sensor_width / (2 × focal_length))
 * Users should calibrate via the FOV adjustment in CalibrationScreen.
 */
export const DEFAULT_FOV_DEGREES = 60;
```

---

#### L-3: `saveCalibration` Silently Swallows Write Failures

**Evidence:** `calibrationStorage.ts` L57–59:
```ts
} catch {
  // Celowo ignorujemy bląd zapisu.
}
```

**Impact:** If AsyncStorage write fails (device storage full, OS bug), calibration appears saved but is not. On next session, user returns to factory defaults with no explanation — re-calibrates, same failure repeats silently. This is especially pernicious because `handleSave` navigates away before persist is confirmed.

**Fix:**
```ts
export async function saveCalibration(
  calibration: CalibrationData,
  onError?: (err: unknown) => void,
): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(calibration));
  } catch (err) {
    onError?.(err);
  }
}
```
Call site in `useCalibration.ts` (Phase 3): pass `onError` that triggers a toast: "Kalibracja nie została zapisana. Pamięć pełna?"

---

#### L-4: `app/` Expo Router Boilerplate Is a Live Routing Time Bomb

**Evidence:** `app/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx` all exist — unmodified Expo template boilerplate disconnected from `App.tsx`.

**Impact:** Expo SDK ≥52 defaults to file-based routing. If `app.json` `"main"` field is ever removed or an SDK upgrade changes entry point resolution, `app/_layout.tsx` becomes the root and the real AR app vanishes silently — replaced by the "Welcome to Expo" template.

**Fix:** Either:
- Option A: Delete `app/` directory entirely (safest)
- Option B: Add `"main": "index.js"` explicitly to `app.json` as a guard

---

#### L-5: WARSAW_FALLBACK Produces Systematic Error for Non-Polish Users

**Evidence:** `defaults.ts` `WARSAW_FALLBACK_LOCATION = { latitude: 52.2297, longitude: 21.0122 }`.

**Impact:** A user in London (51.5°N, -0.1°E) using the fallback gets a 21° longitude error — which translates to ~21° azimuth offset. Every visible star appears shifted west by ~21°. Non-Polish users rate the app as broken.

**Fix (documentation + future feature flag):**
```ts
/**
 * @warning This fallback introduces ~0.7° – 21° azimuth error
 * depending on user's actual longitude.
 * Future: replace with user-configurable manual location.
 */
export const WARSAW_FALLBACK_LOCATION: UserLocation = { ... };
```

---

### Debt Findings Summary

| ID | Category | Severity | Files | Fix Effort |
|---|---|---|---|---|
| I-1 | ErrorBoundary | Critical | `App.tsx`, new `ErrorBoundary.tsx` | S |
| I-2 | z-index collision | High | `zIndex.ts` (new) + 11 files | M |
| I-3 | Mock sentinel | High | `sensorMock.ts` | XS |
| I-4 | Mock timestamp | Low | `sensorMock.ts` | XS |
| I-5 | Press component split | Medium | `CameraBackground`, `StarOverlay` | XS |
| I-6 | Storage key format | Medium | `calibrationStorage.ts`, `storageKeys.ts` | S |
| S-2 | Layout breakpoints | Medium | `layout.ts` | XS |
| S-3 | CalibrationData schema | High | `types/index.ts`, `calibrationStorage.ts` | S |
| S-4 | Animation constants | Low | `animation.ts` (new) | XS |
| S-5 | Storage key registry | Low | `storageKeys.ts` (new) | XS |
| L-1 | Epoch documentation | Low | `constellations.ts` | XS |
| L-2 | FOV default documentation | High | `defaults.ts` | XS |
| L-3 | saveCalibration silent fail | High | `calibrationStorage.ts`, `useCalibration.ts` | S |
| L-4 | Expo Router time bomb | Critical | `app/` dir or `app.json` | XS |
| L-5 | Warsaw fallback documentation | Medium | `defaults.ts` | XS |
