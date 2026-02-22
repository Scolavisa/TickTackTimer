class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.dataArray = null;
        this.frequencyData = null;
        this.isListening = false;
        this.threshold = 0.3; // 30% default threshold
        
        // Frequency band settings for different clock types
        this.frequencyPresets = {
            'small': { min: 1000, max: 4000, name: 'Kleine Klok (1-4kHz)' },
            'medium': { min: 800, max: 3000, name: 'Gemiddelde Klok (0.8-3kHz)' },
            'large': { min: 500, max: 2000, name: 'Grote Klok (0.5-2kHz)' },
            'custom': { min: 800, max: 3000, name: 'Aangepast' }
        };
        this.currentPreset = 'medium';
        
        // Calibration mode
        this.isCalibrating = false;
        this.calibrationStartTime = null;
        this.calibrationTicks = 0;
        this.calibrationDuration = 10; // seconds
        
        // Tick detection state
        this.lastTickTime = null;
        this.clickTimes = [];
        this.measurementStartTime = null;
        this._measurementTimer = null;
        this._lastProgressTime = null;
        
        // Peak level tracking for peak meter
        this.peakLevel = 0;
        this.peakHoldStartTime = null;
        this.peakHoldDuration = 1500; // ms to hold peak before decaying
        this.peakDecayRate = 0.003; // decay per animation frame (frame-rate dependent; ~0.18/s at 60 fps, faster on high-refresh displays)

        // Callbacks
        this.onTick = null;
        this.onLevelUpdate = null;
        this.onBatchComplete = null;
        this.onProgress = null;
        this.onCalibrationUpdate = null;
        this.isProcessing = false;
    }

    async initialize() {
        if (this.audioContext) {
            console.log('Audio processor already initialized, resuming context');
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            return true;
        }

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                } 
            });
            
            console.log('Microphone stream obtained:', stream);
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            // Create analyser for audio level detection
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.1;
            
            // Connect microphone to analyser
            this.microphone.connect(this.analyser);
            
            // Create data arrays - IMPORTANT: use correct array types
            this.dataArray = new Uint8Array(this.analyser.fftSize); // For time domain
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount); // For frequency domain
            
            console.log('Audio processor initialized successfully');
            console.log('FFT Size:', this.analyser.fftSize);
            console.log('Frequency bins:', this.analyser.frequencyBinCount);
            console.log('Sample rate:', this.audioContext.sampleRate);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio processor:', error);
            throw error;
        }
    }

    startListening(samplingDuration = 10) {
        if (!this.audioContext || !this.analyser) {
            throw new Error('Audio processor not initialized');
        }

        this.isListening = true;
        this.clickTimes = [];
        this.lastTickTime = null;
        this.samplingDuration = samplingDuration;
        this.measurementStartTime = this.audioContext.currentTime;
        this._lastProgressTime = null;

        // Schedule automatic completion after sampling duration
        this._measurementTimer = setTimeout(() => this.completeMeasurement(), samplingDuration * 1000);

        if (!this.isProcessing) {
            this.processAudio();
        }
        console.log(`Started listening for ${samplingDuration} seconds`);
    }

    startCalibration(duration = 10) {
        if (!this.audioContext || !this.analyser) {
            throw new Error('Audio processor not initialized');
        }

        this.isCalibrating = true;
        this.isListening = true;
        this.calibrationStartTime = this.audioContext.currentTime;
        this.calibrationTicks = 0;
        this.calibrationDuration = duration;
        this.lastTickTime = null;
        
        if (!this.isProcessing) {
            this.processAudio();
        }
        console.log(`Started calibration for ${duration} seconds`);
    }

    stopCalibration() {
        this.isCalibrating = false;
        this.isListening = false;
        console.log(`Calibration stopped. Detected ${this.calibrationTicks} ticks`);
        return {
            tickCount: this.calibrationTicks,
            duration: this.calibrationDuration,
            ticksPerSecond: this.calibrationTicks / this.calibrationDuration
        };
    }

    setFrequencyPreset(presetName) {
        if (this.frequencyPresets[presetName]) {
            this.currentPreset = presetName;
            console.log(`Frequency preset set to: ${this.frequencyPresets[presetName].name}`);
        }
    }

    setCustomFrequencyRange(minHz, maxHz) {
        this.frequencyPresets.custom.min = minHz;
        this.frequencyPresets.custom.max = maxHz;
        this.currentPreset = 'custom';
        console.log(`Custom frequency range set: ${minHz}-${maxHz} Hz`);
    }

    getCurrentFrequencyRange() {
        return this.frequencyPresets[this.currentPreset];
    }

    stopListening() {
        this.isListening = false;
        if (this._measurementTimer) {
            clearTimeout(this._measurementTimer);
            this._measurementTimer = null;
        }
        console.log('Stopped listening for ticks');
    }

    setThreshold(threshold) {
        this.threshold = threshold / 100; // Convert percentage to decimal
    }

    processAudio() {
        if (!this.isListening) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        // Get current audio data
        this.analyser.getByteTimeDomainData(this.dataArray);
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Calculate RMS using frequency data (more reliable for level detection)
        let sum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i] * this.frequencyData[i];
        }
        const rms = Math.sqrt(sum / this.frequencyData.length);
        const level = rms / 255; // Normalize to 0-1
        
        // Alternative: calculate RMS from time domain data
        let timeDomainSum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const sample = (this.dataArray[i] - 128) / 128;
            timeDomainSum += sample * sample;
        }
        const timeDomainRms = Math.sqrt(timeDomainSum / this.dataArray.length);
        
        // Use the higher of the two for better detection
        const finalLevel = Math.max(level, timeDomainRms);
        
        // Update peak level with hold and decay
        const now = performance.now();
        if (finalLevel >= this.peakLevel) {
            this.peakLevel = finalLevel;
            this.peakHoldStartTime = now;
        } else if (this.peakHoldStartTime !== null && (now - this.peakHoldStartTime) > this.peakHoldDuration) {
            this.peakLevel = Math.max(0, this.peakLevel - this.peakDecayRate);
            if (this.peakLevel === 0) {
                this.peakHoldStartTime = null;
            }
        }

        // Update level indicator
        if (this.onLevelUpdate) {
            this.onLevelUpdate(finalLevel, this.peakLevel);
        }

        // Debug: log audio levels more frequently for troubleshooting
        if (Math.random() < 0.05) { // 5% of the time
            console.log(`Audio levels - Freq: ${(level * 100).toFixed(1)}%, Time: ${(timeDomainRms * 100).toFixed(1)}%, Final: ${(finalLevel * 100).toFixed(1)}%, Threshold: ${(this.threshold * 100).toFixed(1)}%`);
        }

        // Update progress during measurement (throttled to ~10 updates/s)
        if (!this.isCalibrating && this.measurementStartTime !== null) {
            const nowAudio = this.audioContext.currentTime;
            if (!this._lastProgressTime || (nowAudio - this._lastProgressTime) >= 0.1) {
                this._lastProgressTime = nowAudio;
                const elapsed = nowAudio - this.measurementStartTime;
                const remaining = Math.max(0, this.samplingDuration - elapsed);
                if (this.onProgress) {
                    this.onProgress(this.clickTimes.length, elapsed, remaining);
                }
            }
        }

        // Check for tick detection
        if (finalLevel > this.threshold) {
            console.log(`Tick detected! Level: ${(finalLevel * 100).toFixed(1)}%`);
            this.detectTick();
        }

        // Continue processing
        requestAnimationFrame(() => this.processAudio());
    }

    detectTick() {
        const currentTime = this.audioContext.currentTime;
        
        // Debounce: ignore ticks that are too close together (< 100ms)
        if (this.lastTickTime && (currentTime - this.lastTickTime) < 0.1) {
            return;
        }

        if (this.isCalibrating) {
            // Calibration mode: just count ticks
            this.calibrationTicks++;
            this.lastTickTime = currentTime;
            
            // Check if calibration time is up
            const elapsed = currentTime - this.calibrationStartTime;
            if (elapsed >= this.calibrationDuration) {
                const result = this.stopCalibration();
                if (this.onCalibrationUpdate) {
                    this.onCalibrationUpdate(result);
                }
                return;
            }
            
            // Update calibration progress
            if (this.onCalibrationUpdate) {
                this.onCalibrationUpdate({
                    tickCount: this.calibrationTicks,
                    elapsed: elapsed,
                    remaining: this.calibrationDuration - elapsed
                });
            }
            
            return;
        }

        // Normal measurement mode: record click timestamp
        this.clickTimes.push(currentTime);
        this.lastTickTime = currentTime;

        if (this.onTick) {
            this.onTick('click', currentTime);
        }
    }

    completeMeasurement() {
        this.isListening = false;
        if (this._measurementTimer) {
            clearTimeout(this._measurementTimer);
            this._measurementTimer = null;
        }

        const analysis = this.analyzeMeasurement(this.clickTimes);

        if (this.onBatchComplete) {
            this.onBatchComplete(analysis);
        }

        console.log('Measurement completed:', analysis);
    }

    analyzeMeasurement(clickTimes) {
        let times = [...clickTimes];

        // Assignment 2: discard last click when even count so t1 and t2 have equal samples
        if (times.length % 2 === 0) {
            times = times.slice(0, -1);
        }

        // Need at least 3 clicks: one t1 sample (clicks 0→1) and one t2 sample (clicks 1→2)
        if (times.length < 3) {
            return { t1Mean: 0, t2Mean: 0, balance: 0, nrSamples: 0, timestamp: Date.now() };
        }

        const t1Samples = [];
        const t2Samples = [];

        for (let i = 0; i + 1 < times.length; i += 2) {
            t1Samples.push(times[i + 1] - times[i]);
            if (i + 2 < times.length) {
                t2Samples.push(times[i + 2] - times[i + 1]);
            }
        }

        const t1Mean = t1Samples.reduce((a, b) => a + b, 0) / t1Samples.length;
        const t2Mean = t2Samples.reduce((a, b) => a + b, 0) / t2Samples.length;
        const maxMean = Math.max(t1Mean, t2Mean);
        const balance = maxMean > 0 ? (Math.min(t1Mean, t2Mean) / maxMean) * 100 : 0;

        return {
            t1Mean: t1Mean * 1000,  // convert to milliseconds
            t2Mean: t2Mean * 1000,  // convert to milliseconds
            balance: balance,
            nrSamples: t1Samples.length,
            timestamp: Date.now()
        };
    }

    reset() {
        this.clickTimes = [];
        this.lastTickTime = null;
        this.measurementStartTime = null;
        this._lastProgressTime = null;
        if (this._measurementTimer) {
            clearTimeout(this._measurementTimer);
            this._measurementTimer = null;
        }
        this.peakLevel = 0;
        this.peakHoldStartTime = null;
    }

    destroy() {
        this.stopListening();
        
        if (this.microphone) {
            this.microphone.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
export { AudioProcessor };
