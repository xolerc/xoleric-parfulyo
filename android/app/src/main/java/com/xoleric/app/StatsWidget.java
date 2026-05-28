package com.xoleric.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class StatsWidget extends AppWidgetProvider {

    private static final String PREFS = "xoleric_widget";
    private static final String KEY_VISITS = "visits";
    private static final String KEY_ONLINE = "online";
    private static final String KEY_MESSAGES = "messages";
    private static final String KEY_ROOMS = "rooms";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stats);
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        views.setTextViewText(R.id.widget_visits, String.valueOf(prefs.getInt(KEY_VISITS, 0)));
        views.setTextViewText(R.id.widget_online, String.valueOf(prefs.getInt(KEY_ONLINE, 0)));
        views.setTextViewText(R.id.widget_messages, String.valueOf(prefs.getInt(KEY_MESSAGES, 0)));
        views.setTextViewText(R.id.widget_rooms, String.valueOf(prefs.getInt(KEY_ROOMS, 0)));

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateData(Context context, int visits, int online, int messages, int rooms) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putInt(KEY_VISITS, visits)
                .putInt(KEY_ONLINE, online)
                .putInt(KEY_MESSAGES, messages)
                .putInt(KEY_ROOMS, rooms)
                .apply();

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(
                new android.content.ComponentName(context, StatsWidget.class));
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}
