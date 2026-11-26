import { CameraShakeState, Vector2D } from './types';

export class Camera {
  public position: Vector2D = { x: 0, y: 0 };
  public targetPosition: Vector2D = { x: 0, y: 0 };
  public zoom: number = 1.0;
  public targetZoom: number = 1.0;

  private shake: CameraShakeState = {
    intensity: 0,
    duration: 0,
    elapsed: 0,
  };

  public shakeOffset: Vector2D = { x: 0, y: 0 };

  public triggerShake(intensity: number, durationMs: number): void {
    this.shake = {
      intensity,
      duration: durationMs / 1000,
      elapsed: 0,
    };
  }

  public update(deltaTimeSeconds: number): void {
    // Smooth follow target position
    const lerpSpeed = 5.0 * deltaTimeSeconds;
    this.position.x += (this.targetPosition.x - this.position.x) * Math.min(1, lerpSpeed);
    this.position.y += (this.targetPosition.y - this.position.y) * Math.min(1, lerpSpeed);

    // Smooth zoom
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, lerpSpeed);

    // Update screen shake
    if (this.shake.elapsed < this.shake.duration) {
      this.shake.elapsed += deltaTimeSeconds;
      const progress = this.shake.elapsed / this.shake.duration;
      const dampening = 1 - progress;
      const currentIntensity = this.shake.intensity * dampening;

      this.shakeOffset.x = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffset.y = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }

  public getRenderOffset(): Vector2D {
    return {
      x: this.position.x + this.shakeOffset.x,
      y: this.position.y + this.shakeOffset.y,
    };
  }
}

export const gameCamera = new Camera();
