export const trackEvent = (eventName: string) => {
    // @ts-ignore
    if (window.plausible) window.plausible(eventName);
};
