# Tick Tack Timer
This application aims to help clock repair technicians.
When adjusting the pendulum of a mechanical clock, we need to check if the 'tick' takes the same time as the 'tack'.
This application will help technicians to measure the time difference between the 'tick' and 'tack' sounds giving them 
input for adjustments.
 
# Technical
This app uses as little code as possible. No framework, just plain html, javascript and a little bit of css
For time measurement it uses the Web Audio API. 2 AudioBuffers are loaded and played in sequence.
The difference between the two is measured and displayed.
The app is designed to be simple and intuitive to use, with a focus on accuracy and precision rather than fancy look and 
feel. However, it is designed to be used on mobile devices using the internal microphone. 10 seconds of audio is 
recorded and played back. It is designed to be used on mobile devices using the internal microphone. That way you should 
need no external hardware.
