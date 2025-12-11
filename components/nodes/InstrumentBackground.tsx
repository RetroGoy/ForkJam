import {
  Guitar,
  Mic2,
  Drum,
  Piano,
  Radio,
  KeyboardMusic,
  Music2,
} from "lucide-react";

const iconMap: Record<string, any> = {
  guitar: Guitar,
  voice: Mic2,
  drums: Drum,
  piano: Piano,
  synth: KeyboardMusic,
  bass: Guitar,
  dj: Radio,
};

export function InstrumentBackground({ instrument }: { instrument?: string | null }) {
  const key = (instrument ?? "").toLowerCase();

  const Icon =
    iconMap[key] ??
    Music2; 

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.2]">
      <Icon
        size={170}
        className="text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] translate-y-4 translate-x-4"
      />
    </div>
  );
}