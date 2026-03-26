import { useState, useEffect, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

/**
 * Hook that manages BlazeFace model loading + per-frame face detection.
 *
 * Returns:
 *  - modelReady: boolean
 *  - detectFace(video): async → { detected, score, box, landmarks, headPose }
 */
export default function useFaceDetection() {
  const modelRef = useRef(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        await tf.ready();
        const model = await blazeface.load();
        if (!cancelled) {
          modelRef.current = model;
          setModelReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("BlazeFace load failed:", err);
          setModelError(err.message);
        }
      }
    }

    loadModel();
    return () => { cancelled = true; };
  }, []);

  /**
   * Run detection on the current video frame.
   * @param {HTMLVideoElement} video
   * @returns {Object} detection result
   */
  const detectFace = useCallback(async (video) => {
    if (!modelRef.current || !video || video.readyState < 2) {
      return { detected: false, score: 0, box: null, landmarks: null, headPose: "unknown" };
    }

    try {
      const predictions = await modelRef.current.estimateFaces(video, false);

      if (!predictions || predictions.length === 0) {
        return { detected: false, score: 0, box: null, landmarks: null, headPose: "away" };
      }

      // Take the most confident face
      const face = predictions[0];
      const prob = face.probability[0];

      // Bounding box
      const topLeft = face.topLeft;
      const bottomRight = face.bottomRight;
      const box = {
        x: topLeft[0],
        y: topLeft[1],
        width: bottomRight[0] - topLeft[0],
        height: bottomRight[1] - topLeft[1],
      };

      // Landmarks: [rightEye, leftEye, nose, mouth, rightEar, leftEar]
      const landmarks = face.landmarks;

      // Head pose estimation from ear-to-ear distance vs face width
      let headPose = "forward";
      if (landmarks && landmarks.length >= 6) {
        const rightEar = landmarks[4];
        const leftEar = landmarks[5];
        const nose = landmarks[2];
        const earDist = Math.abs(rightEar[0] - leftEar[0]);
        const noseToRight = Math.abs(nose[0] - rightEar[0]);
        const noseToLeft = Math.abs(nose[0] - leftEar[0]);
        const ratio = Math.min(noseToRight, noseToLeft) / Math.max(noseToRight, noseToLeft);

        if (ratio < 0.4) {
          headPose = "turned"; // looking sideways
        } else if (box.y < 10) {
          headPose = "up";
        } else {
          headPose = "forward";
        }
      }

      // Face position — is it reasonably centred?
      const videoW = video.videoWidth || 640;
      const videoH = video.videoHeight || 480;
      const faceCX = box.x + box.width / 2;
      const faceCY = box.y + box.height / 2;
      const offCenterX = Math.abs(faceCX - videoW / 2) / (videoW / 2);
      const offCenterY = Math.abs(faceCY - videoH / 2) / (videoH / 2);
      const centeredScore = Math.max(0, 1 - (offCenterX + offCenterY) / 2);

      // Composite score: probability × centred × head-pose
      const poseMultiplier = headPose === "forward" ? 1.0 : headPose === "turned" ? 0.3 : 0.6;
      const rawScore = prob * centeredScore * poseMultiplier;

      return {
        detected: prob > 0.5,
        score: rawScore,
        confidence: prob,
        box,
        landmarks,
        headPose,
        centeredScore,
      };
    } catch (err) {
      console.warn("Detection error:", err);
      return { detected: false, score: 0, box: null, landmarks: null, headPose: "unknown" };
    }
  }, []);

  return { modelReady, modelError, detectFace };
}
