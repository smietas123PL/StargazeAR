## Premium Pillars Status (2026-04-10)

- [x] Filar 1: Drag to Align (manualne strojenie hybrydowe)
- [x] Filar 2: Przewodnik na Dzis (Guided Tour)
  - [x] `useGuidedTour.ts` wybiera top 3 cele po sezonie, `altitude > 20` i widocznosci glownych gwiazd
  - [x] Dodany `GuidedTourPanel.tsx` jako wysuwana dolna karuzela rekomendacji
  - [x] Dodany `EdgePointer.tsx` wskazujacy cel poza ekranem
  - [x] Klikniecie w przewodniku wybiera cel po stronie AR i aktywuje prowadzenie do obiektu
- [x] Filar 3: Uklad Sloneczny (Ksiezyc i planety)
  - [x] Dodane lekkie efemerydy w `src/astronomy/ephemeris.ts` dla Ksiezyca, Wenus, Marsa, Jowisza i Saturna
  - [x] Dodany algorytm wieku i oswietlenia fazy Ksiezyca
  - [x] Obiekty Ukladu Slonecznego sa rzutowane do AR przez `computeProjectedSolarSystemObjects`
  - [x] Dodany dynamiczny `MoonSvg` renderowany w `StarOverlay.tsx`
- [x] Filar 4: Immersja sensoryczna (Sound & Scintillation)
  - [x] Scintillation gwiazd przy horyzoncie
  - [x] Dodane `expo-av` oraz `src/audio/AudioManager.ts` z preloadem chime
  - [x] Reticle uruchamia pitch-shiftowany chime przy wejsciu w gwiazdozbior
- [x] Filar 5: Niezawodnosc (Zero-Network & Silent Location Fallback)
  - [x] `useLocation.ts` ma `Promise.race` z timeoutem `5000ms`
  - [x] Ostatnia udana lokalizacja zapisuje sie do AsyncStorage przez `locationStorage.ts`
  - [x] Dodany klucz `StorageKeys.lastKnownLocation`
  - [x] Timeout bez cache pokazuje `LocationFallbackModal` z miastami offline: Krakow, Warszawa, Gdansk
  - [x] `useAppContentState` i `ControlsContainer` obsluguja zrodla lokalizacji: live, cache, manual fallback, Warsaw fallback

# Design System + Accessibility + Architecture + Interactions + UX Flows + Debt Audit Refactoring — Task List

## Phase 1: New Token Files
- [x] `src/constants/palette.ts` — raw color swatches (night + day)
- [x] `src/constants/spacing.ts` — named spacing scale
- [x] `src/constants/typography.ts` — named type scale
- [x] `src/context/ThemeContext.tsx` — AppTheme type + NIGHT/DAY themes + Provider + hooks

## Phase 2: Component Refactors (remove nightMode prop, use useTheme)
- [ ] `src/components/CalibrationScreen.tsx`
- [ ] `src/components/CameraBackground.tsx`
- [ ] `src/components/CompassHUD.tsx`
- [ ] `src/components/ConstellationInfo.tsx`
- [ ] `src/components/NightModeToggle.tsx`
- [ ] `src/components/OnboardingHint.tsx`
- [ ] `src/components/SensorStatus.tsx`
- [ ] `src/components/SkyOverlay.tsx`
- [ ] `src/components/StarOverlay.tsx`

## Phase 3: App.tsx
- [ ] Wrap root with `<ThemeProvider>`
- [ ] Remove `nightMode` useState + all nightMode props passed to children
- [ ] Replace inline hardcoded colors with StaticColors tokens

## Phase 4: Verify Design System
- [ ] TypeScript compiles clean (`npx tsc --noEmit`)
- [ ] Toggle night mode — all 9 components switch simultaneously
- [ ] Calibration save/cancel works correctly

## Phase 5: Accessibility (WCAG 2.2 / VoiceOver / TalkBack)

### 5.1 Replace invisible touch target hack
- [ ] `src/components/StarOverlay.tsx` — remove `<Text opacity:0 fontSize:1>` hack; add `accessibilityLabel` + `accessibilityRole="button"` directly on `TouchableOpacity`

### 5.2 Interactive elements — add accessibilityLabel + accessibilityRole + accessibilityHint
- [ ] `src/components/NightModeToggle.tsx` — role=`button`, label reflects current state ("Night mode on"/"off"), hint to toggle
- [ ] `src/components/CalibrationScreen.tsx` — Save, Cancel, Reset buttons; each StepButton ("Decrease azimuth offset", etc.); value display pill (role=`text`)
- [ ] `src/components/CameraBackground.tsx` — "Allow Camera" button; permission + loading states
- [ ] `src/components/ConstellationInfo.tsx` — close button (once added); scrollable panel role
- [ ] `App.tsx` — Calibration open button

### 5.3 Dynamic / live regions
- [ ] `src/components/SensorStatus.tsx` — add `accessibilityLiveRegion="polite"` to banner View so screen readers announce warning automatically
- [ ] `src/components/CameraBackground.tsx` — loading indicator: `accessibilityLiveRegion="polite"` + label "Checking camera permissions"
- [ ] `App.tsx` — GPS fallback banner: `accessibilityLiveRegion="assertive"` + descriptive label

### 5.4 Non-interactive decorative elements — mark as hidden
- [ ] `src/components/CenterReticle.tsx` — `importantForAccessibility="no"` / `accessibilityElementsHidden={true}`
- [ ] `src/components/SkyOverlay.tsx` — `importantForAccessibility="no"`
- [ ] `src/components/CompassHUD.tsx` — mark as `accessibilityRole="text"` summary; individual SVG elements hidden from tree
- [ ] `src/components/OnboardingHint.tsx` — `accessibilityLiveRegion="polite"` so screen reader reads the hint on appearance

### 5.5 Color-only signal fixes
- [ ] `src/components/CompassHUD.tsx` — calibration status: add text label to status dot (already has text in calibrationText; ensure role + label)
- [ ] `src/components/SensorStatus.tsx` — border color alone signals alert; already has text so confirm label chain

### 5.6 Touch target minimum size audit
- [ ] `src/components/StarOverlay.tsx` — `TouchableOpacity` label targets: verify `height` ≥ 44, `width` ≥ 44 (or add `hitSlop`)
- [ ] `src/components/CalibrationScreen.tsx` — StepButton is already 52×52dp ✓
- [ ] `src/components/NightModeToggle.tsx` — button `minWidth:132 paddingVertical:12` — verify total tap area ≥ 44dp ✓
- [ ] `App.tsx` — calibration button `minHeight:54, minWidth:128` ✓

### 5.7 ConstellationInfo close mechanism (required pre-accessibility)
- [ ] Add visible ✕ close button to `ConstellationInfo.tsx` (prerequisite for accessibility)
- [ ] Wire `onClose` prop that was previously voided (remove `void _onClose` at L123)

## Phase 6: AppContent God Component Decomposition

### 6.1 New custom hooks (extract from AppContent)
- [ ] `src/hooks/useCalibration.ts` — calibration state + AsyncStorage load/save + `handleSaveCalibration`
- [ ] `src/hooks/useHeadingDrift.ts` — drift accumulation logic (4 refs + 1 useEffect + `headingDriftRef`); returns corrected heading
- [ ] `src/hooks/useOnboarding.ts` — onboarding visibility + motion detection (5 refs + 3 useEffects + timer); returns `{ isVisible, messageVariant, hasMotion }`
- [ ] `src/hooks/useARSession.ts` — `cameraReady` state + `isArSessionActive` derived bool; wraps camera permission callbacks
- [ ] `src/hooks/useEffectiveData.ts` — mock-vs-real resolution for `orientation`, `location`, `calibration` (3 useMemos + mock timer); returns `{ effectiveOrientation, effectiveLocation, effectiveCalibration }`
- [ ] `src/hooks/useLayoutMetrics.ts` — `getLayoutMetrics` + all derived layout booleans/numbers (layout, isCompactFloatingUi, infoPanelMaxHeight, controlClusterBottom)

### 6.2 New container components (split render tree)
- [ ] `src/containers/AROverlayContainer.tsx` — renders `SkyOverlay + CenterReticle + StarOverlay` when `isArSessionActive`; receives `visibleConstellations`, `selectedConstellationId`, `onConstellationPress`
- [ ] `src/containers/HUDContainer.tsx` — renders `CompassHUD + SensorStatus + OnboardingHint`; receives all sensor + layout props from hooks
- [ ] `src/containers/ControlsContainer.tsx` — renders `NightModeToggle + CalibrationButton + GPS banner + Mock banner + DebugPanel`; owns `openCalibration` handler, receives layout metrics

### 6.3 Slim down App.tsx / AppContent
- [ ] AppContent becomes orchestrator: calls 6 hooks, renders `CameraBackground + AROverlayContainer + HUDContainer + ControlsContainer + ConstellationInfo + CalibrationScreen`
- [ ] Move `normalizeHeading`, `getHeadingDelta` and drift constants to `src/hooks/useHeadingDrift.ts` (remove from App.tsx module scope)
- [ ] Move calibration constants (`DEFAULT_CALIBRATION`) import to `useCalibration.ts`
- [ ] Remove `mockSecondsElapsed` state from AppContent — moves to `useEffectiveData.ts`
- [ ] Target AppContent line count: ~80 lines (down from 660)

## Phase 7: Interaction Quality Uplift

### 7.1 New dependency
- [ ] Install `expo-haptics` (`npx expo install expo-haptics`)
- [ ] Create `src/utils/haptics.ts` — thin wrapper that no-ops on platforms that don’t support it, preventing crashes

### 7.2 Haptic feedback (zero currently, only tab bar uses expo-haptics)
- [ ] `StarOverlay.tsx` — `impactAsync(Light)` on constellation `TouchableOpacity` press
- [ ] `NightModeToggle.tsx` — `impactAsync(Medium)` on toggle press (upgrade from scale-only)
- [ ] `CalibrationScreen.tsx` — `impactAsync(Light)` on each `StepButton` press (tactile tick per increment)
- [ ] `CalibrationScreen.tsx` — `notificationAsync(Success)` after "Zapisz" (calibration saved confirmation)
- [ ] `CalibrationScreen.tsx` — `notificationAsync(Warning)` on "Resetuj" press
- [ ] `CalibrationScreen.tsx` — `impactAsync(Light)` on "Anuluj" press
- [ ] `ConstellationInfo.tsx` — `impactAsync(Light)` on close button press (once added from Phase 5.7)

### 7.3 Button press animations (StepButton, footer Pressables)
- [ ] `CalibrationScreen.tsx` — `StepButton`: add `Animated.spring` scale-in (`0.92`) on `onPressIn`, spring back on `onPressOut` (matches NightModeToggle pattern already in codebase)
- [ ] `CalibrationScreen.tsx` — `StepButton`: add `onLongPress` with `setInterval`-based acceleration (step auto-increments at 150 ms, speeds up to 60 ms after 1 sec) — fixes high-friction large-offset calibration (P1 from audit)
- [ ] `CalibrationScreen.tsx` — footer Pressable buttons (Resetuj, Anuluj, Zapisz): scale-press animation (`0.96`) using `Animated.spring`
- [ ] `CameraBackground.tsx` — allow-camera button: scale-press animation
- [ ] `App.tsx` — calibration Pressable in control cluster: scale-press animation (`0.95`)

### 7.4 SensorStatus animation reset bug fix
- [ ] `SensorStatus.tsx` — guard `translateY.setValue(-80)` with current value check: only reset if banner is not already visible, preventing jarring restart on rapid `shouldShow` toggles

### 7.5 Calibration save success feedback
- [ ] `CalibrationScreen.tsx` — add transient success state (`isSaved: boolean`) that triggers a 600 ms "Zapisano ✓" label swap on the Save button before navigating away; avoids abrupt screenless confirmation

### 7.6 Camera loading skeleton
- [ ] `CameraBackground.tsx` — while `status === 'loading'` (before permission resolves): replace static black screen with a subtle pulsing `Animated.loop` opacity shimmer on a dark background, reducing perceived cold-start time

### 7.7 GPS acquiring pulse indicator
- [ ] `App.tsx` — when `isLoading === true` (from `useLocation`): render a 6 dp pulsing dot next to the GPS banner using `Animated.loop(Animated.sequence([timing opacity 0.3→1.0→0.3]))`, replacing the current static fallback-only banner

### 7.8 ConstellationInfo — inter-constellation transition
- [ ] `ConstellationInfo.tsx` — when `selectedConstellationId` changes while the panel is already open (user taps a second constellation), add a brief content cross-fade (`opacity 1→0→1`, 120 ms each side) to prevent abrupt label/stat swap

## Phase 8: UX Flow Improvements

### 8.1 Camera permission flow — platform dead-end fix
- [ ] `CameraBackground.tsx` — detect `!permission.canAskAgain` (OS-denied state) and render a second screen variant with "Otwórz ustawienia" (`Linking.openSettings()`) instead of "Zezwól na kamerę" — eliminates the current dead-end on permanent denial
- [ ] `CameraBackground.tsx` — while permission is loading: delay rendering of the spinner by 300 ms using a `shouldShowSpinner` timeout state to avoid flash for users who already granted permission

### 8.2 GPS permission and location flow
- [ ] `App.tsx` / `ControlsContainer` — consume `locationError` from `useLocation` (currently ignored in render): show a dismissible error toast when GPS permission is denied (separate from the fallback banner)
- [ ] `App.tsx` / `ControlsContainer` — rename fallback banner copy to be actionable: "Brak GPS — używam lokalizacji Warszawa" → "Brak GPS. Wyniki mogą być niedokładne. [Ustaw lokalizację ручно]" (link to future manual location feature placeholder)
- [ ] `useLocation.ts` — add `locationError` discriminated union type (`'permission_denied' | 'location_failed' | null`) for richer error handling at call site — clarifies error meaning vs generic string

### 8.3 Onboarding — quality and persistence
- [ ] `src/storage/onboardingStorage.ts` (new) — `markOnboardingSeen()` / `hasSeenOnboarding()` using AsyncStorage — prevents hint firing on every cold launch (currently `hasSeenOnboardingRef` is in-memory only, resets each session)
- [ ] `useOnboarding.ts` (from Phase 6) — check `hasSeenOnboarding()` on mount; skip timer setup if returns `true`
- [ ] `OnboardingHint.tsx` — fix Polish diacritics in `MESSAGES`: "Wyrownaj niebo" → "Wyrównaj niebo", "Obroc" → "Obróć", "lekko porusz nim w osemke" → "lekko porusz nim w ósemkę"
- [ ] `OnboardingHint.tsx` — `'calibration'` variant: add a tap-to-dismiss affordance (the hint currently cannot be dismissed by user interaction, only auto-dismisses)

### 8.4 Constellation panel — close mechanism
- [ ] `ConstellationInfo.tsx` — remove `void _onClose` at L123; restore `onClose` prop as a live callback
- [ ] `ConstellationInfo.tsx` — add a functional swipe-down-to-close by responding to `PanResponder` downward drag gesture ≥ 60 dp on the drag handle area (replaces the visual handle that currently does nothing)
- [ ] `App.tsx` / `ControlsContainer` — wire `onClose={() => setSelectedConstellationId(null)}` back to `ConstellationInfo`

### 8.5 Calibration flow — context and guidance
- [ ] `CalibrationScreen.tsx` — add a contextual sub-header below the screen title: `"Jeśli gwiazdy nie pasują do nieba, dostosuj azymut. Zmień FOV jeśli skala overlayu nie pasuje do rzeczywistości."` — removes blank-slate confusion
- [ ] `CalibrationScreen.tsx` — add live sensor values panel below the header: shows current raw heading + pitch from the session (passed as props from `AppContent` / `useHeadingDrift`); helps user understand what they're offsetting
- [ ] `CalibrationScreen.tsx` — rename "Resetuj" → "Przywróć domyślne" and add `accessibilityHint` clarifying it does NOT save (prevents confusion with "Zapisz")
- [ ] `CalibrationScreen.tsx` — "Anuluj" should explicitly say "Anuluj (bez zapisu)" in the `accessibilityHint` to clarify vs Reset scope
- [ ] `CalibrationScreen.tsx` — FOV row: add a contextual note: "Domyślnie 60°. Zależy od modelu telefonu."

### 8.6 Defaults improvement — reduce cold-start friction
- [ ] `src/constants/defaults.ts` — note in a JSDoc comment that `fovDegrees: 60` is a conservative default and document how to derive the correct value (tan(FOV/2) = sensor_width / focal_length)
- [ ] `App.tsx` / `CalibrationScreen.tsx` — if no saved calibration exists (first launch), show a one-time calibration prompt as part of onboarding: "Chcesz teraz skalibrować FOV? Zajmie to 30 sekund." — shifts calibration discovery from accidental to intentional

### 8.7 Error handling — surface hidden errors
- [ ] `App.tsx` — `locationError` is destructured from `useLocation` but never rendered: add a conditional error banner distinct from the fallback banner (e.g. "Nie można pobrać GPS. Sprawdź ustawienia systemu.")
- [ ] `CameraBackground.tsx` — if camera renders but stays black (sensor boot delay): add a 3 s timeout that surfaces "Inicjalizacja kamery trwa dłużej niż zwykle..." text below the shimmer
- [ ] `useHeading.ts` / `CompassHUD.tsx` — Already shows calibration level; ensure the HEADING_CALIBRATION_LABELS are user-comprehensible Polish strings (audit found `'Brak kalibracji'`, `'Słaba'`, etc.) — verify these are shown, not just used as internal keys

## Phase 9: UX Debt Remediation

### IMMEDIATE RISKS (breaks UX right now or on next OS update)

#### I-1: No ErrorBoundary around AR session
- [ ] Create `src/components/ErrorBoundary.tsx` wrapping `AppContent` in `App.tsx` — any uncaught throw from `computeVisibleConstellations` or SVG renderer currently produces a white crash screen

#### I-2: z-index ladder is implicit and unversioned
- [ ] Create `src/constants/zIndex.ts` with named z-index levels (`AR_OVERLAY=6`, `RETICLE=8`, `COMPASS=18`, `SENSOR_BANNER=20`, `CONSTELLATION_INFO=22`, `CONTROLS=24`, `CALIBRATION=40`) — currently spread across 11 different files with no common reference; conflict at `NightModeToggle(24)` == `App.tsx controlCluster(24)` confirmed

#### I-3: `IS_MOCK_ENABLED` is a source-code boolean, not an env flag
- [ ] Move `IS_MOCK_ENABLED` to read from `__DEV__ && process.env.EXPO_PUBLIC_MOCK === 'true'` — current pattern risks shipping with `true` accidentally since it requires a manual edit to `sensorMock.ts`

#### I-4: `MOCK_CALIBRATION.calibratedAt = 0` is epoch zero
- [ ] Change to `MOCK_CALIBRATION.calibratedAt = Date.now()` — currently causes calibration screen to display "Ostatnia zapisana: 1 Jan 1970" in mock mode, which is a confusing artifact visible to testers

#### I-5: `Pressable` vs `TouchableOpacity` split across components
- [ ] Standardize on `Pressable` across all components (CalibrationScreen, CameraBackground, StarOverlay) — `TouchableOpacity` is a legacy wrapper; mixing both means inconsistent ripple, active opacity, and upcoming React Native Paper/NativeWind compatibility will require double migration

#### I-6: AsyncStorage key uses `/` not `:` separator
- [ ] Rename `'@stargazear/calibration'` → `'@stargazear:calibration:v1'` and add a one-shot migration in `loadCalibration()` that reads the old key, writes to new, and deletes old — current key format diverges from the `@stargazear:onboarding_seen_v1` format being introduced in Phase 8; inconsistency guarantees future data loss during migration

### SCALING RISKS (degrade UX as the app grows)

#### S-1: z-index constants (see I-2) — new components have no guidance on where to insert
- [ ] (covered by I-2 fix)

#### S-2: `CONSTELLATIONS` full array is synchronously imported at startup
- [ ] Add a JSDoc note documenting the current 15-item catalog and the scale limit; above ~60 objects, `computeVisibleConstellations` running at render-rate will cause frame drops (O(n) per frame for projection + O(n²) for label collision) — no fix needed now but must be in architecture roadmap

#### S-3: Label collision detection is O(n²) in `StarOverlay`
- [ ] Add `// PERF: O(n^2) — re-evaluate if constellation count exceeds 40` comment at the collision loop in `StarOverlay.tsx` to prevent silent regression

#### S-4: `getLayoutMetrics` uses hardcoded pixel breakpoints (`840`, `800`)
- [ ] Replace raw numbers with named constants: `COMPACT_SCREEN_HEIGHT = 800`, `MEDIUM_SCREEN_HEIGHT = 840` in `layout.ts` — currently undocumented magic numbers that will break on unreleased device forms

#### S-5: `CalibrationData` has no schema version field
- [ ] Add optional `version?: number` field to the `CalibrationData` type and `loadCalibration()` migration handler — without versioning, any new field (e.g., `rollOffset`) will silently fail validation and reset to defaults for all existing users

#### S-6: `storage/` directory has no central key registry
- [ ] Create `src/storage/storageKeys.ts` exporting all `AsyncStorage` key constants — currently split between `calibrationStorage.ts` (key inline) and `onboardingStorage.ts` (key inline); will diverge further with each new feature

#### S-7: Animation vocabulary is inconsistent across components
- [ ] Document in `src/constants/animation.ts`: enter/exit timing constants (`FADE_IN_MS=240`, `FADE_OUT_MS=180`, `SPRING_DAMPING=18`, `SPRING_STIFFNESS=130`) — currently each component has independently chosen values with no shared vocabulary; future components will drift further

### LONG-TERM DEGRADATION RISKS (silent accuracy/reliability erosion)

#### L-1: J2000.0 epoch, no precession correction
- [ ] Add JSDoc to `constellations.ts`: `// Coordinates in J2000.0 epoch. No precession applied. Visible error ~0.014°/year, ~0.28° cumulative by 2040.` — currently invisible; becomes noticeable if a date-navigation feature is added

#### L-2: `DEFAULT_FOV_DEGREES = 60` is silently wrong for most devices
- [ ] Add JSDoc to `defaults.ts` documenting derivation formula and known device FOVs — iPhone 14 wide = ~75°, Pixel 7 = ~72°; 60° produces a systematically compressed overlay that users mistake for sensor errors and try to calibrate away

#### L-3: `WARSAW_FALLBACK_LOCATION` introduces systematic sky offset for non-Polish users
- [ ] Add `// WARNING: This fallback introduces ~1-15° azimuth error depending on user's actual location` JSDoc to `defaults.ts` — currently undocumented; international users will never understand why constellations are shifted

#### L-4: `saveCalibration` silently swallows write errors
- [ ] Add an `onError?: (err: unknown) => void` callback param to `saveCalibration()` so the caller can surface a "Zapis nie powiódł się" toast — currently calibration can fail to persist (full device storage, OS error) with zero user feedback; user re-calibrates next session

#### L-5: Mock timestamp `0` contaminates real calibration storage if mock mode was used during development
- [ ] Clear `@stargazear:calibration` in `sensorMock.ts` when `IS_MOCK_ENABLED` first loads — currently if a dev tests with mock mode, saves calibration via UI, then disables mock, the stored `calibratedAt: 0` persists and loads as a real calibration

#### L-6: `app/` Expo Router boilerplate is a live routing time bomb
- [ ] Delete `app/` directory entirely or add an explicit `EntryPoint` in `app.json` pointing to `App.tsx` — if `expo start` picks up the Router entry point (e.g., after an Expo SDK upgrade changes default entry resolution), the real app silently stops loading

## Phase 10: Final Verification
- [ ] TypeScript compiles clean after all phases
- [ ] Night mode toggle works across all components
- [ ] Calibration save/load/reset cycle works
- [ ] VoiceOver / TalkBack focus order test on critical flows
- [ ] No sensor subscription leaks (verify cleanup in all new hooks)
- [ ] Haptics fire correctly on iOS and Android (no-op on web)
- [ ] StepButton long-press acceleration tested end-to-end
- [ ] Onboarding does NOT re-fire after first launch (AsyncStorage persistence)
- [ ] Camera permission denied: correct screen variant shown per `canAskAgain` state
- [ ] ConstellationInfo panel: swipe-down closes, close button works
- [ ] `IS_MOCK_ENABLED=true` does NOT ship to App Store (CI/CD gate)
- [ ] No z-index collision between any two simultaneous overlays
