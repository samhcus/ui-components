"use client";

import { useEffect } from "react";
import { getSoundSequence, playSound, unlockAudio } from "@/lib/ui-sound";

const CONTROLS = 'button, a[href], [role="button"], [role="tab"], [role="switch"], input[type="checkbox"], input[type="radio"]';

/** Delegate so controls in post overlays and dialogs get the same tactile pack. */
export function useSiteSounds() {
  useEffect(() => {
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const values = new WeakMap<HTMLInputElement, number>();
    const control = (target: EventTarget | null) => {
      const element = target instanceof Element ? target.closest<HTMLElement>(CONTROLS) : null;
      return element && !element.closest('[disabled], [aria-disabled="true"], [inert], [data-sound-feedback="off"]') ? element : null;
    };
    const remember = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === "range") values.set(target, Number(target.value));
    };
    const capture = (event: Event) => { unlockAudio(); remember(event); };
    const feedback = (element: HTMLElement, before: number) => {
      if (getSoundSequence() !== before) return;
      const expanded = element.getAttribute("aria-expanded");
      const pressed = element.getAttribute("aria-pressed") ?? element.getAttribute("aria-checked");
      if (expanded !== null) playSound(expanded === "true" ? "expand" : "collapse");
      else if (pressed !== null) playSound(pressed === "true" ? "on" : "off");
      else if (element instanceof HTMLInputElement) playSound(element.checked ? "on" : "off");
      else playSound("haptic");
    };
    const click = (event: MouseEvent) => {
      const element = control(event.target);
      if (!element) return;
      const before = getSoundSequence();
      // Capture reaches controls inside popovers that stop propagation. Wait
      // until their own handler has run before deciding whether a cue is needed.
      const timer = setTimeout(() => { pending.delete(timer); feedback(element, before); }, 0);
      pending.add(timer);
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const element = control(event.target);
      if (!element || (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) return;
      playSound("hover");
    };
    const tickRange = (element: HTMLInputElement) => {
      if (element.closest('[disabled], [inert], [data-sound-feedback="off"]')) return;
      const value = Number(element.value), previous = values.get(element);
      const step = Number(element.step) || 1;
      if (previous === undefined || Math.abs(value - previous) >= step) {
        values.set(element, value);
        playSound("haptic");
      }
    };
    const input = (event: Event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === "range") tickRange(event.target);
    };
    // Base UI updates the accessible range value while dragging its visible
    // track. That path does not dispatch a native input event.
    document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(element => values.set(element, Number(element.value)));
    const ranges = new MutationObserver(records => {
      for (const { target, oldValue } of records) {
        if (!(target instanceof HTMLInputElement) || target.type !== "range") continue;
        if (oldValue === null) values.set(target, Number(target.value));
        else tickRange(target);
      }
    });
    ranges.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["aria-valuenow"], attributeOldValue: true });
    document.addEventListener("pointerdown", capture, true);
    document.addEventListener("keydown", capture, true);
    document.addEventListener("focusin", remember);
    document.addEventListener("click", click, true);
    document.addEventListener("pointerover", hover);
    document.addEventListener("input", input);
    return () => {
      ranges.disconnect();
      pending.forEach(clearTimeout);
      document.removeEventListener("pointerdown", capture, true);
      document.removeEventListener("keydown", capture, true);
      document.removeEventListener("focusin", remember);
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerover", hover);
      document.removeEventListener("input", input);
    };
  }, []);
}
