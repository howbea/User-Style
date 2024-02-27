// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// Load shell theme from ~/.local/share/themes/name/gnome-shell
/* exported init */

const {Gio, St} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;

const Me = ExtensionUtils.getCurrentExtension();
const Util = Me.imports.util;

const SETTINGS_KEY = 'name';

class ThemeManager {
    enable() {
        this._settings = ExtensionUtils.getSettings();
        this._sysa11yiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.a11y.interface', });
        this._sysiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface', });
        
        this._changeTheme();
        
        this.a11ysig = this._sysa11yiSettings.connect('changed::high-contrast', () => {
            this._changeTheme();
        });
        this.isig = this._sysiSettings.connect('changed::color-scheme', () => {
            this._changeTheme();
        });
        //this.extsig = this._settings.connect(`changed::${SETTINGS_KEY}`, this._changeTheme.bind(this));
        this.extsig = this._settings.connect(`changed`, this._changeTheme.bind(this));
        
    }

    disable() {
        //this._settings?.run_dispose();
        //this._settings = null;
        
        this._settings.disconnect(this.extsig);
        this._settings = null;
        this._sysa11yiSettings.disconnect(this.a11ysig);
        this._sysa11yiSettings = null;
        this._sysiSettings.disconnect(this.isig);
        this._sysiSettings = null;

        Main.setThemeStylesheet(null);
        Main.loadTheme();
    }

    _changeTheme() {
        let stylesheet = null;
        let themeName = this._settings.get_string(SETTINGS_KEY);            

        if (themeName) {
            if(this._sysa11yiSettings.get_boolean('high-contrast')) {
            var stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-high-contrast.css`);
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default' && this._settings.get_boolean('default-light')) {
            var stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default') {
            var stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell.css`);
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'prefer-light') {
            var stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell-light.css`);
            }
            else {
            var stylesheetPaths = Util.getThemeDirs()
                .map(dir => `${dir}/${themeName}/gnome-shell/gnome-shell.css`);
            }
            
            
            
            
            if(St.Settings.get().high_contrast) {
            stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-high-contrast.css`));
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default' && this._settings.get_boolean('default-light')) {
                stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default') {
                stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}.css`));
            }
            else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'prefer-light') {
                stylesheetPaths.push(...Util.getModeThemeDirs()
                .map(dir => `${dir}/${themeName}-light.css`));
            }
            else {
                stylesheetPaths.push(...Util.getModeThemeDirs()                
                .map(dir => `${dir}/${themeName}.css`));
            }            
            
            stylesheet = stylesheetPaths.find(path => {
                let file = Gio.file_new_for_path(path);
                return file.query_exists(null);
            });
        }

        if (stylesheet)
            global.log(`loading user theme: ${stylesheet}`);
        else
            global.log('loading default theme (Adwaita)');
        Main.setThemeStylesheet(stylesheet);
        Main.loadTheme();
    }
}

/**
 * @returns {ThemeManager} - the extension state object
 */
function init() {
    return new ThemeManager();
}
