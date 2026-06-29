declare module 'hark' {
  interface HarkOptions {
    interval?: number;
    threshold?: number;
    play?: boolean;
    history?: number;
  }
  interface HarkEvents {
    on(event: 'speaking', callback: () => void): void;
    on(event: 'stopped_speaking', callback: () => void): void;
    on(event: 'volume_change', callback: (currentVolume: number, threshold: number) => void): void;
    stop(): void;
  }
  function hark(stream: MediaStream, options?: HarkOptions): HarkEvents;
  export default hark;
}
