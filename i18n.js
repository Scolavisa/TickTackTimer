/**
 * Simple i18n for Tick Tack Timer: English (en) and Dutch (nl).
 * Initial language: localStorage → browser language → fallback 'en'.
 */

const STORAGE_KEY = 'clockapp_lang';
const SUPPORTED = ['en', 'nl'];

const translations = {
    en: {
        appTitle: 'Tick Tack Timer',
        btnMeasure: 'Measure',
        btnCalibrate: 'Calibrate',
        btnSettings: 'Settings',
        calibrationTitle: 'Calibration Mode',
        clockSmall: 'Small Clock (1-4kHz)',
        clockMedium: 'Medium Clock (0.8-3kHz)',
        clockLarge: 'Large Clock (0.5-2kHz)',
        clockCustom: 'Custom',
        customRange: 'Custom Range:',
        minFreq: 'Min:',
        maxFreq: 'Max:',
        startTest: 'Start Test (10s)',
        factoryReset: 'Factory Reset',
        detectedTicks: 'Detected Ticks:',
        timeRemaining: 'Time Remaining:',
        calibrationPlaceMic: 'Place the microphone near the clock and start the test',
        settingsTitle: 'Settings',
        settingsIntro: 'Extra options and preferences.',
        languageLabel: 'Language',
        startMeasurement: 'Start Measurement',
        stopMeasurement: 'Stop Measurement',
        reset: 'Reset',
        audioLevel: 'Audio Level:',
        detectionThreshold: 'Detection Threshold:',
        moreSensitive: '← More sensitive',
        lessSensitive: 'Less sensitive →',
        currentMeasurement: 'Current Measurement',
        readyToStart: 'Ready to start',
        totalDeviation: 'Total Deviation:',
        longerIntervals: 'Longer Intervals:',
        shorterIntervals: 'Shorter Intervals:',
        measurementHistory: 'Measurement History',
        initializing: 'Initializing...',
        progressPairs: '{{current}}/{{total}} tick-tock pairs detected',
        listening: 'Listening for clock ticks...',
        micError: 'Could not access the microphone. Error: ',
        minFreqError: 'Minimum frequency must be lower than maximum',
        customRangeSet: 'Custom range: {{min}}-{{max}} Hz',
        stopTest: 'Stop Test',
        testStarted: 'Test started! Let the clock tick...',
        noTicks: 'No ticks detected. Increase volume or lower the threshold.',
        tooFewTicks: '{{count}} ticks detected. Too few - lower the threshold or move the microphone closer to the clock.',
        tooManyTicks: '{{count}} ticks detected. Too many - increase the threshold to reduce noise.',
        goodTicks: '{{count}} ticks detected ({{perSecond}}/s). Good settings!',
        historyLong: 'Long:',
        historyShort: 'Short:',
        createdBy: 'Created by',
    },
    nl: {
        appTitle: 'Tick Tack Timer',
        btnMeasure: 'Meten',
        btnCalibrate: 'Kalibreren',
        btnSettings: 'Instellingen',
        calibrationTitle: 'Kalibratie Modus',
        clockSmall: 'Kleine Klok (1-4kHz)',
        clockMedium: 'Gemiddelde Klok (0.8-3kHz)',
        clockLarge: 'Grote Klok (0.5-2kHz)',
        clockCustom: 'Aangepast',
        customRange: 'Aangepast Bereik:',
        minFreq: 'Min:',
        maxFreq: 'Max:',
        startTest: 'Start Test (10s)',
        factoryReset: 'Fabrieksinstellingen',
        detectedTicks: 'Gedetecteerde Tikken:',
        timeRemaining: 'Resterende Tijd:',
        calibrationPlaceMic: 'Plaats de microfoon bij de klok en start de test',
        settingsTitle: 'Instellingen',
        settingsIntro: 'Extra opties en voorkeuren.',
        languageLabel: 'Taal',
        startMeasurement: 'Start Meting',
        stopMeasurement: 'Stop Meting',
        reset: 'Reset',
        audioLevel: 'Audio Niveau:',
        detectionThreshold: 'Detectie Drempel:',
        moreSensitive: '← Gevoeliger',
        lessSensitive: 'Minder gevoelig →',
        currentMeasurement: 'Huidige Meting',
        readyToStart: 'Klaar om te starten',
        totalDeviation: 'Totale Afwijking:',
        longerIntervals: 'Langere Intervals:',
        shorterIntervals: 'Kortere Intervals:',
        measurementHistory: 'Meetgeschiedenis',
        initializing: 'Initialiseren...',
        progressPairs: '{{current}}/{{total}} tik-tak paren gedetecteerd',
        listening: 'Luisteren naar klok tikken...',
        micError: 'Kon geen toegang krijgen tot de microfoon. Fout: ',
        minFreqError: 'Minimum frequentie moet lager zijn dan maximum',
        customRangeSet: 'Aangepast bereik: {{min}}-{{max}} Hz',
        stopTest: 'Stop Test',
        testStarted: 'Test gestart! Laat de klok tikken...',
        noTicks: 'Geen tikken gedetecteerd. Verhoog het volume of verlaag de drempel.',
        tooFewTicks: '{{count}} tikken gedetecteerd. Te weinig - verlaag de drempel of plaats microfoon dichter bij de klok.',
        tooManyTicks: '{{count}} tikken gedetecteerd. Te veel - verhoog de drempel om ruis te verminderen.',
        goodTicks: '{{count}} tikken gedetecteerd ({{perSecond}}/s). Goede instelling!',
        historyLong: 'Lang:',
        historyShort: 'Kort:',
        createdBy: 'Gemaakt door',
    },
};

let currentLang = 'en';

function getBrowserLocale() {
    const nav = typeof navigator !== 'undefined' ? navigator : { language: 'en', languages: ['en'] };
    const lang = (nav.languages && nav.languages[0]) || nav.language || 'en';
    const code = (lang.split('-')[0] || 'en').toLowerCase();
    return SUPPORTED.includes(code) ? code : 'en';
}

export function initI18n() {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    currentLang = stored && SUPPORTED.includes(stored) ? stored : getBrowserLocale();
    if (currentLang !== stored && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, currentLang);
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = currentLang === 'nl' ? 'nl' : 'en';
    }
    return currentLang;
}

export function getLanguage() {
    return currentLang;
}

export function setLanguage(lang) {
    const next = SUPPORTED.includes(lang) ? lang : 'en';
    if (next === currentLang) return currentLang;
    currentLang = next;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, currentLang);
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = currentLang === 'nl' ? 'nl' : 'en';
    }
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
    return currentLang;
}

/**
 * Translate key. Optional second argument: object for placeholders, e.g. t('progressPairs', { current: 5, total: 10 })
 */
export function t(key, replacements) {
    const strings = translations[currentLang] || translations.en;
    let text = strings[key] != null ? strings[key] : (translations.en[key] || key);
    if (replacements && typeof replacements === 'object') {
        Object.keys(replacements).forEach((k) => {
            text = text.replace(new RegExp('{{' + k + '}}', 'g'), String(replacements[k]));
        });
    }
    return text;
}
