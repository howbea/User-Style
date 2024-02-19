/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const { Gio, GLib, Pango, St } = imports.gi;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

class Extension {
    constructor() {
    }    
    _loadStyleheet() {    
        if(this._sysa11yiSettings.get_boolean('high-contrast')) {
            var stylesheetPath = GLib.build_filenamev(
                [GLib.get_user_data_dir(), 'gnome-shell/theme', 'gnome-shell-high-contrast.css']
            );
        }
        else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'prefer-dark') {
            var stylesheetPath = GLib.build_filenamev(
                [GLib.get_user_config_dir(), 'gnome-shell', 'gnome-shell-dark.css']
            );
        }
        else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'default' && this._extSettings.get_boolean('default-dark')) {
            var stylesheetPath = GLib.build_filenamev(
                [GLib.get_user_config_dir(), 'gnome-shell', 'gnome-shell-dark.css']
            );
        }
        else {
            var stylesheetPath = GLib.build_filenamev(
                [GLib.get_user_config_dir(), 'gnome-shell', 'gnome-shell-light.css']
            );
        }
    
        Main.setThemeStylesheet(stylesheetPath);
        Main.loadTheme();
    }
    
    _signalloadStyleheet() {
        this.a11ysig = this._sysa11yiSettings.connect('changed::high-contrast', () => {
            this._loadStyleheet();
        });
        this.isig = this._sysiSettings.connect('changed::color-scheme', () => {
            this._loadStyleheet();
        });
        this.extsig = this._extSettings.connect('changed::default-dark', () => {
            this._loadStyleheet();
        });
    }
    
    _unloadStyleheet() {
        Main.setThemeStylesheet(null);
        Main.loadTheme();
    }

    enable() {
        this._sysa11yiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.a11y.interface', });
        this._sysiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface', });
        this._extSettings = ExtensionUtils.getSettings();
        
        this._loadStyleheet();
        this._signalloadStyleheet();    
    }

    disable() {
        //if(Main.sessionMode.currentMode !== 'unlock-dialog'){    
        this._extSettings.disconnect(this.extsig);
        this._extSettings = null;
        this._sysa11yiSettings.disconnect(this.a11ysig);
        this._sysa11yiSettings = null;
        this._sysiSettings.disconnect(this.isig);
        this._sysiSettings = null;
        this._unloadStyleheet();    
    //}
    }
}

function init() {
    return new Extension();
}
