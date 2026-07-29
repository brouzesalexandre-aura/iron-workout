package com.iron.muscu;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.ByteArrayOutputStream;

/**
 * Pont exposé au JavaScript sous le nom {@code IronNative}.
 *
 * Il ne fait que ce que la WebView ne sait pas faire seule :
 *  - interroger l'API GitHub sans se heurter à la CORS (l'origine d'un
 *    fichier local est {@code null}, GitHub refuse la requête) ;
 *  - télécharger un APK puis le remettre à l'installeur du système.
 *
 * L'installation reste confirmée par l'utilisateur dans la boîte de
 * dialogue Android : rien ne s'installe dans son dos.
 */
public class NativeBridge {

    private static final String TAG = "IronNative";
    private static final String RELEASES_API =
            "https://api.github.com/repos/" + BuildConfig.GH_REPO + "/releases/latest";

    private final Activity act;

    NativeBridge(Activity act) { this.act = act; }

    @JavascriptInterface
    public boolean canInstall() { return true; }

    @JavascriptInterface
    public String appVersion() { return BuildConfig.VERSION_NAME; }

    /** Renvoie le JSON brut de la dernière release, ou "{}" si injoignable. */
    @JavascriptInterface
    public String fetchLatestRelease() {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(RELEASES_API).openConnection();
            c.setRequestProperty("Accept", "application/vnd.github+json");
            c.setRequestProperty("User-Agent", "IRON/" + BuildConfig.VERSION_NAME);
            c.setConnectTimeout(10000);
            c.setReadTimeout(15000);
            if (c.getResponseCode() != 200) return "{}";
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (InputStream in = c.getInputStream()) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            return out.toString("UTF-8");
        } catch (Exception e) {
            Log.w(TAG, "release introuvable", e);
            return "{}";
        } finally {
            if (c != null) c.disconnect();
        }
    }

    /** Télécharge l'APK puis ouvre l'installeur. Appelé depuis le bandeau de mise à jour. */
    @JavascriptInterface
    public void downloadAndInstall(final String url, final String version) {
        /* Depuis Android 8, installer un APK demande une autorisation explicite,
           accordée app par app. On la réclame avant de télécharger : inutile de
           tirer plusieurs mégaoctets pour se heurter au refus ensuite. */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !act.getPackageManager().canRequestPackageInstalls()) {
            act.runOnUiThread(() -> {
                Toast.makeText(act, "Autorise IRON à installer des applications, "
                        + "puis relance la mise à jour", Toast.LENGTH_LONG).show();
                act.startActivity(new Intent(
                        android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + act.getPackageName()))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            });
            return;
        }
        new Thread(() -> {
            File apk = new File(act.getCacheDir(), "updates");
            HttpURLConnection c = null;
            try {
                if (!apk.exists() && !apk.mkdirs()) throw new Exception("cache indisponible");
                apk = new File(apk, "iron-" + version + ".apk");

                c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(15000);
                c.setReadTimeout(60000);
                try (InputStream in = c.getInputStream();
                     FileOutputStream out = new FileOutputStream(apk)) {
                    byte[] buf = new byte[16384];
                    int n;
                    while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                }

                Uri uri = FileProvider.getUriForFile(act, act.getPackageName() + ".updates", apk);
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(uri, "application/vnd.android.package-archive");
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                act.startActivity(i);
            } catch (Exception e) {
                Log.w(TAG, "mise à jour impossible", e);
                act.runOnUiThread(() -> Toast.makeText(act,
                        "Mise à jour impossible : " + e.getMessage(), Toast.LENGTH_LONG).show());
            } finally {
                if (c != null) c.disconnect();
            }
        }, "iron-update").start();
    }
}
