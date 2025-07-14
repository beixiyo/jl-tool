# 🚀 ScrollTrigger & SmoothScroller

> A lightweight GSAP-like scroll animation engine implemented in **TypeScript**.
> Combine `ScrollTrigger` ⚡ with `SmoothScroller` 🏄 to build silky-smooth parallax effects, progress indicators, lazy reveal animations and more.

---

## ✨ Features

- 🎯 **Declarative API** – describe *when* an element enters the viewport and *what* should happen.
- 🏄 **Inertia scrolling** – drop‐in `SmoothScroller` replacement for native wheel events.
- 🧩 **Composable** – unlimited triggers, shared or independent scroll areas.
- 🏷️ Optional **markers** for debugging start / end positions.
- 📦 Tree-shakeable & ESM friendly.

---

## 📦 Installation

```bash
pnpm add jl-tool # or npm/yarn
```

Import only what you need:

```ts
import { ScrollTrigger } from '@/animation'
```

---

## 🚦 ScrollTrigger

### Quick Start

```ts
// Parallax header
new ScrollTrigger({
  trigger: '.hero', // element that controls the progress
  targets: '.hero__img', // element(s) you want to animate
  start: ['top', 'bottom'], // when .hero top meets viewport bottom
  end: ['bottom', 'top'], // when .hero bottom meets viewport top
  scrub: true, // bind progress directly to scroll
  props: [ // from -> to styles
    { scale: 1, opacity: 1 },
    { scale: 1.3, opacity: 0 }
  ],
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | auto | Unique id, can be retrieved via `ScrollTrigger.getById()` |
| `trigger` | `HTMLElement \| string` | `document.body` | Element whose position is used to calculate progress |
| `targets` | `HTMLElement \| NodeList \| string` | `null` | Element(s) to animate. If omitted you can drive your own tween in `animation` callback |
| `start` / `end` | `TriggerPosition` | `['top','bottom']` / `['bottom','top']` | Where the progress starts/ends. Equivalent to GSAP: `'top bottom'`, arrays or objects also accepted |
| `props` | `[{...from}, {...to}]` | `[]` | Shorthand style animation. Supports `x`, `y`, `scale`, `rotate`, `opacity`… |
| `ease` | `'linear' \| 'easeIn' \| ...` | `'linear'` | Apply easing when `scrub=false` |
| `scrub` | `boolean \| number` | `false` | `false`: play once per enter/leave; `true`: lock progress to scroll; `number`: **inertia** – seconds to catch up |
| `smoothScroll` | `boolean \| SmoothScrollerOptions` | `false` | Enable SmoothScroller for this container |
| `once` | `boolean` | `false` | Destroy trigger after it completes once |
| `immediateRender` | `boolean` | `true` | Call `update()` immediately after creation |
| `markers` | `boolean \| {startColor,endColor,...}` | `false` | Render coloured start / end lines for debugging |
| `onUpdate` | `(self)=>void` | `() => {}` | Called every time progress is applied |
| `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` | `(self)=>void` | `() => {}` | Lifecycle hooks |
| `onRefresh` | `(self)=>void` | `() => {}` | Fired when sizes change |
| `onDestroy` | `(self)=>void` | `() => {}` | Fired after `destroy()` |
| `duration` | `number` | `500` | When `scrub=false`, ms for the one-off animation |
| `priority` | `number` | `0` | Higher priority triggers refresh earlier |
| `disabled` | `boolean` | `false` | Initial disabled state |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Axis used for calculations |

### Instance Methods

```ts
trigger.update() // recalc progress based on current scroll
trigger.refresh() // recompute start/end offsets (e.g. on resize)
trigger.enable() // resume if disabled
trigger.disable()
trigger.destroy()
```

### Static Helpers

```ts
ScrollTrigger.refreshAll()
ScrollTrigger.getAll() // → ScrollTrigger[]
ScrollTrigger.destroyAll()
```

---

## 🏄‍♂️ SmoothScroller

`SmoothScroller` is an inertial wrapper for any scroll container (including `window`). It intercepts mouse-wheel events, applies linear interpolation (`lerp`) and feeds the *virtual* scroll position to registered `ScrollTrigger`s.

### Usage

```ts
const scroller = new SmoothScroller(window, { lerp: 0.08 })

// manual trigger
scroller.register(myTrigger)

// or let ScrollTrigger do it automatically:
new ScrollTrigger({
  scroller: window,
  smoothScroll: { lerp: 0.08 },
  ...otherOptions,
})
```

### SmoothScrollerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lerp` | `number` | `0.1` | Interpolation factor – closer to **0** = slower easing, **1** = no easing |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Axis |
| `wheelIdleTimeout` | `number` | `150` | ms after last wheel event to stop RAF loop |

### API

```ts
scroller.getCurrentScroll() // current eased scroll value
scroller.register(trigger) // attach ScrollTrigger
scroller.deregister(trigger)
scroller.destroy()
```

---

## 📝 Example: multi-section parallax

```ts
const height = window.innerHeight

document.querySelectorAll('section').forEach((sec, i) => {
  new ScrollTrigger({
    trigger: sec,
    targets: sec,
    smoothScroll: true, // enable inertia
    scrub: true, // direct binding
    start: ['top', 'bottom'],
    end: ['bottom', 'top'],
    props: [
      { backgroundPositionY: i === 0
        ? 0
        : `-${height / 2}px` },
      { backgroundPositionY: `${height / 2}px` },
    ],
  })
})
```

---

## ⚠️ Caveats & Tips

1. **One trigger ↔ one progress curve**.
   Need per-element progress? Instantiate multiple triggers.
2. Start / end are **relative**: `'top bottom'` means *element top* aligns *viewport bottom* **at progress 0**.
3. When `scrub=false` the trigger plays **once** on enter and reverse on leave (unless `once=true`).
4. Don’t forget to call `ScrollTrigger.refreshAll()` after content dynamically changes height.
5. For performance, avoid heavy DOM operations inside `onUpdate` – cache queries.

---

## 🔗 Related

- 📚 Inspired by [GSAP ScrollTrigger](https://greensock.com/scrolltrigger/).
- 🔧 Utility math & DOM helpers live in `@/math` and `@/tools` packages.

---

## © License

MIT
