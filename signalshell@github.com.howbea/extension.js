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
        this._changeTheme();
        
        
        this._settings.connect(`changed::${SETTINGS_KEY}`, this._changeTheme.bind(this));        
        this.a11ysig = St.Settings.get().connect('notify::high-contrast', () => {
        this._changeTheme();
         });
        this.isig = St.Settings.get().connect('notify::color-scheme', () => {
        this._changeTheme();
        });
        
        this._savedColorScheme = Main.sessionMode.colorScheme;
        if(this._settings.get_boolean('default-dark'))
        this._updateColorScheme('prefer-dark');
        else
        this._updateColorScheme('prefer-light');
        this._settings.connect('changed', () =>{ 
        if(this._settings.get_boolean('default-dark'))
        this._updateColorScheme('prefer-dark');
        else
        this._updateColorScheme('prefer-light'); 
        });        
    }

    disable() {
        this._settings = null;
        St.Settings.get().disconnect(this.a11ysig);
        St.Settings.get().disconnect(this.isig);

        Main.setThemeStylesheet(null);
        Main.loadTheme();
        
        this._updateColorScheme(this._savedColorScheme);
    }

    _changeTheme() {
        let stylesheet = null;
        
        let themeName = this._settings.get_string(SETTINGS_KEY);

        if (themeName) {
        if(St.Settings.get().high_contrast) {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-high-contrast.css`);
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-high-contrast.css`));
        }
        else if(!St.Settings.get().high_contrast && St.Settings.get().color_scheme === St.SystemColorScheme.PREFER_DARK) {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-dark.css`);
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-dark.css`));
        }
        else if(!St.Settings.get().high_contrast && Main.sessionMode.colorScheme === 'prefer-dark' && St.Settings.get().color_scheme === St.SystemColorScheme.DEFAULT) {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-dark.css`);
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-dark.css`));
        }        
        else {
            var stylesheetPaths = getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
            stylesheetPaths.push(...getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
        }
        
            stylesheet = stylesheetPaths.find(path => {
                let file = Gio.file_new_for_path(path);
                return file.query_exists(null);
            });
                
        }

        if (stylesheet)
            console.log(`loading user theme: ${stylesheet}`);
        else
            console.log('loading default theme (Adwaita)');
        Main.setThemeStylesheet(stylesheet);
        Main.loadTheme();
    }
    
    _updateColorScheme(scheme) {
        Main.sessionMode.colorScheme = scheme;
        St.Settings.get().notify('color-scheme');
    }
}
