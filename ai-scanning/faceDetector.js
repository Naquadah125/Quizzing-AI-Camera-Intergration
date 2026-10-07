export class FaceProctor {
  constructor(options = {}) {
    this.scanIntervalMs = options.scanIntervalMs || 1000;
    this.toleranceLimit = options.toleranceLimit || 3;
    this.consecutiveFails = 0;
    this.isRunning = false;
    this.intervalId = null;

    this.onStatusChange = options.onStatusChange || (() => {});
    this.onViolation = options.onViolation || (() => {});
    this.onFrameScanned = options.onFrameScanned || (() => {});

    this.hasNativeDetector = typeof window !== 'undefined' && 'FaceDetector' in window;
    if (this.hasNativeDetector) {
      try {
        this.nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
      } catch (e) {
        this.hasNativeDetector = false;
      }
    }
  }

  start(videoElement) {
    if (!videoElement) {
      console.error('[FaceProctor] Video element is required to start.');
      return;
    }

    this.videoElement = videoElement;
    this.consecutiveFails = 0;
    this.isRunning = true;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    console.log('[FaceProctor] Face scanning started. Cycle:', this.scanIntervalMs, 'ms, Tolerance:', this.toleranceLimit, 'fails');

    this.intervalId = setInterval(() => {
      this.scanCurrentFrame();
    }, this.scanIntervalMs);

    setTimeout(() => this.scanCurrentFrame(), 300);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[FaceProctor] Face scanning stopped.');
  }

  async scanCurrentFrame() {
    if (!this.isRunning || !this.videoElement) return;

    const video = this.videoElement;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    try {
      let faceResult = null;

      if (this.hasNativeDetector && this.nativeDetector) {
        try {
          const faces = await this.nativeDetector.detect(video);
          if (faces.length === 1) {
            faceResult = { valid: true, count: 1, faces };
          } else if (faces.length > 1) {
            faceResult = { valid: false, count: faces.length, error: 'MULTIPLE_FACES', message: 'Multiple faces detected' };
          } else {
            faceResult = { valid: false, count: 0, error: 'NO_FACE', message: 'No face detected' };
          }
        } catch (e) {
          faceResult = null;
        }
      }

      if (!faceResult) {
        faceResult = this.fallbackPixelAnalysis(video);
      }

      this.processResult(faceResult);
    } catch (err) {
      console.error('[FaceProctor] Frame analysis error:', err);
    }
  }

  fallbackPixelAnalysis(video) {
    const width = 160;
    const height = 120;
    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.drawImage(video, 0, 0, width, height);
    const frame = this.ctx.getImageData(0, 0, width, height);
    const data = frame.data;

    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalLuminance += luma;
    }

    const avgLuminance = totalLuminance / pixelCount;

    // Detect camera occlusion (pitch black or blown out)
    if (avgLuminance < 25) {
      return { valid: false, count: 0, error: 'CAMERA_TOO_DARK', message: 'Camera too dark or covered' };
    }
    if (avgLuminance > 240) {
      return { valid: false, count: 0, error: 'CAMERA_BLOWN_OUT', message: 'Excessive lighting or washed out' };
    }

    return { valid: true, count: 1, avgLuminance };
  }

  processResult(result) {
    this.onFrameScanned(result);

    if (result.valid) {
      this.consecutiveFails = 0;
      this.onStatusChange({
        status: 'VALID',
        message: 'Khuôn mặt hợp lệ',
        consecutiveFails: 0,
      });
    } else {
      this.consecutiveFails += 1;
      this.onStatusChange({
        status: 'WARNING',
        message: result.message || 'Cảnh báo không thấy khuôn mặt',
        consecutiveFails: this.consecutiveFails,
        error: result.error,
      });

      // Trigger violation callback when consecutive fail threshold is reached
      if (this.consecutiveFails >= this.toleranceLimit) {
        this.consecutiveFails = 0;
        this.onViolation({
          type: result.error || 'FACE_NOT_FOUND',
          details: `Phát hiện không có mặt hợp lệ liên tục trong 3 giây (${result.message})`,
          timestamp: new Date(),
        });
      }
    }
  }
}
