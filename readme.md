# Tick Tack Timer
This application aims to help clock repair technicians.
When adjusting the pendulum of a mechanical clock, we need to check if the 'tick' takes the same time as the 'tack'.
This application helps technicians to measure the time difference between the 'tick' and 'tack' sounds, giving them 
input for adjustments.

## Step 1: Calibration
To catch the clocks sound and as little distractions as possible beyond that, the app needs to be calibrated. This is
done by showing what the microphone hears when the clock ticks and tacks. Then you can adjust the frequency bandwidth
that the app uses to recognize the tick and distinguish it from the tack sound. You can also adjust the threshold to
filter out noise. Once you are satisfied that the app can distinguish the tick and tack sounds, you can start the app
for your actual measurements.

## Measurements
When you start a measurement session the app listens for a configurable sampling time (10, 20 or 30 seconds, set in
Settings). All detected clicks are collected during that period. After the sampling time the app analyses the result
and shows it.

## Settings
The sampling time can be set to 10, 20 or 30 seconds via the Settings screen. The longer the sampling time, the more
samples are collected, which increases the accuracy of the measurement. The setting is saved and remembered for the
next session.

## Meetmethode en algoritme

During the sampling time the app records the timestamp of every detected click (tick or tack). These alternate between
tick and tack:

```
time:   0                       10  (seconds – the sampling time)
tick:   |            |           |
tack:           |           |
sample: |..t1.../.t2.|..t1../.t2.|
```

- **t1** is the interval from a tick to the following tack.
- **t2** is the interval from a tack to the following tick.

After collecting all clicks the app discards the last click when an even number was detected (an even count means the
last click does not contribute a complete t1–t2 pair). It then computes:

| Value | Description |
|-------|-------------|
| **t1 gemiddelde** | Mean of all t1 intervals (ms) |
| **t2 gemiddelde** | Mean of all t2 intervals (ms) |
| **Balans** | `smallest(t1mean, t2mean) / largest(t1mean, t2mean) × 100 %` |
| **Aantal samples** | Number of complete t1–t2 pairs used |

A **Balans** of 100 % means a perfectly balanced clock. The lower the value the more the pendulum needs adjusting.
Because we use the smallest/largest ratio it does not matter whether we hear the tick or the tack first.

## Running locally

### Dev version
```bash
npm install
npm run dev
```

### Build version
The easiest way is to use the php dev server:
```bash
npm run build
cd dist
php -S localhost:3030
```
Then open your browser and navigate to `http://localhost:3030`.

## Deployment (GitHub Pages)

The app is deployed automatically to [https://ttt.scolavisa.eu](https://ttt.scolavisa.eu) via GitHub Actions whenever
changes are pushed to the `main` branch.

### Enabling GitHub Pages (one-time setup)

1. Go to **Settings → Pages** in the repository.
2. Under **Build and deployment**, set the source to **GitHub Actions**.
3. Set the **Custom domain** to `ttt.scolavisa.eu` and save.
4. Enable **Enforce HTTPS** once the domain has been verified.

### DNS configuration

Replace any existing `ttt` A record with a CNAME record:

| Type  | Name | Value                 |
|-------|------|-----------------------|
| CNAME | ttt  | scolavisa.github.io   |

After updating the DNS record, allow time for propagation (up to 48 hours, though usually much faster). GitHub will
automatically provision a TLS certificate once the CNAME resolves correctly.

### PWA notes

- The service worker is registered with `registerType: 'autoUpdate'`, so users receive updates automatically when a new
  version is deployed—no manual refresh required.
- If a user has the app installed as a PWA and a new build is deployed, the service worker will update in the
  background and activate on the next page load.
- `start_url: '/'` is correct for a custom-domain deployment and should not be changed.

## Technical stuff
This app uses as little code as possible. No framework, just plain HTML, JavaScript and a little bit of CSS.
For time measurement it uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). This
allows the browser to record audio from the microphone during a sample time and then calculate the difference in time
duration between the two. That difference is displayed as input for the user to adjust the pendulum. The Web Audio Api
is much more precise than if we, for instance, were to use the Date object.

The app is designed to be straightforward and intuitive to use, with a focus on accuracy and precision rather than fancy
look and feel. However, it is designed to be used on mobile devices. By using the internal microphone you should need no
external hardware beyond your telephone.

When you first start the app, it will most likely ask you if it is allowed to use the microphone.
