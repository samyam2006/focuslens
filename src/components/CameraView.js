import React from "react";
import { Camera, MonitorOff, Loader } from "lucide-react";
import { scoreToColor } from "../utils/helpers";

export default function CameraView({
  videoRef,
  cameraActive,
  tracking,
  isFocused,
  focusScore,
  cameraError,
  modelReady,
  faceBox,
  headPose,
  isTabVisible,
}) {
  const color = scoreToColor(focusScore);

  // Scale bounding box from video coords to display coords
  const renderBox = () => {
    if (!faceBox || !videoRef.current || !tracking) return null;
    const video = videoRef.current;
    const displayW = video.clientWidth;
    const displayH = video.clientHeight;
    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;
    const scaleX = displayW / videoW;
    const scaleY = displayH / videoH;

    // Mirror the X coordinate since video is flipped
    const mirroredX = videoW - faceBox.x - faceBox.width;

    return (
      <div
        style={{
          position: "absolute",
          left: mirroredX * scaleX,
          top: faceBox.y * scaleY,
          width: faceBox.width * scaleX,
          height: faceBox.height * scaleY,
          border: `2px solid ${color}`,
          borderRadius: 8,
          pointerEvents: "none",
          boxShadow: `0 0 12px ${color}30`,
          transition: "all 0.15s ease",
        }}
      >
        {/* Head pose label */}
        <span
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            fontSize: 9,
            color,
            background: "#000a",
            padding: "1px 6px",
            borderRadius: 4,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {headPose === "forward" ? "ENGAGED" : headPose === "turned" ? "LOOKING AWAY" : "DETECTING..."}
        </span>
      </div>
    );
  };

  return (
    <div className="panel camera-panel">
      <div className="camera-container">
        <video
          ref={videoRef}
          style={{ opacity: cameraActive ? 1 : 0.15 }}
          className="camera-video"
          playsInline
          muted
        />

        {/* Face bounding box */}
        {renderBox()}

        {/* Scan line */}
        {tracking && (
          <div
            className="camera-scanline"
            style={{
              background: `linear-gradient(transparent 0%, transparent 48%, ${color}18 50%, transparent 52%, transparent 100%)`,
            }}
          />
        )}

        {/* Tab away warning */}
        {tracking && !isTabVisible && (
          <div className="camera-tab-warning">
            <span>TAB UNFOCUSED — COME BACK!</span>
          </div>
        )}

        {/* Status badge */}
        <div className="camera-badge">
          <div
            className="camera-dot"
            style={{
              background: tracking
                ? isFocused
                  ? "#00ffc8"
                  : "#ff3d5a"
                : "#4a5568",
              boxShadow: tracking
                ? `0 0 8px ${isFocused ? "#00ffc8" : "#ff3d5a"}`
                : "none",
              animation: tracking && !isFocused ? "pulse 1.2s infinite" : "none",
            }}
          />
          <span>
            {!cameraActive
              ? "Camera Off"
              : !tracking
              ? "Paused"
              : !isTabVisible
              ? "Tab Away"
              : isFocused
              ? "Focused"
              : "Distracted"}
          </span>
        </div>

        {/* Model loading indicator */}
        {cameraActive && !modelReady && (
          <div className="camera-loading">
            <Loader size={20} className="spin" />
            <span>Loading AI model…</span>
          </div>
        )}

        {/* Placeholder */}
        {!cameraActive && !cameraError && (
          <div className="camera-placeholder">
            <Camera size={36} color="#4a5568" />
            <span>Press Start to begin</span>
          </div>
        )}

        {/* Error */}
        {cameraError && (
          <div className="camera-placeholder" style={{ background: "#0009" }}>
            <MonitorOff size={32} color="#ff3d5a" />
            <span style={{ color: "#ff3d5a" }}>{cameraError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
