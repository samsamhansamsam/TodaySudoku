import kaboom from "kaboom";

// Global reference to Kaboom instance
export let k: ReturnType<typeof kaboom> | null = null;

export function setupKaboom(canvas: HTMLCanvasElement) {
  if (k) {
    // Already initialized
    return k;
  }

  // Initialize Kaboom on the provided canvas
  k = kaboom({
    canvas,
    background: [248, 250, 252],
    width: 450,
    height: 450,
    scale: 1,
    debug: false,
    crisp: true,
  });

  return k;
}
