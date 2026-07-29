package com.iron.muscu;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * IRON n'est qu'une WebView plein écran autour de assets/index.html.
 *
 * Deux choses ne peuvent pas se faire côté web et justifient ce fichier :
 * le sélecteur de fichiers (photos et vidéos des exercices) et la mise à
 * jour de l'app, qui doit passer par l'installeur du système.
 */
public class MainActivity extends Activity {

    private WebView web;
    private ValueCallback<Uri[]> filePicker;
    private static final int PICK_FILE = 1001;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage : toutes les données de l'app
        s.setDatabaseEnabled(true);            // IndexedDB : photos et vidéos
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);   // vidéos d'exercice en boucle
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);

        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb,
                                             FileChooserParams params) {
                if (filePicker != null) filePicker.onReceiveValue(null);
                filePicker = cb;
                try {
                    startActivityForResult(params.createIntent(), PICK_FILE);
                } catch (Exception e) {
                    filePicker = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new NativeBridge(this), "IronNative");
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == PICK_FILE && filePicker != null) {
            filePicker.onReceiveValue(FileChooserParams.parseResult(res, data));
            filePicker = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    /** Le bouton retour navigue dans l'historique de la WebView avant de quitter. */
    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
