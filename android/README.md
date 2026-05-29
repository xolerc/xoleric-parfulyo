# XOLERIC Android App

WebView wrapper for xolerc.github.io/xoleric-parfulyo/

## Build

```bash
export ANDROID_HOME=/path/to/android/sdk
./gradlew assembleDebug
```

APK output: `app/build/outputs/apk/debug/app-debug.apk`

## Features

- Fullscreen WebView (no title bar)
- JavaScript, DOM Storage enabled
- Back button = WebView history back
- Swipe down to refresh
- Microphone permission for voice messages
- Dark theme (#0a0e17)
- Icon from provided image
