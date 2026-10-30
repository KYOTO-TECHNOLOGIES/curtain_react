export interface SurfaceTypeOption {
  value: string;
  label: string;
}

const BUILT_IN: SurfaceTypeOption[] = [
  { value: 'window_curtain_path', label: 'Window (Curtain Path)' },
  { value: 'wall_to_wall_track', label: 'Wall-to-Wall Track' },
  { value: 'bay_window', label: 'Bay Window' },
  { value: 'sliding_door', label: 'Sliding Door' },
];

/** Built-in surface types plus user-defined ones (add / rename / remove). */
export function useSurfaceTypes() {
  return { options: BUILT_IN };
}
