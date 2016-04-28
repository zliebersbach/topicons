// jshint esnext:true
/*
   topicons, a GNOME shell extension to show legacy tray icons in the top bar.
   Copyright (C) 2015	Kevin Boxhoorn

   topicons is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   topicons is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	 See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with topicons.	 If not, see <http://www.gnu.org/licenses/>.
 */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Gettext = imports.gettext.domain("topicons");

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

function init() {
	Convenience.initTranslations();
}

const TopIconsSettingsWidget = new GObject.Class({
	Name: "WorkspaceIndicator.TopIconsSettingsWidget",
	GTypeName: "TopIconsSettingsWidget",
	Extends: Gtk.Box,

	_init: function(params) {
		this.parent(params);
		this.settings = Convenience.getSettings();

		let notebook = new Gtk.Notebook();

		// SETTINGS

		let topiconsSettings = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL
		});
		let topiconsSettingsTitle = new Gtk.Label({
			label: Gettext.gettext("Settings")
		});

		let topiconsSettingsMain = new Gtk.Box({
			spacing: 30, orientation: Gtk.Orientation.VERTICAL,
			homogeneous: true, margin: 10
		});

		let topiconsSettingsControl = new Gtk.Box({
			spacing: 30, margin_left: 10,
			margin_top: 10, margin_right: 10
		});

		let topiconsSettingsGrid= new Gtk.Grid({
			row_homogeneous: true,
			column_homogeneous: false
		});

		// Icon Size Setting
		let iconSizeLabel = new Gtk.Label({
			label: Gettext.gettext("Icon Size (px)"),
			use_markup: true, xalign: 0, hexpand: true
		});
		let iconSizeWidget = new Gtk.SpinButton({ halign: Gtk.Align.END });
		iconSizeWidget.set_sensitive(true);
		iconSizeWidget.set_range(0, 32);
		iconSizeWidget.set_value(this.settings.get_int("icon-size"));
		iconSizeWidget.set_increments(1, 2);
		iconSizeWidget.connect("value-changed", Lang.bind(this, function(button) {
			let s = button.get_value_as_int();
			this.settings.set_int("icon-size", s);
		}));

		// Icon Padding Setting
		let iconPaddingLabel = new Gtk.Label({
			label: Gettext.gettext("Icon Padding (px)"),
			use_markup: true, xalign: 0, hexpand: true
		});
		let iconPaddingWidget = new Gtk.SpinButton({ halign: Gtk.Align.END });
		iconPaddingWidget.set_sensitive(true);
		iconPaddingWidget.set_range(0, 32);
		iconPaddingWidget.set_value(this.settings.get_int("icon-padding"));
		iconPaddingWidget.set_increments(1, 2);
		iconPaddingWidget.connect("value-changed", Lang.bind(this, function(button) {
			let s = button.get_value_as_int();
			this.settings.set_int("icon-padding", s);
		}));

		// Hidden Icons List
		let hiddenIconsLabel = new Gtk.Label({
			label: Gettext.gettext("Hidden Icons"),
			use_markup: true, xalign: 0, hexpand: true
		});
		let hiddenIconsListStore = new Gtk.ListStore();
		hiddenIconsListStore.set_column_types([ GObject.TYPE_STRING ]);
		
		topiconsSettingsGrid.attach(iconSizeLabel, 0, 0, 1, 1);
		topiconsSettingsGrid.attach(iconSizeWidget, 1, 0, 1, 1);
		topiconsSettingsGrid.attach(iconPaddingLabel, 0, 1, 1, 1);
		topiconsSettingsGrid.attach(iconPaddingWidget, 1, 1, 1, 1);

		topiconsSettingsMain.add(topiconsSettingsGrid);
		//topiconsSettingsMain.add(hiddenIconsLabel);

		topiconsSettings.add(topiconsSettingsControl);
		topiconsSettings.add(topiconsSettingsMain);

		// ABOUT
		let topiconsAbout = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
		let topiconsAboutTitle = new Gtk.Label({ label: Gettext.gettext("About") });

		let topiconsAboutMain = new Gtk.Box({
			spacing: 30, orientation: Gtk.Orientation.HORIZONTAL,
			homogeneous: true, margin: 10
		});

		let topiconsAboutControl = new Gtk.Box({
			spacing: 30, margin_left: 10,
			margin_top: 10, margin_right: 10
		});

		let topiconsAboutGrid= new Gtk.Grid({
			row_homogeneous: true,
			column_homogeneous: false
		});

		// License
		let licenseTextView = new Gtk.TextView({
			editable: false, hexpand: true,
			justification: Gtk.Justification.CENTER
		});
		let licenseBuffer = licenseTextView.get_buffer();
		licenseBuffer.set_text(Gettext.gettext("topicons, a GNOME shell extension to show legacy tray icons in the top bar.\nCopyright (C) 2015	 Kevin Boxhoorn\n\ntopicons is free software: you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation, either version 3 of the License, or\n(at your option) any later version.\n\ntopicons is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License\nalong with topicons.  If not, see <http://www.gnu.org/licenses/>."), -1);

		topiconsAboutGrid.attach(licenseTextView, 0, 0, 1, 1);

		topiconsAboutMain.add(topiconsAboutGrid);

		topiconsAbout.add(topiconsAboutControl);
		topiconsAbout.add(topiconsAboutMain);

		notebook.append_page(topiconsSettings, topiconsSettingsTitle);
		notebook.append_page(topiconsAbout, topiconsAboutTitle);

		this.add(notebook);
	}
});

function buildPrefsWidget() {
	let widget = new TopIconsSettingsWidget({ orientation: Gtk.Orientation.VERTICAL, spacing: 5, border_width: 5 });
	widget.show_all();

	return widget;
}
