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
        this.isWaitingForTak = false;
        this.currentBatch = [];
        this.targetBatchSize = 10; // 10 tik-tak pairs
        
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

    startListening() {
        if (!this.audioContext || !this.analyser) {
            throw new Error('Audio processor not initialized');
        }

        this.isListening = true;
        this.lastTickTime = null;
        this.isWaitingForTak = false;
        this.currentBatch = [];
        
        if (!this.isProcessing) {
            this.processAudio();
        }
        console.log(`Started listening for ${this.targetBatchSize} tik-tak pairs`);
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
        
        // Update level indicator
        if (this.onLevelUpdate) {
            this.onLevelUpdate(finalLevel);
        }

        // Debug: log audio levels more frequently for troubleshooting
        if (Math.random() < 0.05) { // 5% of the time
            console.log(`Audio levels - Freq: ${(level * 100).toFixed(1)}%, Time: ${(timeDomainRms * 100).toFixed(1)}%, Final: ${(finalLevel * 100).toFixed(1)}%, Threshold: ${(this.threshold * 100).toFixed(1)}%`);
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

        // Normal measurement mode
        if (!this.isWaitingForTak) {
            // This is a 'tik'
            this.lastTickTime = currentTime;
            this.isWaitingForTak = true;
            
            if (this.onTick) {
                this.onTick('tik', currentTime);
            }
        } else {
            // This is a 'tak'
            const tikTime = this.lastTickTime;
            const takTime = currentTime;
            const interval = takTime - tikTime;
            
            // Add to current batch
            this.addToBatch(tikTime, takTime, interval);
            
            // Reset for next pair
            this.isWaitingForTak = false;
            this.lastTickTime = null;
            
            if (this.onTick) {
                this.onTick('tak', takTime, interval);
            }
            
            // Update progress
            if (this.onProgress) {
                this.onProgress(this.currentBatch.length, this.targetBatchSize);
            }
            
            // Check if batch is complete
            if (this.currentBatch.length >= this.targetBatchSize) {
                this.completeBatch();
            }
        }
    }

    addToBatch(tikTime, takTime, interval) {
        const measurement = {
            tikTime,
            takTime,
            interval,
            timestamp: Date.now()
        };
        
        this.currentBatch.push(measurement);
    }

    completeBatch() {
        // Calculate batch statistics
        const batchAnalysis = this.analyzeBatch(this.currentBatch);
        
        // Trigger callback
        if (this.onBatchComplete) {
            this.onBatchComplete(batchAnalysis);
        }
        
        // Stop listening after batch completion
        this.stopListening();
        
        console.log('Batch completed:', batchAnalysis);
    }

    analyzeBatch(batch) {
        if (batch.length === 0) return null;
        
        // Extract all intervals (these are tik-to-tak intervals)
        const intervals = batch.map(m => m.interval);
        
        // Calculate average interval - this becomes our "target" 
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        // For a perfectly regular clock, all intervals should be identical
        // The total deviation shows how much the timing varies
        const variance = intervals.reduce((sum, interval) => {
            const diff = interval - avgInterval;
            return sum + (diff * diff);
        }, 0) / intervals.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = (standardDeviation / avgInterval) * 100;
        
        // Range-based deviation (max - min)
        const minInterval = Math.min(...intervals);
        const maxInterval = Math.max(...intervals);
        const range = maxInterval - minInterval;
        const rangeDeviation = (range / avgInterval) * 100;
        
        // Use the larger of coefficient of variation or range deviation
        const totalDeviation = Math.max(coefficientOfVariation, rangeDeviation);
        
        // For tik/tak analysis, we need to think about this differently:
        // We're measuring tik-to-tak intervals, not individual tik or tak durations
        // 
        // If we had a way to measure actual tik duration vs tak duration,
        // we could calculate individual deviations. But with our current setup,
        // we can only measure the interval between detections.
        //
        // For now, let's show interval consistency instead of fake tik/tak splits
        
        // Calculate how much each interval deviates from average
        const individualDeviations = intervals.map(interval => 
            ((interval - avgInterval) / avgInterval) * 100
        );
        
        // Show the average positive and negative deviations separately
        const positiveDeviations = individualDeviations.filter(d => d > 0);
        const negativeDeviations = individualDeviations.filter(d => d < 0);
        
        const avgPositiveDeviation = positiveDeviations.length > 0 ? 
            positiveDeviations.reduce((a, b) => a + b, 0) / positiveDeviations.length : 0;
        const avgNegativeDeviation = negativeDeviations.length > 0 ? 
            negativeDeviations.reduce((a, b) => a + b, 0) / negativeDeviations.length : 0;
        
        return {
            batchSize: batch.length,
            avgTikDeviation: avgPositiveDeviation, // Intervals longer than average
            avgTakDeviation: avgNegativeDeviation, // Intervals shorter than average
            totalDeviation: totalDeviation,
            avgInterval: avgInterval * 1000, // Convert to milliseconds
            minInterval: minInterval * 1000,
            maxInterval: maxInterval * 1000,
            standardDeviation: standardDeviation * 1000,
            coefficientOfVariation: coefficientOfVariation,
            rangeDeviation: rangeDeviation,
            measurements: batch,
            timestamp: Date.now()
        };
    }

    reset() {
        this.currentBatch = [];
        this.lastTickTime = null;
        this.isWaitingForTak = false;
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
