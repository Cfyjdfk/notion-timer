import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

const Timer: React.FC = () => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputHours, setInputHours] = useState<string>("");
  const [inputMinutes, setInputMinutes] = useState<string>("");

  const router = useRouter();
  
  // Use refs to track time-related values that persist between renders
  const totalDurationRef = useRef<number>(0); // Total duration set for the timer
  const startTimeRef = useRef<number | null>(null); // Timestamp when timer started
  const pausedTimeRef = useRef<number>(0); // Accumulated paused time
  
  // Load timer from URL parameters
  useEffect(() => {
    const { hours: hoursParam, minutes: minutesParam } = router.query;

    if (hoursParam || minutesParam) {
      const hours = parseInt((hoursParam as string) || "0");
      const minutes = parseInt((minutesParam as string) || "0");
      const totalSeconds = hours * 3600 + minutes * 60;
      setTime(totalSeconds);
      totalDurationRef.current = totalSeconds;
    }
  }, [router.query]);

  // Main timer logic - works regardless of focus state
  useEffect(() => {
    let requestId: number;
    
    const updateTimer = () => {
      if (isRunning && startTimeRef.current) {
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTimeRef.current) / 1000);
        const newRemainingTime = Math.max(
          totalDurationRef.current - (elapsedSinceStart + pausedTimeRef.current), 
          0
        );
        
        setTime(newRemainingTime);
        
        // Stop timer when it reaches zero
        if (newRemainingTime <= 0) {
          setIsRunning(false);
          startTimeRef.current = null;
        } else {
          // Continue updating
          requestId = requestAnimationFrame(updateTimer);
        }
      }
    };
    
    if (isRunning) {
      // When starting the timer
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        totalDurationRef.current = time;
      }
      
      // Start continuous updates
      requestId = requestAnimationFrame(updateTimer);
    } else {
      // When pausing, update accumulated pause time
      if (startTimeRef.current) {
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTimeRef.current) / 1000);
        pausedTimeRef.current += elapsedSinceStart;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (requestId) {
        cancelAnimationFrame(requestId);
      }
    };
  }, [isRunning, time]);

  // Additional worker to ensure consistent updates even in background
  useEffect(() => {
    let worker: Worker | null = null;
    
    if (isRunning) {
      // Create a worker that can run more reliably in the background
      const workerCode = `
        setInterval(() => {
          self.postMessage('tick');
        }, 1000);
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = () => {
        // Worker sends a message every second, forcing an update
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsedSinceStart = Math.floor((now - startTimeRef.current) / 1000);
          const newRemainingTime = Math.max(
            totalDurationRef.current - (elapsedSinceStart + pausedTimeRef.current), 
            0
          );
          setTime(newRemainingTime);
        }
      };
    }
    
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [isRunning]);

  const startPauseTimer = (): void => {
    setIsRunning(!isRunning);
  };

  const setTimer = (): void => {
    const hours = parseInt(inputHours) || 0;
    const minutes = parseInt(inputMinutes) || 0;
    const totalSeconds = hours * 3600 + minutes * 60;
    
    setTime(totalSeconds);
    totalDurationRef.current = totalSeconds;
    
    setInputHours("");
    setInputMinutes("");
    setIsRunning(false);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
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
          {inputHours || inputMinutes ? "Set" : "Reset"}
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
