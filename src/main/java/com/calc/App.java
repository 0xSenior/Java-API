package com.calc;

import me.friwi.jcefmaven.CefAppBuilder;
import me.friwi.jcefmaven.CefInitializationException;
import me.friwi.jcefmaven.UnsupportedPlatformException;
import org.cef.CefApp;
import org.cef.CefClient;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefMessageRouter;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.IOException;

public class App {
    public static void main(String[] args) throws UnsupportedPlatformException, CefInitializationException, IOException, InterruptedException {
        CefAppBuilder builder = new CefAppBuilder();
        
        builder.setInstallDir(new File("jcef-bundle"));

        builder.getCefSettings().windowless_rendering_enabled = false;
        builder.addJcefArgs("--disable-gpu");

        CefApp cefApp = builder.build();

        CefClient client = cefApp.createClient();
        
        CefMessageRouter msgRouter = CefMessageRouter.create();
        client.addMessageRouter(msgRouter);

        File uiFile = new File("ui/index.html");
        String url = uiFile.getAbsoluteFile().toURI().toString();

        CefBrowser browser = client.createBrowser(url, false, false);

        JFrame frame = new JFrame("AI Chat Assistant");
        
        // Set Application Icon (Improved for multiple sizes)
        File iconFile = new File("ui/assets/logo.png");
        if(iconFile.exists()) {
            java.util.List<Image> icons = new java.util.ArrayList<>();
            icons.add(new ImageIcon(iconFile.getAbsolutePath()).getImage());
            frame.setIconImages(icons);
        }

        frame.setUndecorated(false); 
        frame.setSize(1000, 700);
        frame.setLocationRelativeTo(null);
        frame.setDefaultCloseOperation(WindowConstants.DO_NOTHING_ON_CLOSE);
        
        frame.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                CefApp.getInstance().dispose();
                frame.dispose();
                System.exit(0);
            }
        });

        frame.getContentPane().add(browser.getUIComponent(), BorderLayout.CENTER);
        frame.setVisible(true);
    }
}
