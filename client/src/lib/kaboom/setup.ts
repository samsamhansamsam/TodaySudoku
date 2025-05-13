import kaboom, { KaboomCtx } from "kaboom";

// Global reference to Kaboom instance
export let k: KaboomCtx | null = null;

// Safely destroy all game objects
export function destroyAll(tag?: string) {
  if (k) {
    try {
      if (tag) {
        k.destroyAll(tag);
      } else {
        // If no tag is provided, destroy everything
        const allObjects = k.get();
        allObjects.forEach(obj => {
          k?.destroy(obj);
        });
      }
    } catch (e) {
      console.error("Error destroying Kaboom objects:", e);
    }
  }
}

export function setupKaboom(canvas: HTMLCanvasElement) {
  try {
    // Destroy existing instance if there is one
    if (k) {
      destroyAll();
    }
    
    console.log("Initializing new Kaboom instance");
    
    // Initialize Kaboom on the provided canvas
    k = kaboom({
      canvas,
      background: [248, 250, 252],
      width: 450,
      height: 450,
      scale: 1,
      debug: false,
      crisp: true,
      global: false, // Don't pollute global namespace
    });
    
    console.log("Kaboom instance created successfully");
    return k;
  } catch (e) {
    console.error("Error setting up Kaboom:", e);
    return null;
  }
}
