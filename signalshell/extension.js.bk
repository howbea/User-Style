const { Gio, GLib, Pango, St } = imports.gi;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ColorScheme = Me.imports.colorscheme;
const KEY_PLIGHT = 'p-light';

let themeContext = St.ThemeContext.get_for_stage(global.stage);
let stylesheetFile;

this._sysiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface', });
this._sysa11yiSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.a11y.interface', });
this._extSettings = ExtensionUtils.getSettings();

function _loadCustomStyleheet()
{    
    if(this._sysa11yiSettings.get_boolean('high-contrast')) {
        stylesheetPath = GLib.build_filenamev(
            [GLib.get_user_data_dir(), 'gnome-shell/theme/gnome-shell', 'gnome-shell-high-contrast.css']
        );
    }
    else if(!this._sysa11yiSettings.get_boolean('high-contrast') && this._sysiSettings.get_string('color-scheme') === 'prefer-light') {
        stylesheetPath = GLib.build_filenamev(
            [GLib.get_user_data_dir(), 'gnome-shell/theme/gnome-shell', 'gnome-shell-light.css']
        );
    }
    else {
        stylesheetPath = GLib.build_filenamev(
            [GLib.get_user_data_dir(), 'gnome-shell/theme/gnome-shell', 'gnome-shell-dark.css']
        );
    }
    
    stylesheetFile = Gio.File.new_for_path(stylesheetPath);
    themeContext.get_theme().load_stylesheet(stylesheetFile);
}

function _signalloadCustomStyleheet() {
    this.aaa = this._sysa11yiSettings.connect('changed::high-contrast', () => {
        this._unloadCustomStyleheet();
        this._loadCustomStyleheet();
    });
   this.bbb = this._sysiSettings.connect('changed::color-scheme', () => {
        this._unloadCustomStyleheet();
        this._loadCustomStyleheet();
    });
}
    


function _unloadCustomStyleheet()
{
    if (stylesheetFile) {
        themeContext.get_theme().unload_stylesheet(stylesheetFile);
    }
}

function enable()
{
    this.disable();

    if(this._extSettings.get_boolean(KEY_PLIGHT)) {
        ColorScheme._setScheme();
        ColorScheme._signalsetScheme();
    }
    
    this.p_light_sig = this._extSettings.connect("changed::" + KEY_PLIGHT, () => {
            if(this._extSettings.get_boolean(KEY_PLIGHT)) {
                ColorScheme._setScheme();
                ColorScheme._signalsetScheme();
            }
            else {
                ColorScheme._quitupdateScheme();
            }         
        });

    
    this._unloadCustomStyleheet();
    this._loadCustomStyleheet();
    this._signalloadCustomStyleheet();    
}

function disable()
{
    if(Main.sessionMode.currentMode !== 'unlock-dialog'){    
        this._extSettings.disconnect(this.p_light_sig);
        this._sysa11yiSettings.disconnect(this.aaa);
        this._sysiSettings.disconnect(this.bbb);
        ColorScheme._quitupdateScheme();
        this._unloadCustomStyleheet();    
    }
}
