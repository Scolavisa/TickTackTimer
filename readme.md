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
When you start a measurement session. The app will listen until it has heard the tick and tack sounds 10 times. Then it 
will show the difference between the two in milliseconds and percentage. It also populates a table with the previous 
measurements so you can track your progress.

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
