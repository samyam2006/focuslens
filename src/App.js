import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Eye, EyeOff, Timer, TrendingUp, Zap, ArrowLeftRight,
} from "lucide-react";

import Header from "./components/Header";
import CameraView from "./components/CameraView";
import ScoreRing from "./components/ScoreRing";
import StatCard from "./components/StatCard";
import FocusChart from "./components/FocusChart";
import PomodoroTimer from "./components/PomodoroTimer";
import SessionHistory from "./components/SessionHistory";
import BlockedSites from "./components/BlockedSites";
import DistractionOverlay from "./components/DistractionOverlay";

import useFaceDetection from "./hooks/useFaceDetection";
import usePomodoro from "./hooks/usePomodoro";
import useTabVisibility from "./hooks/useTabVisibility";

import { formatTime, FOCUS_THRESHOLD, DISTRACTION_ALERT_DELAY } from "./utils/helpers";
import { playDistractionChime } from "./utils/alertSound";
import { saveSession } from "./utils/sessionStore";

import "./App.css";

export default function App() {
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const intervalRef = useRef(null);
  const distractedForRef = useRef(0);   // consecutive seconds distracted
  const scoreHistoryRef = useRef([]);    // for avg calculation

  // Mutable counters
  const scoreSmoothed = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const focusTimeRef = useRef(0);
  const distractedTimeRef = useRef(0);
  const sessionTimeRef = useRef(0);

  // Hooks
  const { modelReady, modelError, detectFace } = useFaceDetection();
  const pomo = usePomodoro();
  const { isTabVisible, tabSwitchCount, timeAway, resetTabStats } = useTabVisibility();

  // UI state
  const [cameraActive, setCameraActive] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [focusScore, setFocusScore] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [focusTime, setFocusTime] = useState(0);
  const [distractedTime, setDistractedTime] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [faceBox, setFaceBox] = useState(null);
  const [headPose, setHeadPose] = useState("unknown");
  const [showAlert, setShowAlert] = useState(false);
  const [alertReason, setAlertReason] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("monitor"); // monitor | history | blocker
  const [soundEnabled, setSoundEnabled] = useState(true);

  /* ── Camera ── */
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTracking(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  /* ── Per-frame AI detection ── */
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !modelReady) return;

    const result = await detectFace(video);

    // Tab visibility penalty
    const tabPenalty = isTabVisible ? 1 : 0;

    const rawScore = result.detected ? result.score * tabPenalty : 0;
    scoreSmoothed.current = scoreSmoothed.current * 0.7 + rawScore * 0.3;
    const finalScore = Math.round(Math.min(scoreSmoothed.current * 100, 100));

    setFocusScore(finalScore);
    setIsFocused(finalScore >= FOCUS_THRESHOLD);
    setFaceBox(result.box);
    setHeadPose(result.headPose);

    // Streak tracking
    if (finalScore >= FOCUS_THRESHOLD) {
      streakRef.current += 1;
      if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current;
      distractedForRef.current = 0;
      setShowAlert(false);
    } else {
      streakRef.current = 0;
    }
    setCurrentStreak(streakRef.current);
    setBestStreak(bestStreakRef.current);
  }, [modelReady, detectFace, isTabVisible]);

  /* ── Tracking loop ── */
  useEffect(() => {
    if (!tracking) return;

    // Detection at ~15fps to not overload TF.js
    let lastDetect = 0;
    const tick = (timestamp) => {
      if (timestamp - lastDetect > 66) { // ~15fps
        processFrame();
        lastDetect = timestamp;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    // 1-second timer for counters
    intervalRef.current = setInterval(() => {
      sessionTimeRef.current += 1;
      setSessionTime(sessionTimeRef.current);

      const currentScore = scoreSmoothed.current * 100;
      scoreHistoryRef.current.push(currentScore);

      if (currentScore >= FOCUS_THRESHOLD) {
        focusTimeRef.current += 1;
        setFocusTime(focusTimeRef.current);
        distractedForRef.current = 0;
      } else {
        distractedTimeRef.current += 1;
        setDistractedTime(distractedTimeRef.current);
        distractedForRef.current += 1;

        // Distraction alert
        if (distractedForRef.current === DISTRACTION_ALERT_DELAY) {
          const reason = !isTabVisible
            ? "You switched tabs — get back to work!"
            : "Your face isn't detected — look at the screen!";
          setShowAlert(true);
          setAlertReason(reason);
          if (soundEnabled) playDistractionChime();
        }
      }

      // Chart sample every 3 seconds
      if (sessionTimeRef.current % 3 === 0) {
        setChartData((prev) => {
          const next = [
            ...prev,
            {
              t: Math.floor(sessionTimeRef.current / 3),
              score: Math.round(scoreSmoothed.current * 100),
            },
          ];
          return next.length > 100 ? next.slice(-100) : next;
        });
      }
    }, 1000);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tracking, processFrame, isTabVisible, soundEnabled]);

  // Recover camera when tab becomes visible again — full stream restart
  useEffect(() => {
    if (!isTabVisible || !cameraActive || !videoRef.current) return;

    const video = videoRef.current;

    async function restartStream() {
      try {
        // Kill the old stream completely
        if (video.srcObject) {
          video.srcObject.getVideoTracks().forEach((t) => t.stop());
        }

        // Get a brand new stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });

        video.srcObject = stream;
        await video.play();
      } catch (err) {
        console.warn("Camera restart failed:", err);
      }
    }

    restartStream();
  }, [isTabVisible, cameraActive]);

  // Tab switch distraction alert
  useEffect(() => {
    if (tracking && !isTabVisible) {
      setShowAlert(true);
      setAlertReason("You switched tabs — get back to work!");
      if (soundEnabled) playDistractionChime();
    } else if (isTabVisible && showAlert) {
      // Auto-dismiss after returning
      const t = setTimeout(() => setShowAlert(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isTabVisible, tracking, soundEnabled, showAlert]);

  // Cleanup
  useEffect(() => stopCamera, [stopCamera]);

  /* ── Controls ── */
  const handleStart = async () => {
    if (!cameraActive) await startCamera();
    setTracking(true);
  };

  const handlePause = () => setTracking(false);

  const handleReset = () => {
    setTracking(false);
    scoreSmoothed.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    focusTimeRef.current = 0;
    distractedTimeRef.current = 0;
    sessionTimeRef.current = 0;
    distractedForRef.current = 0;
    scoreHistoryRef.current = [];
    setFocusScore(0);
    setIsFocused(false);
    setSessionTime(0);
    setFocusTime(0);
    setDistractedTime(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setChartData([]);
    setFaceBox(null);
    setShowAlert(false);
    resetTabStats();
    pomo.resetPomodoro();
  };

  const handleSave = () => {
    if (sessionTimeRef.current < 10) return;
    const scores = scoreHistoryRef.current;
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    saveSession({
      sessionTime: sessionTimeRef.current,
      focusTime: focusTimeRef.current,
      distractedTime: distractedTimeRef.current,
      avgScore,
      tabSwitches: tabSwitchCount,
    });
    setHistoryRefreshKey((k) => k + 1);
  };

  const focusPct = sessionTime > 0 ? Math.round((focusTime / sessionTime) * 100) : 0;

  return (
    <div className="app-root">
      <DistractionOverlay visible={showAlert} reason={alertReason} />

      <Header
        tracking={tracking}
        cameraActive={cameraActive}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSave={handleSave}
        sessionTime={sessionTime}
      />

      {/* Tab navigation */}
      <div className="tab-nav">
        {["monitor", "history", "blocker"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "monitor" ? "Monitor" : tab === "history" ? "History" : "Focus Shield"}
          </button>
        ))}
        <button
          className={`tab-btn tab-btn--sound ${soundEnabled ? "" : "tab-btn--muted"}`}
          onClick={() => setSoundEnabled((s) => !s)}
          title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      {/* ── MONITOR TAB — always mounted, hidden via CSS to preserve camera ── */}
      <div style={{ display: activeTab === "monitor" ? "block" : "none" }}>
        <div className="main-grid">
          {/* Left — Camera */}
          <CameraView
            videoRef={videoRef}
            cameraActive={cameraActive}
            tracking={tracking}
            isFocused={isFocused}
            focusScore={focusScore}
            cameraError={cameraError}
            modelReady={modelReady}
            faceBox={faceBox}
            headPose={headPose}
            isTabVisible={isTabVisible}
          />

          {/* Right — Score + Stats + Pomo */}
          <div className="right-col">
            <div className="panel">
              <ScoreRing score={focusScore} />
            </div>

            <div className="stats-grid">
              <StatCard icon={<Timer size={14} />} label="Session" value={formatTime(sessionTime)} color="#0088ff" />
              <StatCard icon={<Eye size={14} />} label="Focused" value={formatTime(focusTime)} color="#00ffc8" />
              <StatCard icon={<EyeOff size={14} />} label="Distracted" value={formatTime(distractedTime)} color="#ff3d5a" />
              <StatCard icon={<TrendingUp size={14} />} label="Focus %" value={`${focusPct}%`} color="#ffc400" />
              <StatCard icon={<Zap size={14} />} label="Streak" value={`${currentStreak}s`} color="#c084fc" />
              <StatCard icon={<ArrowLeftRight size={14} />} label="Tab Switches" value={tabSwitchCount} color="#f472b6" />
            </div>

            <PomodoroTimer
              {...pomo}
              onStart={pomo.startPomodoro}
              onPause={pomo.pausePomodoro}
              onSkip={pomo.skipPhase}
              onReset={pomo.resetPomodoro}
            />
          </div>

          {/* Chart — full width */}
          <FocusChart data={chartData} />
        </div>
      </div>

      {/* ── HISTORY TAB ── */}
      <div style={{ display: activeTab === "history" ? "block" : "none" }}>
        <div className="tab-content">
          <SessionHistory refreshKey={historyRefreshKey} />
        </div>
      </div>

      {/* ── BLOCKER TAB ── */}
      <div style={{ display: activeTab === "blocker" ? "block" : "none" }}>
        <div className="tab-content">
          <BlockedSites
            tabSwitchCount={tabSwitchCount}
            timeAway={timeAway}
            isTracking={tracking}
          />
        </div>
      </div>

      {/* Model status */}
      {modelError && (
        <div className="model-error">
          AI model failed to load: {modelError}. Using basic detection as fallback.
        </div>
      )}

    </div>
  );
}
