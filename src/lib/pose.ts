// Pose math utilities — all client-side, no ML training needed

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Angles {
  left_elbow: number;
  right_elbow: number;
  left_knee: number;
  right_knee: number;
  left_hip: number;
  right_hip: number;
  left_shoulder: number;
  right_shoulder: number;
}

export type Exercise = 'bicep_curl' | 'shoulder_press' | 'squat' | 'plank';
export type PostureLabel = 'correct' | 'elbow_swing' | 'shoulder_shrug' | 'knee_cave' | 'forward_lean' | 'hip_deviation';
export type RepStage = 'up' | 'down' | 'hold' | null;

// MediaPipe BlazePose landmark indices
const LANDMARKS = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(radians * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

export function extractAngles(landmarks: Landmark[]): Angles {
  const l = landmarks;
  return {
    left_elbow: angle(l[LANDMARKS.LEFT_SHOULDER], l[LANDMARKS.LEFT_ELBOW], l[LANDMARKS.LEFT_WRIST]),
    right_elbow: angle(l[LANDMARKS.RIGHT_SHOULDER], l[LANDMARKS.RIGHT_ELBOW], l[LANDMARKS.RIGHT_WRIST]),
    left_knee: angle(l[LANDMARKS.LEFT_HIP], l[LANDMARKS.LEFT_KNEE], l[LANDMARKS.LEFT_ANKLE]),
    right_knee: angle(l[LANDMARKS.RIGHT_HIP], l[LANDMARKS.RIGHT_KNEE], l[LANDMARKS.RIGHT_ANKLE]),
    left_hip: angle(l[LANDMARKS.LEFT_SHOULDER], l[LANDMARKS.LEFT_HIP], l[LANDMARKS.LEFT_KNEE]),
    right_hip: angle(l[LANDMARKS.RIGHT_SHOULDER], l[LANDMARKS.RIGHT_HIP], l[LANDMARKS.RIGHT_KNEE]),
    left_shoulder: angle(l[LANDMARKS.LEFT_ELBOW], l[LANDMARKS.LEFT_SHOULDER], l[LANDMARKS.LEFT_HIP]),
    right_shoulder: angle(l[LANDMARKS.RIGHT_ELBOW], l[LANDMARKS.RIGHT_SHOULDER], l[LANDMARKS.RIGHT_HIP]),
  };
}

export class RepCounter {
  stage: RepStage = null;
  count = 0;
  private holdStart = 0;

  reset() {
    this.stage = null;
    this.count = 0;
    this.holdStart = 0;
  }

  update(exercise: Exercise, angles: Angles): boolean {
    let counted = false;
    const avgElbow = (angles.left_elbow + angles.right_elbow) / 2;
    const avgKnee = (angles.left_knee + angles.right_knee) / 2;
    const avgHip = (angles.left_hip + angles.right_hip) / 2;

    switch (exercise) {
      case 'bicep_curl':
        if (avgElbow < 60) this.stage = 'down';
        if (this.stage === 'down' && avgElbow > 160) {
          this.count++;
          this.stage = 'up';
          counted = true;
        }
        break;
      case 'shoulder_press':
        if (avgElbow < 100) this.stage = 'down';
        if (this.stage === 'down' && avgElbow > 160) {
          this.count++;
          this.stage = 'up';
          counted = true;
        }
        break;
      case 'squat':
        if (avgKnee < 100) this.stage = 'down';
        if (this.stage === 'down' && avgKnee > 160) {
          this.count++;
          this.stage = 'up';
          counted = true;
        }
        break;
      case 'plank':
        if (avgHip > 160 && avgHip < 200) {
          if (this.stage !== 'hold') {
            this.stage = 'hold';
            this.holdStart = Date.now();
          }
          if (Date.now() - this.holdStart >= 5000) {
            this.count++;
            this.holdStart = Date.now();
            counted = true;
          }
        } else {
          this.stage = null;
          this.holdStart = 0;
        }
        break;
    }
    return counted;
  }
}

export function checkPosture(exercise: Exercise, angles: Angles, landmarks: Landmark[]): PostureLabel {
  const l = landmarks;
  switch (exercise) {
    case 'bicep_curl': {
      const shoulderX = (l[LANDMARKS.LEFT_SHOULDER].x + l[LANDMARKS.RIGHT_SHOULDER].x) / 2;
      const elbowX = (l[LANDMARKS.LEFT_ELBOW].x + l[LANDMARKS.RIGHT_ELBOW].x) / 2;
      if (Math.abs(shoulderX - elbowX) > 0.08) return 'elbow_swing';
      if (angles.left_shoulder < 20 || angles.right_shoulder < 20) return 'shoulder_shrug';
      break;
    }
    case 'shoulder_press': {
      if (angles.left_shoulder < 60 || angles.right_shoulder < 60) return 'shoulder_shrug';
      break;
    }
    case 'squat': {
      const leftKneeX = l[LANDMARKS.LEFT_KNEE].x;
      const leftAnkleX = l[LANDMARKS.LEFT_ANKLE].x;
      if (Math.abs(leftKneeX - leftAnkleX) > 0.06) return 'knee_cave';
      const hipY = (l[LANDMARKS.LEFT_HIP].y + l[LANDMARKS.RIGHT_HIP].y) / 2;
      const shoulderY = (l[LANDMARKS.LEFT_SHOULDER].y + l[LANDMARKS.RIGHT_SHOULDER].y) / 2;
      if (shoulderY > hipY - 0.05) return 'forward_lean';
      break;
    }
    case 'plank': {
      const avgHip = (angles.left_hip + angles.right_hip) / 2;
      if (avgHip < 150 || avgHip > 200) return 'hip_deviation';
      break;
    }
  }
  return 'correct';
}

export class FatigueTracker {
  private repTimes: number[] = [];
  private lastRepTime = 0;
  private baselineAvg = 0;

  reset() {
    this.repTimes = [];
    this.lastRepTime = 0;
    this.baselineAvg = 0;
  }

  recordRep() {
    const now = Date.now();
    if (this.lastRepTime > 0) {
      const delta = now - this.lastRepTime;
      this.repTimes.push(delta);
      if (this.repTimes.length === 5) {
        this.baselineAvg = this.repTimes.reduce((a, b) => a + b, 0) / 5;
      }
    }
    this.lastRepTime = now;
  }

  getScore(): number {
    if (this.repTimes.length < 6 || this.baselineAvg === 0) return 0;
    const recent = this.repTimes.slice(-3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const slowdown = (recentAvg - this.baselineAvg) / this.baselineAvg;
    return Math.min(1, Math.max(0, slowdown));
  }
}

// Bone connections for skeleton drawing
export const POSE_CONNECTIONS = [
  [11, 13], [13, 15], [12, 14], [14, 16], // arms
  [11, 12], [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], [24, 26], [26, 28], // legs
];
