import { AudioProcessor } from './audio-processor.js';
import { initI18n, t, setLanguage, getLanguage } from './i18n.js';

class ClockPrecisionApp {
    constructor() {
        initI18n();    
        
        this.audioProcessor = new AudioProcessor();
        this.measurements = [];
        this.isRecording = false;
        this.isCalibrating = false;
        this.currentMeasurementId = 0;
        this.samplingDuration = 10;
        
        this.initializeElements();
        this.applyUIText();
        this.setupEventListeners();
        this.setupAudioCallbacks();
        this.loadCalibrationSettings();
        this.setActiveNavButton(this.metenBtn);
        window.addEventListener('languagechange', () => this.applyUIText());
    }

    initializeElements() {
        // Control buttons (Meten, Kalibreren, Instellingen altijd zichtbaar)
        this.metenBtn = document.getElementById('metenBtn');
        this.calibrateBtn = document.getElementById('calibrateBtn');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        // Settings
        this.settingsPanel = document.getElementById('settingsPanel');
        this.samplingTimeSelect = document.getElementById('samplingTime');
        
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
        this.t1Mean = document.getElementById('t1Mean');
        this.t2Mean = document.getElementById('t2Mean');
        this.balance = document.getElementById('balance');
        this.nrSamples = document.getElementById('nrSamples');
        
        // History
        this.historyList = document.getElementById('measurementHistory');
        
        // Meten sectie (bevat meetknoppen, status, metingen)
        this.metenSection = document.getElementById('metenSection');
        this.measurementsSection = document.getElementById('measurementsSection');
        this.statusSection = document.getElementById('statusSection');
        
        // Calibration factory reset
        this.factoryResetBtn = document.getElementById('factoryResetBtn');
        
        // Language
        this.languageSelect = document.getElementById('languageSelect');

        console.log('Elements initialized. CalibrateBtn:', this.calibrateBtn);
    }

    applyUIText() {
        const set = (id, key) => {
            const el = document.getElementById(id);
            if (el) el.textContent = t(key);
        };
        const setOption = (selectId, value, key) => {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            const opt = sel.querySelector('option[value="' + value + '"]');
            if (opt) opt.textContent = t(key);
        };

        set('appTitle', 'appTitle');
        set('metenBtn', 'btnMeasure');
        set('calibrateBtn', 'btnCalibrate');
        set('settingsBtn', 'btnSettings');
        set('calibrationPanelTitle', 'calibrationTitle');
        set('clockTypeLabel', 'clockType');
        setOption('frequencyPreset', 'small', 'clockSmall');
        setOption('frequencyPreset', 'medium', 'clockMedium');
        setOption('frequencyPreset', 'large', 'clockLarge');
        setOption('frequencyPreset', 'custom', 'clockCustom');
        set('customRangeLabel', 'customRange');
        set('minFreqLabel', 'minFreq');
        set('maxFreqLabel', 'maxFreq');
        set('startCalibrationBtn', 'startTest');
        set('factoryResetBtn', 'factoryReset');
        set('detectedTicksLabel', 'detectedTicks');
        set('timeRemainingLabel', 'timeRemaining');
        set('calibrationAdvice', 'calibrationPlaceMic');
        set('settingsPanelTitle', 'settingsTitle');
        set('languageLabel', 'languageLabel');
        set('settingsIntro', 'settingsIntro');
        set('startBtn', 'startMeasurement');
        set('stopBtn', 'stopMeasurement');
        set('resetBtn', 'reset');
        set('audioLevelLabel', 'audioLevel');
        set('detectionThresholdLabel', 'detectionThreshold');
        set('thresholdSensLeft', 'moreSensitive');
        set('thresholdSensRight', 'lessSensitive');
        set('currentMeasurementTitle', 'currentMeasurement');
        set('progressText', 'readyToStart');
        set('totalDeviationLabel', 'totalDeviation');
        set('longerIntervalsLabel', 'longerIntervals');
        set('shorterIntervalsLabel', 'shorterIntervals');
        set('measurementHistoryTitle', 'measurementHistory');
        set('createdByText', 'createdBy');

        if (this.languageSelect) {
            this.languageSelect.value = getLanguage();
        }
        if (this.startCalibrationBtn && !this.isCalibrating) {
            this.startCalibrationBtn.textContent = t('startTest');
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        if (this.metenBtn) {
            this.metenBtn.addEventListener('click', () => this.showMetenView());
        }
        if (this.calibrateBtn) {
            this.calibrateBtn.addEventListener('click', () => this.showCalibrationView());
        }
        this.startBtn.addEventListener('click', () => this.startMeasurement());
        this.stopBtn.addEventListener('click', () => this.stopMeasurement());
        this.resetBtn.addEventListener('click', () => this.resetMeasurements());
        if (this.settingsBtn && this.settingsPanel) {
            this.settingsBtn.addEventListener('click', () => this.showSettingsView());
        }

        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (e) => {
                setLanguage(e.target.value);
            });
        }
        
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

        if (this.samplingTimeSelect) {
            this.samplingTimeSelect.addEventListener('change', (e) => {
                this.samplingDuration = parseInt(e.target.value);
                localStorage.setItem('clockapp_samplingTime', e.target.value);
            });
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
        const samplingTime = localStorage.getItem('clockapp_samplingTime');

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

        if (samplingTime !== null && this.samplingTimeSelect) {
            this.samplingTimeSelect.value = samplingTime;
            this.samplingDuration = parseInt(samplingTime);
        }
    }

    saveCalibrationSettings() {
        localStorage.setItem('clockapp_frequencyPreset', this.frequencyPreset.value);
        localStorage.setItem('clockapp_threshold', this.thresholdSlider.value);
    }

    factoryReset() {
        localStorage.removeItem('clockapp_frequencyPreset');
        localStorage.removeItem('clockapp_threshold');
        localStorage.removeItem('clockapp_samplingTime');

        if (this.frequencyPreset) {
            this.frequencyPreset.value = 'medium';
            this.audioProcessor.setFrequencyPreset('medium');
            if (this.customFreqGroup) {
                this.customFreqGroup.style.display = 'none';
            }
        }

        this.thresholdSlider.value = 30;
        this.updateThreshold(30);

        if (this.samplingTimeSelect) {
            this.samplingTimeSelect.value = '10';
            this.samplingDuration = 10;
        }
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
        this.audioProcessor.onProgress = (clickCount, elapsed, remaining) => {
            const percentage = Math.min((elapsed / this.samplingDuration) * 100, 100);
            this.progressFill.style.width = percentage + '%';            
            this.progressText.textContent = t('progressPairs', { current, total });
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

    setActiveNavButton(activeBtn) {
        [this.metenBtn, this.calibrateBtn, this.settingsBtn].forEach((btn) => {
            if (btn) btn.classList.toggle('active', btn === activeBtn);
        });
    }

    /** Toon alleen de meten-sectie. */
    showMetenView() {
        if (this.calibrationPanel) this.calibrationPanel.style.display = 'none';
        if (this.settingsPanel) this.settingsPanel.style.display = 'none';
        if (this.metenSection) this.metenSection.style.display = '';
        this.setActiveNavButton(this.metenBtn);
    }

    /** Toon alleen de kalibratie-sectie. */
    showCalibrationView() {
        if (this.calibrationPanel) this.calibrationPanel.style.display = 'block';
        if (this.settingsPanel) this.settingsPanel.style.display = 'none';
        if (this.metenSection) this.metenSection.style.display = 'none';
        this.setActiveNavButton(this.calibrateBtn);
    }

    /** Toon alleen de instellingen-sectie. */
    showSettingsView() {
        if (this.calibrationPanel) this.calibrationPanel.style.display = 'none';
        if (this.settingsPanel) this.settingsPanel.style.display = 'block';
        if (this.metenSection) this.metenSection.style.display = 'none';
        this.setActiveNavButton(this.settingsBtn);
    }

    updateCustomFrequency() {
        const minHz = parseInt(this.minFreq.value) || 800;
        const maxHz = parseInt(this.maxFreq.value) || 3000;
        
        if (minHz >= maxHz) {
            this.calibrationAdvice.textContent = t('minFreqError');
            this.calibrationAdvice.className = 'calibration-advice error';
            return;
        }
        
        this.audioProcessor.setCustomFrequencyRange(minHz, maxHz);
        this.calibrationAdvice.textContent = t('customRangeSet', { min: minHz, max: maxHz });
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
            this.startCalibrationBtn.textContent = t('stopTest');
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
            
            this.calibrationAdvice.textContent = t('testStarted');
            this.calibrationAdvice.className = 'calibration-advice';
            
        } catch (error) {
            console.error('Failed to start calibration:', error);
            alert(t('micError') + error.message);
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
        this.startCalibrationBtn.textContent = t('startTest');
        this.startCalibrationBtn.classList.remove('secondary');
        this.startCalibrationBtn.classList.add('primary');
        this.tickCounter.textContent = '0';
        this.timeRemaining.textContent = t('startTestTime');
    }

    processCalibrationResult(result) {
        const tickCount = result.tickCount;
        const ticksPerSecond = result.ticksPerSecond;
        
        // Provide advice based on results
        let advice;
        let adviceClass;
        
        if (tickCount === 0) {
            advice = t('noTicks');
            adviceClass = 'calibration-advice error';
        } else if (tickCount < 10) {
            advice = t('tooFewTicks', { count: tickCount });
            adviceClass = 'calibration-advice warning';
        } else if (tickCount > 30) {
            advice = t('tooManyTicks', { count: tickCount });
            adviceClass = 'calibration-advice warning';
        } else {
            advice = t('goodTicks', { count: tickCount, perSecond: ticksPerSecond.toFixed(1) });
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
            this.startBtn.textContent = t('initializing');
            
            // Initialize audio processor if not already done
            if (!this.audioProcessor.audioContext) {
                await this.audioProcessor.initialize();
            }
            
            // Start listening
            this.audioProcessor.startListening(this.samplingDuration);
            this.isRecording = true;
            
            // Update UI to show progress
            this.showProgressMode();
            
            console.log('Batch measurement started');
        } catch (error) {
            console.error('Failed to start measurement:', error);
            alert(t('micError') + error.message);
            
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
        this.progressText.textContent = t('readyToStart');
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
        this.progressText.textContent = t('listening');
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
        this.startBtn.textContent = t('startMeasurement');
    }

    processBatchResult(analysis) {
        this.currentMeasurementId++;
        
        // Add to measurements history
        const measurement = {
            id: this.currentMeasurementId,
            t1Mean: analysis.t1Mean,
            t2Mean: analysis.t2Mean,
            balance: analysis.balance,
            nrSamples: analysis.nrSamples,
            timestamp: analysis.timestamp
        };
        
        this.measurements.push(measurement);
        
        // Show result
        this.showResultMode(analysis);
        
        // Add to history display
        this.addToHistory(measurement);
        
        console.log('Measurement result processed:', analysis);
    }

    updateResultDisplay(analysis) {
        this.t1Mean.textContent = analysis.t1Mean.toFixed(1) + ' ms';
        this.t2Mean.textContent = analysis.t2Mean.toFixed(1) + ' ms';

        this.balance.textContent = analysis.balance.toFixed(1) + '%';
        this.balance.classList.remove('good', 'moderate', 'poor');
        if (analysis.balance >= 95) {
            this.balance.classList.add('good');
        } else if (analysis.balance >= 85) {
            this.balance.classList.add('moderate');
        } else {
            this.balance.classList.add('poor');
        }

        this.nrSamples.textContent = analysis.nrSamples;
    }

    addToHistory(measurement) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(measurement.timestamp);
        const locale = getLanguage() === 'nl' ? 'nl-NL' : 'en-GB';
        const timeString = date.toLocaleTimeString(locale, { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        let balClass = 'good';
        if (measurement.balance < 85) balClass = 'poor';
        else if (measurement.balance < 95) balClass = 'moderate';
        
        historyItem.innerHTML = 
            '<div class="index">#' + measurement.id + '</div>' +
            '<div class="timestamp">' + timeString + '</div>' +
            '<div class="total-dev ' + balClass + '">' + measurement.balance.toFixed(1) + '%</div>' +
            '<div class="breakdown">' +
                't1: ' + measurement.t1Mean.toFixed(1) + 'ms | ' +
                't2: ' + measurement.t2Mean.toFixed(1) + 'ms | ' +
                'n=' + measurement.nrSamples +
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
        
        const balances = this.measurements.map(m => m.balance);
        
        return {
            count: this.measurements.length,
            avgBalance: balances.reduce((a, b) => a + b, 0) / balances.length,
            bestBalance: Math.max(...balances),
            worstBalance: Math.min(...balances)
        };
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.clockApp = new ClockPrecisionApp();
    console.log('Clock Precision App initialized');
});