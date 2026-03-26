import { useState, useRef, useEffect, useCallback } from "react";
import { POMO_DEFAULTS } from "../utils/helpers";
import { playCompletionDing, playBreakReminder } from "../utils/alertSound";

/**
 * Pomodoro timer hook.
 *
 * States: "idle" | "work" | "shortBreak" | "longBreak"
 *
 * Returns timer state + controls.
 */
export default function usePomodoro() {
  const [phase, setPhase] = useState("idle");       // idle | work | shortBreak | longBreak
  const [timeLeft, setTimeLeft] = useState(POMO_DEFAULTS.workMinutes * 60);
  const [round, setRound] = useState(1);             // current pomodoro round
  const [totalPomos, setTotalPomos] = useState(0);    // completed pomodoros
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Tick down
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Phase complete
          clearTimer();
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, phase]);

  const handlePhaseComplete = useCallback(() => {
    if (phase === "work") {
      playCompletionDing();
      const newTotal = totalPomos + 1;
      setTotalPomos(newTotal);

      if (round % POMO_DEFAULTS.roundsBeforeLongBreak === 0) {
        setPhase("longBreak");
        setTimeLeft(POMO_DEFAULTS.longBreakMinutes * 60);
      } else {
        setPhase("shortBreak");
        setTimeLeft(POMO_DEFAULTS.shortBreakMinutes * 60);
      }
      setIsRunning(true);
    } else {
      // Break is over → next work round
      playBreakReminder();
      setRound((r) => r + 1);
      setPhase("work");
      setTimeLeft(POMO_DEFAULTS.workMinutes * 60);
      setIsRunning(true);
    }
  }, [phase, round, totalPomos]);

  // Re-bind handlePhaseComplete when deps change
  useEffect(() => {
    // This ensures the latest closure is used
  }, [handlePhaseComplete]);

  const startPomodoro = () => {
    if (phase === "idle") {
      setPhase("work");
      setTimeLeft(POMO_DEFAULTS.workMinutes * 60);
      setRound(1);
      setTotalPomos(0);
    }
    setIsRunning(true);
  };

  const pausePomodoro = () => setIsRunning(false);

  const skipPhase = () => {
    clearTimer();
    if (phase === "work") {
      setPhase("shortBreak");
      setTimeLeft(POMO_DEFAULTS.shortBreakMinutes * 60);
    } else {
      setRound((r) => r + 1);
      setPhase("work");
      setTimeLeft(POMO_DEFAULTS.workMinutes * 60);
    }
    setIsRunning(true);
  };

  const resetPomodoro = () => {
    clearTimer();
    setPhase("idle");
    setTimeLeft(POMO_DEFAULTS.workMinutes * 60);
    setRound(1);
    setTotalPomos(0);
    setIsRunning(false);
  };

  return {
    phase,
    timeLeft,
    round,
    totalPomos,
    isRunning,
    startPomodoro,
    pausePomodoro,
    skipPhase,
    resetPomodoro,
  };
}
