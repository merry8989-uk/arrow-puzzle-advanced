package com.arrowpuzzle.advanced;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * Arrow Puzzle Advanced - a fully offline WebView game host.
 * All game logic lives in app/src/main/assets/www (HTML/CSS/JS); this Activity
 * only hosts it and bridges the hardware back button to the in-page navigation.
 */
public class MainActivity extends Activity {

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0a0e16"));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // localStorage for progress
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

        setContentView(web);
        web.loadUrl("file:///android_asset/www/index.html");
    }

    /** Lets the web layer close the app when back is pressed on the home screen,
     *  and open external links (e.g. the developer's Instagram) in a browser/app. */
    private class Bridge {
        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(new Runnable() {
                @Override public void run() { finish(); }
            });
        }

        @JavascriptInterface
        public void openUrl(final String url) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, url, Toast.LENGTH_LONG).show();
                    }
                }
            });
        }
    }

    private long lastBack = 0;

    @Override
    public void onBackPressed() {
        // Let the page navigate up first. Only when we are already on Home does
        // Back arm the exit, and then a SECOND press within 2 seconds is needed
        // so a single tap can never close the game by accident.
        web.evaluateJavascript(
            "(window.androidBack && window.androidBack()) ? 'true' : 'false'",
            new ValueCallback<String>() {
                @Override public void onReceiveValue(String value) {
                    if ("true".equals(value)) return;   // the page handled it
                    long now = System.currentTimeMillis();
                    if (now - lastBack < 2000) {
                        finish();
                    } else {
                        lastBack = now;
                        Toast.makeText(MainActivity.this,
                                "Press back again to exit", Toast.LENGTH_SHORT).show();
                    }
                }
            });
    }
}
