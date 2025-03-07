import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
const Timer: React.FC = () => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputHours, setInputHours] = useState<string>("");
  const [inputMinutes, setInputMinutes] = useState<string>("");
  
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const { hours: hoursParam, minutes: minutesParam } = router.query;   

    if (hoursParam || minutesParam) {
      const hours = parseInt((hoursParam as string) || "0");
      const minutes = parseInt((minutesParam as string) || "0");
      const totalSeconds = hours * 3600 + minutes * 60;
      setTime(totalSeconds);
    }
  }, [router.query]);

  const startPauseTimer = (): void => {
    setIsRunning(!isRunning);
  };

  const setTimer = (): void => {
    const hours = parseInt(inputHours) || 0;
    const minutes = parseInt(inputMinutes) || 0;
    const totalSeconds = hours * 3600 + minutes * 60;
    setTime(totalSeconds);
    setInputHours("");
    setInputMinutes("");
  };

  const formatTime = (): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ): void => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setter(value);
    }
  };

  return (
    <div className="w-full aspect-square bg-[#191919] text-white flex flex-col items-center justify-center p-5">
      <div className="text-6xl font-mono mb-8 tracking-wider">
        {formatTime()}
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Hours"
          className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-center focus:outline-none focus:border-gray-500 text-lg"
          value={inputHours}
          onChange={(e) => handleInputChange(e, setInputHours)}
          maxLength={2}
        />
        <input
          type="text"
          placeholder="Mins"
          className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-center focus:outline-none focus:border-gray-500 text-lg"
          value={inputMinutes}
          onChange={(e) => handleInputChange(e, setInputMinutes)}
          maxLength={2}
        />
        <button
          onClick={setTimer}
          className="px-4 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors text-lg"
        >
          Set
        </button>
        {time !== 0 && (
          <button
            onClick={startPauseTimer}
            className="px-4 py-1 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors text-lg"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;
