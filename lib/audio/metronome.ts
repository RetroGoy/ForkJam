export function createMetronome(bpm: number) {
  const interval = 60000 / bpm;

  return {
    start(callback?: (beat: number) => void) {
      let beat = 1;

      const id = setInterval(() => {
        const audio = new Audio("/metronome/tick.mp3"); 
        audio.volume = beat === 1 ? 1 : 0.7;  
        audio.play();

        callback?.(beat);
        beat = beat === 4 ? 1 : beat + 1;
      }, interval);

      return id;
    },

    stop(id: ReturnType<typeof setInterval>) {
      clearInterval(id);
    }
  };
}