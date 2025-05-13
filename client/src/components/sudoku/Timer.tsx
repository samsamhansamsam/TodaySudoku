import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  seconds: number;
}

export default function Timer({ seconds }: TimerProps) {
  const [displayTime, setDisplayTime] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    setDisplayTime({
      minutes,
      seconds: remainingSeconds
    });
  }, [seconds]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-muted-foreground font-mono">
      <Clock className="h-4 w-4" />
      <span>
        {String(displayTime.minutes).padStart(2, '0')}:
        {String(displayTime.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
