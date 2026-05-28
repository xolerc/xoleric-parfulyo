# XOLERIC Android Widgets

Native Android App Widgets for the XOLERIC home screen.

## Widgets

| Widget | Size | Description |
|--------|------|-------------|
| **StatsWidget** | 2×1 | Real-time stats: visits, online users, messages, rooms |
| **WeatherWidget** | 2×1 | Current weather for Namangan |
| **MusicWidget** | 2×1 | Mini music player with play/pause control |
| **ResumeWidget** | 2×1 | Profile card with skill tags |

## Integration

### 1. Add to AndroidManifest.xml

```xml
<receiver android:name=".StatsWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/widget_info_stats" />
</receiver>

<receiver android:name=".WeatherWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/widget_info_weather" />
</receiver>

<receiver android:name=".MusicWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        <action android:name="com.xoleric.app.action.PLAY_MUSIC" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/widget_info_music" />
</receiver>

<receiver android:name=".ResumeWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/widget_info_resume" />
</receiver>
```

### 2. Data Sync

Call static methods from your WebView bridge or background service:

```java
// Stats
StatsWidget.updateData(context, visits, online, messages, rooms);

// Weather
WeatherWidget.updateWeather(context, "28°", "☀️", "Quyoshli");

// Music
MusicWidget.updateState(context, "Song Title", "Playing", true);
```

### 3. Widget Background

Uses `@drawable/widget_bg` — dark card with 16dp radius and 1px border.

## Build Requirements

- minSdk: 26
- targetSdk: 34
- AndroidX AppCompat (for RemoteViews compatibility)
