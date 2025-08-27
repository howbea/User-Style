// SPDX-FileCopyrightText: 2020 Florian Müllner <fmuellner@gnome.org>
// SPDX-FileCopyrightText: 2024 Yoshiki Takahashi <m32rncsz@gmail.com>
//
// SPDX-License-Identifier: GPL-2.0-or-later

// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

// we use async/await here to not block the mainloop, not to parallelize
/* eslint-disable no-await-in-loop */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {getThemeDirs, getModeThemeDirs} from './util.js';

Gio._promisify(Gio.File.prototype, 'enumerate_children_async');
Gio._promisify(Gio.File.prototype, 'query_info_async');
Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async');

class UserThemeGroup extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor(settings) {
        super({title: 'Themes'});

        this._actionGroup = new Gio.SimpleActionGroup();
        this.insert_action_group('theme', this._actionGroup);

        this._settings = settings;
        this._actionGroup.add_action(
            this._settings.create_action('name'));

        this.connect('destroy', () => (this._settings = null));

        this._rows = new Map();
        this._addTheme(''); // default

        this._collectThemes();
    }

    async _collectThemes() {
        for (const dirName of getThemeDirs()) {
            const dir = Gio.File.new_for_path(dirName);
            for (const name of await this._enumerateDir(dir)) {
                if (this._rows.has(name))
                    continue;

                const file = dir.resolve_relative_path(
                    `${name}/gnome-shell/gnome-shell-dark.css`);
                try {
                    await file.query_info_async(
                        Gio.FILE_ATTRIBUTE_STANDARD_NAME,
                        Gio.FileQueryInfoFlags.NONE,
                        GLib.PRIORITY_DEFAULT, null);
                    this._addTheme(name);
                } catch (e) {
                    if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                        logError(e);
                }
            }
        }

        for (var dirName of getModeThemeDirs()) {
            var dir = Gio.File.new_for_path(dirName);
            for (var filename of await this._enumerateDir(dir)) {
                if (!filename.endsWith('-dark.css'))
                    continue;

                var name = filename.slice(0, -9);
                if (!this._rows.has(name))
                    this._addTheme(name);
            }
        }
    }

    _addTheme(name) {
        const row = new ThemeRow(name);
        this._rows.set(name, row);

        this.add(row);
    }

    async _enumerateDir(dir) {
        const fileInfos = [];
        let fileEnum;

        try {
            fileEnum = await dir.enumerate_children_async(
                Gio.FILE_ATTRIBUTE_STANDARD_NAME,
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT, null);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                logError(e);
            return [];
        }

        let infos;
        do {
            infos = await fileEnum.next_files_async(100,
                GLib.PRIORITY_DEFAULT, null);
            fileInfos.push(...infos);
        } while (infos.length > 0);

        return fileInfos.map(info => info.get_name());
    }
}

class ThemeRow extends Adw.ActionRow {
    static {
        GObject.registerClass(this);
    }

    constructor(name) {
        const check = new Gtk.CheckButton({
            action_name: 'theme.name',
            action_target: new GLib.Variant('s', name),
        });

        super({
            title: name || 'Default',
            activatable_widget: check,
        });
        this.add_prefix(check);
    }
}

const OptionsGroup = GObject.registerClass(
class OptionsGroup extends Adw.PreferencesGroup {
    _init(settings) {
        super._init({ title: 'Options' });

        //settings = this.ExtensionUtils.getSettings();
        
        const dlSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        settings.bind('default-dark',
            dlSwitch, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const row = new Adw.ActionRow({
            title: 'Default Dark',
            activatable_widget: dlSwitch,
        });
        row.add_suffix(dlSwitch);
        this.add(row);
    }
});

export default class UserThemePrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();
    const userthemegroup = new UserThemeGroup(settings);
    const optionsgroup = new OptionsGroup(settings);
    page.add(userthemegroup);
    page.add(optionsgroup);
    window.add(page);
    }
}
