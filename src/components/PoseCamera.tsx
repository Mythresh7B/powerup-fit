import { useEffect, useRef, useCallback, useState } from 'react';
import { extractAngles, RepCounter, FatigueTracker, checkPosture, POSE_CONNECTIONS } from '@/lib/pose';
import type { Exercise, Landmark } from '@/lib/pose';
import { useSessionStore } from '@/lib/store';

const PoseCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const repCounterRef = useRef(new RepCounter());
  const fatigueRef = useRef(new FatigueTracker());
  const isProcessingRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const inferenceTimerRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [fps, setFps] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const fpsCountRef = useRef(0);
  const fpsTimeRef = useRef(Date.now());

  const { isActive, exercise, onRepComplete, setFatigue, setPosture } = useSessionStore();
  const isActiveRef = useRef(isActive);
  const exerciseRef = useRef(exercise);
  isActiveRef.current = isActive;
  exerciseRef.current = exercise;

  const onRepCompleteRef = useRef(onRepComplete);
  const setFatigueRef = useRef(setFatigue);
  const setPostureRef = useRef(setPosture);
  onRepCompleteRef.current = onRepComplete;
  setFatigueRef.current = setFatigue;
  setPostureRef.current = setPosture;

  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, landmarks: Landmark[], w: number, h: number) => {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;

    for (const [i, j] of POSE_CONNECTIONS) {
      const a = landmarks[i];
      const b = landmarks[j];
      if ((a.visibility ?? 0) > 0.5 && (b.visibility ?? 0) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#6366f1';
    for (const lm of landmarks) {
      if ((lm.visibility ?? 0) > 0.5) {
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, []);

  const onResults = useCallback((results: any) => {
    isProcessingRef.current = false;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    if (results.poseLandmarks) {
      const landmarks: Landmark[] = results.poseLandmarks;
      drawSkeleton(ctx, landmarks, w, h);

      if (isActiveRef.current) {
        const angles = extractAngles(landmarks);
        const ex = exerciseRef.current;
        const counted = repCounterRef.current.update(ex, angles);
        const posture = checkPosture(ex, angles, landmarks);
        setPostureRef.current(posture);

        if (counted) {
          fatigueRef.current.recordRep();
          const isCorrect = posture === 'correct';
          onRepCompleteRef.current(isCorrect, posture);
          setFatigueRef.current(fatigueRef.current.getScore());
        }
      }
    }

    fpsCountRef.current++;
    const now = Date.now();
    if (now - fpsTimeRef.current >= 1000) {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
      fpsTimeRef.current = now;
    }
  }, [drawSkeleton]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        // Load MediaPipe Pose via CDN
        const { Pose } = await import('@mediapipe/pose');
        if (cancelled) return;

        const pose = new Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);
        poseRef.current = pose;
        setLoading(false);

        // Inference loop at ~24fps
        inferenceTimerRef.current = window.setInterval(async () => {
          if (isProcessingRef.current || !video || video.readyState < 2) return;
          isProcessingRef.current = true;
          try {
            await pose.send({ image: video });
          } catch {
            isProcessingRef.current = false;
          }
        }, 42);

      } catch (err) {
        console.error('Camera/Pose init error:', err);
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (inferenceTimerRef.current) clearInterval(inferenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      poseRef.current?.close();
    };
  }, [onResults]);

  useEffect(() => {
    if (isActive) {
      repCounterRef.current.reset();
      fatigueRef.current.reset();
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-secondary">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />

      {/* FPS badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="px-2 py-1 rounded-md bg-secondary/80 backdrop-blur text-xs font-mono text-muted-foreground">
          {fps} FPS
        </span>
        {isActive && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/20 backdrop-blur text-xs font-semibold text-destructive">
            <span className="w-2 h-2 rounded-full bg-destructive pulse-live" />
            LIVE
          </span>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              {!cameraReady ? 'Requesting camera...' : 'Loading pose model...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoseCamera;
