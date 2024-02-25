// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// Load shell theme from ~/.local/share/themes/name/gnome-shell

import Gio from 'gi://Gio';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {getThemeDirs, getModeThemeDirs} from './util.js';

const SETTINGS_KEY = 'name';

export default class ThemeManager extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._sysiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface', });
        this._sysa11yiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.a11y.interface', });
        this._changeTheme();
        
        this._settings.connect(`changed::${SETTINGS_KEY}`, this._changeTheme.bind(this));
        this.a11ysig = St.Settings.get().connect('notify::high-contrast', () => {
        this._changeTheme();
         });
        this.isig = St.Settings.get().connect('notify::color-scheme', () => {
        this._changeTheme();
        });
        
        
    }

    disable() {
        this._settings?.run_dispose();
        this._settings = null;
        St.Settings.get().disconnect(this.a11ysig);
        //this._sysa11yiSettings = null;
        St.Settings.get().disconnect(this.isig);
        //this._sysiSettings = null;

        Main.setThemeStylesheet(null);
        Main.loadTheme();
    }

    _changeTheme() {
        let stylesheet = null;
        let themeName = this._settings.get_string(SETTINGS_KEY);

        if (themeName) {
        if(St.Settings.get().high_contrast) {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-high-contrast.css`);
        }
        else if(!St.Settings.get().high_contrast && St.Settings.get().color_scheme === St.SystemColorScheme.PREFER_LIGHT) {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
        }
        else if(!St.Settings.get().high_contrast && Main.sessionMode.colorScheme === 'prefer-light' && St.Settings.get().color_scheme === St.SystemColorScheme.DEFAULT) {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
        }        
        else {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-dark.css`);
        }            

       if(St.Settings.get().high_contrast) { 
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-high-contrast.css`));
        }
        else if(!St.Settings.get().high_contrast && this._sysiSettings.get_string('color-scheme') === 'prefer-light') {
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
        }
        else if(!St.Settings.get().high_contrast && Main.sessionMode.colorScheme === 'prefer-light' && St.Settings.get().color_scheme === St.SystemColorScheme.DEFAULT) {
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
        }
        else {
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-dark.css`));
        }




            stylesheet = stylesheetPaths.find(path => {
                let file = Gio.file_new_for_path(path);
                return file.query_exists(null);
            });
        }

        if (stylesheet)
            log(`loading user theme: ${stylesheet}`);
        else
            log('loading default theme (Adwaita)');
        Main.setThemeStylesheet(stylesheet);
        Main.loadTheme();
    }
}
