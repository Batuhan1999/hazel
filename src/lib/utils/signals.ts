import { createEffect, createSignal, type Accessor } from 'solid-js';

/**
 * Creates an effect that only runs when the tracked signal's value changes,
 * but not on initialization/first render.
 * 
 * Should only be used for primitive values, because it compares the values using ===.
 * 
 * @param source The signal or accessor function to track
 * @param fn The effect function to run on changes
 * @param options Optional createEffect options
 * @returns A cleanup function
 */
export function createChangeEffect<T>(
  source: Accessor<T>,
  fn: (value: T, previousValue: T | undefined) => void,
  options?: { equals?: false | ((prev: T, next: T) => boolean) }
) {
  const [previousValue, setPreviousValue] = createSignal<T | undefined>(undefined);
  const [isFirstRun, setIsFirstRun] = createSignal(true);
  
  return createEffect(() => {
    const currentValue = source();
    if(currentValue === undefined) {
      return;
    }

    if(currentValue === previousValue()) {
      return;
    }
    
    if (!isFirstRun()) {
      // Only run the effect if it's not the first run
      fn(currentValue, previousValue());
    } else {
      // Mark first run as complete
      setIsFirstRun(false);
    }
    
    // Always update the previous value
    setPreviousValue(() => currentValue);
  }, options);
} 