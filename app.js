import { AudioProcessor } from './audio-processor.js'

class ClockPrecisionApp {
    constructor() {
        this.audioProcessor = new AudioProcessor();
        this.measurements = [];
        this.isRecording = false;
        this.isCalibrating = false;
        this.currentMeasurementId = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupAudioCallbacks();
        this.loadCalibrationSettings();
    }

    initializeElements() {
        // Control buttons
        this.calibrateBtn = document.getElementById('calibrateBtn');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Calibration elements
        this.calibrationPanel = document.getElementById('calibrationPanel');
        this.frequencyPreset = document.getElementById('frequencyPreset');
        this.customFreqGroup = document.getElementById('customFreqGroup');
        this.minFreq = document.getElementById('minFreq');
        this.maxFreq = document.getElementById('maxFreq');
        this.startCalibrationBtn = document.getElementById('startCalibrationBtn');
        this.tickCounter = document.getElementById('tickCounter');
        this.timeRemaining = document.getElementById('timeRemaining');
        this.calibrationAdvice = document.getElementById('calibrationAdvice');
        
        // Audio controls
        this.thresholdSlider = document.getElementById('threshold');
        this.thresholdValue = document.getElementById('thresholdValue');
        this.levelIndicator = document.getElementById('levelIndicator');
        this.peakIndicator = document.getElementById('peakIndicator');
        this.thresholdDown5 = document.getElementById('thresholdDown5');
        this.thresholdDown1 = document.getElementById('thresholdDown1');
        this.thresholdUp1 = document.getElementById('thresholdUp1');
        this.thresholdUp5 = document.getElementById('thresholdUp5');
        
        // Progress display
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.measurementProgress = document.getElementById('measurementProgress');
        
        // Result display
        this.currentResult = document.getElementById('currentResult');
        this.totalDeviation = document.getElementById('totalDeviation');
        this.avgTikDeviation = document.getElementById('avgTikDeviation');
        this.avgTakDeviation = document.getElementById('avgTakDeviation');
        
        // History
        this.historyList = document.getElementById('measurementHistory');
        
        // Measurements section
        this.measurementsSection = document.getElementById('measurementsSection');
        
        // Calibration factory reset
        this.factoryResetBtn = document.getElementById('factoryResetBtn');
        
        console.log('Elements initialized. CalibrateBtn:', this.calibrateBtn);
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        if (this.calibrateBtn) {
            this.calibrateBtn.addEventListener('click', () => {
                console.log('Calibrate button clicked!');
                this.toggleCalibration();
            });
            console.log('Calibrate button listener added');
        } else {
            console.error('calibrateBtn not found!');
        }
        
        this.startBtn.addEventListener('click', () => this.startMeasurement());
        this.stopBtn.addEventListener('click', () => this.stopMeasurement());
        this.resetBtn.addEventListener('click', () => this.resetMeasurements());
        
        // Calibration controls
        if (this.startCalibrationBtn) {
            this.startCalibrationBtn.addEventListener('click', () => this.toggleCalibrationTest());
        }
        
        if (this.frequencyPreset) {
            this.frequencyPreset.addEventListener('change', (e) => {
                const preset = e.target.value;
                this.audioProcessor.setFrequencyPreset(preset);
                if (this.customFreqGroup) {
                    this.customFreqGroup.style.display = preset === 'custom' ? 'block' : 'none';
                }
            });
        }
        
        if (this.minFreq) {
            this.minFreq.addEventListener('change', () => this.updateCustomFrequency());
        }
        if (this.maxFreq) {
            this.maxFreq.addEventListener('change', () => this.updateCustomFrequency());
        }
        
        if (this.factoryResetBtn) {
            this.factoryResetBtn.addEventListener('click', () => this.factoryReset());
        }

        this.thresholdSlider.addEventListener('input', (e) => {
            this.updateThreshold(parseInt(e.target.value));
        });

        const adjustThreshold = (delta) => {
            const next = Math.min(100, Math.max(0, parseInt(this.thresholdSlider.value) + delta));
            this.thresholdSlider.value = next;
            this.updateThreshold(next);
        };

        this.thresholdDown5.addEventListener('click', () => adjustThreshold(-5));
        this.thresholdDown1.addEventListener('click', () => adjustThreshold(-1));
        this.thresholdUp1.addEventListener('click', () => adjustThreshold(1));
        this.thresholdUp5.addEventListener('click', () => adjustThreshold(5));
    }

    updateThreshold(value) {
        this.thresholdValue.textContent = value + '%';
        this.audioProcessor.setThreshold(value);
    }

    loadCalibrationSettings() {
        const preset = localStorage.getItem('clockapp_frequencyPreset');
        const threshold = localStorage.getItem('clockapp_threshold');

        if (preset && this.frequencyPreset) {
            this.frequencyPreset.value = preset;
            this.audioProcessor.setFrequencyPreset(preset);
            if (this.customFreqGroup) {
                this.customFreqGroup.style.display = preset === 'custom' ? 'block' : 'none';
            }
        }

        if (threshold !== null && this.thresholdSlider) {
            const value = parseInt(threshold);
            this.thresholdSlider.value = value;
            this.updateThreshold(value);
        }
    }

    saveCalibrationSettings() {
        localStorage.setItem('clockapp_frequencyPreset', this.frequencyPreset.value);
        localStorage.setItem('clockapp_threshold', this.thresholdSlider.value);
    }

    factoryReset() {
        localStorage.removeItem('clockapp_frequencyPreset');
        localStorage.removeItem('clockapp_threshold');

        if (this.frequencyPreset) {
            this.frequencyPreset.value = 'medium';
            this.audioProcessor.setFrequencyPreset('medium');
            if (this.customFreqGroup) {
                this.customFreqGroup.style.display = 'none';
            }
        }

        this.thresholdSlider.value = 30;
        this.updateThreshold(30);
    }

    setupAudioCallbacks() {
        // Audio level updates
        this.audioProcessor.onLevelUpdate = (level, peakLevel) => {
            const percentage = Math.round(level * 100);
            this.levelIndicator.style.width = Math.min(percentage, 100) + '%';

            // Update peak indicator stripe
            if (peakLevel > 0) {
                // Cap at 97% to keep the 3px stripe fully visible within the level bar container
                const peakPercentage = Math.min(Math.round(peakLevel * 100), 97);
                this.peakIndicator.style.display = 'block';
                this.peakIndicator.style.left = peakPercentage + '%';
            } else {
                this.peakIndicator.style.display = 'none';
            }
        };

        // Tick detection feedback
        this.audioProcessor.onTick = (type, time) => {
            console.log('Detected ' + type + ' at ' + time.toFixed(3) + 's');
        };

        // Progress updates
        this.audioProcessor.onProgress = (current, total) => {
            const percentage = (current / total) * 100;
            this.progressFill.style.width = percentage + '%';
            this.progressText.textContent = current + '/' + total + ' tik-tak paren gedetecteerd';
        };

        // Batch completion
        this.audioProcessor.onBatchComplete = (analysis) => {
            this.processBatchResult(analysis);
        };

        // Calibration updates
        this.audioProcessor.onCalibrationUpdate = (update) => {
            if (update.tickCount !== undefined) {
                this.tickCounter.textContent = update.tickCount.toString();
            }
            
            if (update.remaining !== undefined) {
                this.timeRemaining.textContent = Math.ceil(update.remaining) + 's';
            }
            
            // If calibration is complete
            if (update.duration !== undefined) {
                this.processCalibrationResult(update);
                this.resetCalibrationUI();
            }
        };
    }

    toggleCalibration() {
        console.log('toggleCalibration called');
        console.log('calibrationPanel:', this.calibrationPanel);
        
        if (!this.calibrationPanel) {
            console.error('calibrationPanel not found!');
            return;
        }
        
        const isVisible = this.calibrationPanel.style.display !== 'none';
        console.log('Current display:', this.calibrationPanel.style.display, 'isVisible:', isVisible);
        
        if (isVisible) {
            // Switch back to measurement screen
            this.calibrationPanel.style.display = 'none';
            this.calibrateBtn.textContent = 'Kalibreren';
            this.startBtn.style.display = '';
            this.stopBtn.style.display = '';
            this.resetBtn.style.display = '';
            if (this.measurementsSection) {
                this.measurementsSection.style.display = '';
            }
        } else {
            // Switch to calibration screen
            this.calibrationPanel.style.display = 'block';
            this.calibrateBtn.textContent = 'Meten';
            this.startBtn.style.display = 'none';
            this.stopBtn.style.display = 'none';
            this.resetBtn.style.display = 'none';
            if (this.measurementsSection) {
                this.measurementsSection.style.display = 'none';
            }
        }
        
        console.log('New display:', this.calibrationPanel.style.display);
    }

    updateCustomFrequency() {
        const minHz = parseInt(this.minFreq.value) || 800;
        const maxHz = parseInt(this.maxFreq.value) || 3000;
        
        if (minHz >= maxHz) {
            this.calibrationAdvice.textContent = 'Minimum frequentie moet lager zijn dan maximum';
            this.calibrationAdvice.className = 'calibration-advice error';
            return;
        }
        
        this.audioProcessor.setCustomFrequencyRange(minHz, maxHz);
        this.calibrationAdvice.textContent = 'Aangepast bereik: ' + minHz + '-' + maxHz + ' Hz';
        this.calibrationAdvice.className = 'calibration-advice';
    }

    toggleCalibrationTest() {
        if (this.isCalibrating) {
            this.stopCalibrationTest();
        } else {
            this.startCalibrationTest();
        }
    }

    async startCalibrationTest() {
        try {
            this.isCalibrating = true;
            this.startCalibrationBtn.textContent = 'Stop Test';
            this.startCalibrationBtn.classList.remove('primary');
            this.startCalibrationBtn.classList.add('secondary');
            
            // Initialize audio processor if not already done
            if (!this.audioProcessor.audioContext) {
                await this.audioProcessor.initialize();
            }
            
            // Set frequency preset
            this.audioProcessor.setFrequencyPreset(this.frequencyPreset.value);
            
            // Start calibration
            this.audioProcessor.startCalibration(10);
            
            this.calibrationAdvice.textContent = 'Test gestart! Laat de klok tikken...';
            this.calibrationAdvice.className = 'calibration-advice';
            
        } catch (error) {
            console.error('Failed to start calibration:', error);
            alert('Kon geen toegang krijgen tot de microfoon. Fout: ' + error.message);
            this.resetCalibrationUI();
        }
    }

    stopCalibrationTest() {
        const result = this.audioProcessor.stopCalibration();
        this.processCalibrationResult(result);
        this.resetCalibrationUI();
    }

    resetCalibrationUI() {
        this.isCalibrating = false;
        this.startCalibrationBtn.textContent = 'Start Test (10s)';
        this.startCalibrationBtn.classList.remove('secondary');
        this.startCalibrationBtn.classList.add('primary');
        this.tickCounter.textContent = '0';
        this.timeRemaining.textContent = '10s';
    }

    processCalibrationResult(result) {
        const tickCount = result.tickCount;
        const ticksPerSecond = result.ticksPerSecond;
        
        // Provide advice based on results
        let advice;
        let adviceClass;
        
        if (tickCount === 0) {
            advice = 'Geen tikken gedetecteerd. Verhoog het volume of verlaag de drempel.';
            adviceClass = 'calibration-advice error';
        } else if (tickCount < 10) {
            advice = tickCount + ' tikken gedetecteerd. Te weinig - verlaag de drempel of plaats microfoon dichter bij de klok.';
            adviceClass = 'calibration-advice warning';
        } else if (tickCount > 30) {
            advice = tickCount + ' tikken gedetecteerd. Te veel - verhoog de drempel om ruis te verminderen.';
            adviceClass = 'calibration-advice warning';
        } else {
            advice = tickCount + ' tikken gedetecteerd (' + ticksPerSecond.toFixed(1) + '/s). Goede instelling!';
            adviceClass = 'calibration-advice';
            this.saveCalibrationSettings();
        }
        
        this.calibrationAdvice.textContent = advice;
        this.calibrationAdvice.className = adviceClass;
        
        console.log('Calibration result:', result);
    }

    async startMeasurement() {
        try {
            this.startBtn.disabled = true;
            this.startBtn.textContent = 'Initialiseren...';
            
            // Initialize audio processor if not already done
            if (!this.audioProcessor.audioContext) {
                await this.audioProcessor.initialize();
            }
            
            // Start listening
            this.audioProcessor.startListening();
            this.isRecording = true;
            
            // Update UI to show progress
            this.showProgressMode();
            
            console.log('Batch measurement started');
        } catch (error) {
            console.error('Failed to start measurement:', error);
            alert('Kon geen toegang krijgen tot de microfoon. Fout: ' + error.message);
            
            // Reset UI
            this.resetUIToStart();
        }
    }

    stopMeasurement() {
        this.audioProcessor.stopListening();
        this.isRecording = false;
        
        // Reset UI
        this.resetUIToStart();
        
        console.log('Measurement stopped');
    }

    resetMeasurements() {
        this.measurements = [];
        this.audioProcessor.reset();
        this.historyList.innerHTML = '';
        this.currentMeasurementId = 0;
        
        // Reset displays
        this.hideResult();
        this.progressText.textContent = 'Klaar om te starten';
        this.progressFill.style.width = '0%';
        
        console.log('All measurements reset');
    }

    showProgressMode() {
        // Hide result, show progress
        this.currentResult.style.display = 'none';
        this.measurementProgress.style.display = 'block';
        
        // Update button states
        this.startBtn.style.display = 'none';
        this.stopBtn.disabled = false;
        this.stopBtn.style.display = 'inline-block';
        
        // Initialize progress
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Luisteren naar klok tikken...';
    }

    showResultMode(analysis) {
        // Hide progress, show result
        this.measurementProgress.style.display = 'none';
        this.currentResult.style.display = 'block';
        
        // Update result display
        this.updateResultDisplay(analysis);
        
        // Reset button to start state
        this.resetUIToStart();
    }

    hideResult() {
        this.currentResult.style.display = 'none';
        this.measurementProgress.style.display = 'block';
    }

    resetUIToStart() {
        this.stopBtn.disabled = true;
        this.stopBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-block';
        this.startBtn.disabled = false;
        this.startBtn.textContent = 'Start Meting';
    }

    processBatchResult(analysis) {
        this.currentMeasurementId++;
        
        // Add to measurements history
        const measurement = {
            id: this.currentMeasurementId,
            batchSize: analysis.batchSize,
            avgTikDeviation: analysis.avgTikDeviation,
            avgTakDeviation: analysis.avgTakDeviation,
            totalDeviation: analysis.totalDeviation,
            avgInterval: analysis.avgInterval,
            timestamp: Date.now()
        };
        
        this.measurements.push(measurement);
        
        // Show result
        this.showResultMode(analysis);
        
        // Add to history display
        this.addToHistory(measurement);
        
        console.log('Batch result processed:', analysis);
    }

    updateResultDisplay(analysis) {
        const totalDeviation = analysis.totalDeviation;
        const avgTikDeviation = analysis.avgTikDeviation;
        const avgTakDeviation = analysis.avgTakDeviation;
        
        // Update total deviation
        this.totalDeviation.textContent = totalDeviation.toFixed(1) + '%';
        
        // Color code based on deviation level
        this.totalDeviation.classList.remove('good', 'moderate', 'poor');
        if (totalDeviation < 2) {
            this.totalDeviation.classList.add('good');
        } else if (totalDeviation < 5) {
            this.totalDeviation.classList.add('moderate');
        } else {
            this.totalDeviation.classList.add('poor');
        }
        
        // Update individual deviations
        this.updateDeviationDisplay(this.avgTikDeviation, avgTikDeviation);
        this.updateDeviationDisplay(this.avgTakDeviation, avgTakDeviation);
    }

    updateDeviationDisplay(element, deviation) {
        const sign = deviation > 0 ? '+' : '';
        element.textContent = sign + deviation.toFixed(1) + '%';
        
        element.classList.remove('positive', 'negative');
        if (deviation > 0) {
            element.classList.add('positive');
        } else if (deviation < 0) {
            element.classList.add('negative');
        }
    }

    addToHistory(measurement) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const id = measurement.id;
        const totalDeviation = measurement.totalDeviation;
        const avgTikDeviation = measurement.avgTikDeviation;
        const avgTakDeviation = measurement.avgTakDeviation;
        const timestamp = measurement.timestamp;
        
        // Format timestamp
        const date = new Date(timestamp);
        const timeString = date.toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Determine deviation class
        let devClass = 'good';
        if (totalDeviation >= 5) devClass = 'poor';
        else if (totalDeviation >= 2) devClass = 'moderate';
        
        const tikSign = avgTikDeviation > 0 ? '+' : '';
        const takSign = avgTakDeviation < 0 ? '' : '+';
        
        historyItem.innerHTML = 
            '<div class="index">#' + id + '</div>' +
            '<div class="timestamp">' + timeString + '</div>' +
            '<div class="total-dev ' + devClass + '">' + totalDeviation.toFixed(1) + '%</div>' +
            '<div class="breakdown">' +
                'Lang: ' + tikSign + avgTikDeviation.toFixed(1) + '% | ' +
                'Kort: ' + takSign + avgTakDeviation.toFixed(1) + '%' +
            '</div>';
        
        // Add to top of history
        this.historyList.insertBefore(historyItem, this.historyList.firstChild);
        
        // Limit history to 20 items
        while (this.historyList.children.length > 20) {
            this.historyList.removeChild(this.historyList.lastChild);
        }
    }

    getOverallStatistics() {
        if (this.measurements.length === 0) return null;
        
        const totalDeviations = this.measurements.map(m => m.totalDeviation);
        const tikDeviations = this.measurements.map(m => m.avgTikDeviation);
        const takDeviations = this.measurements.map(m => m.avgTakDeviation);
        
        return {
            count: this.measurements.length,
            avgTotalDeviation: totalDeviations.reduce((a, b) => a + b, 0) / totalDeviations.length,
            avgTikDeviation: tikDeviations.reduce((a, b) => a + b, 0) / tikDeviations.length,
            avgTakDeviation: takDeviations.reduce((a, b) => a + b, 0) / takDeviations.length,
            bestMeasurement: Math.min(...totalDeviations),
            worstMeasurement: Math.max(...totalDeviations)
        };
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.clockApp = new ClockPrecisionApp();
    console.log('Clock Precision App initialized');
});