export interface TourStep {
  target?: string;
  targetId?: string;
  title?: string;
  content: string;
  disableBeacon?: boolean;
}

export function GuidedTour(_props: any) {
  return null;
}
export function useGuidedTour() {
  return { startTour: () => {} };
}
