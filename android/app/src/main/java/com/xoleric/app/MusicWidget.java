package com.xoleric.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class MusicWidget extends AppWidgetProvider {

    private static final String PREFS = "xoleric_widget";
    private static final String KEY_TITLE = "music_title";
    private static final String KEY_STATUS = "music_status";
    private static final String KEY_PLAYING = "music_playing";
    private static final String ACTION_PLAY = "com.xoleric.app.action.PLAY_MUSIC";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_PLAY.equals(intent.getAction())) {
            Intent serviceIntent = new Intent(context, MusicService.class);
            serviceIntent.setAction(ACTION_PLAY);
            context.startService(serviceIntent);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager mgr, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_music);
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        views.setTextViewText(R.id.widget_music_title, prefs.getString(KEY_TITLE, "XOLERIC"));
        views.setTextViewText(R.id.widget_music_status, prefs.getString(KEY_STATUS, "Ijro etilmoqda"));

        boolean playing = prefs.getBoolean(KEY_PLAYING, false);
        views.setImageViewResource(R.id.widget_music_play,
                playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);

        Intent playIntent = new Intent(context, MusicWidget.class);
        playIntent.setAction(ACTION_PLAY);
        PendingIntent pi = PendingIntent.getBroadcast(context, 2, playIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_music_play, pi);

        Intent appIntent = new Intent(context, MainActivity.class);
        PendingIntent appPi = PendingIntent.getActivity(context, 3, appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, appPi);

        mgr.updateAppWidget(id, views);
    }

    public static void updateState(Context context, String title, String status, boolean playing) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putString(KEY_TITLE, title)
                .putString(KEY_STATUS, status)
                .putBoolean(KEY_PLAYING, playing)
                .apply();

        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(
                new android.content.ComponentName(context, MusicWidget.class));
        for (int id : ids) {
            updateAppWidget(context, mgr, id);
        }
    }
}
