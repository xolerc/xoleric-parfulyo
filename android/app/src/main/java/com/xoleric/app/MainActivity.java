package com.xoleric.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private PowerManager.WakeLock wakeLock;
    private static final String URL = "https://xolerc.github.io/xoleric-parfulyo/";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
        webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webView.getSettings().setLoadWithOverviewMode(true);
        webView.getSettings().setUseWideViewPort(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setSupportZoom(false);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        /* JavaScript interface for media control from web page */
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void onMediaPlay() {
                startAudioService();
            }
            @JavascriptInterface
            public void onMediaPause() {
                stopAudioService();
            }
        }, "Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("https://xolerc.github.io/xoleric-parfulyo/") ||
                    url.startsWith("https://xoleric-9ad1b-default-rtdb.firebaseio.com/") ||
                    url.startsWith("https://www.googleapis.com/") ||
                    url.startsWith("https://fonts.googleapis.com/") ||
                    url.startsWith("https://fonts.gstatic.com/") ||
                    url.startsWith("https://api.github.com/")) {
                    return false;
                }
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                    startActivity(intent);
                    return true;
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                progressBar.setProgress(newProgress);
            }
        });

        swipeRefresh.setOnRefreshListener(() -> webView.reload());

        webView.loadUrl(URL);
    }

    private void startAudioService() {
        Intent intent = new Intent(this, AudioService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
    }

    private void stopAudioService() {
        stopService(new Intent(this, AudioService.class));
    }

    @Override
    protected void onPause() {
        super.onPause();
        /* Keep WebView alive in background for audio playback */
        webView.onResume();
        /* Notify JS that app went to background */
        webView.evaluateJavascript(
            "try{window.dispatchEvent(new Event('apppause'))}catch(e){}",
            null
        );
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        /* Notify JS that app is back */
        webView.evaluateJavascript(
            "try{window.dispatchEvent(new Event('appresume'))}catch(e){}",
            null
        );
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAudioService();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
