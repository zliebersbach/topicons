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
			orientation: Gtk.Orientation.VERTICAL,
			margin: 10, spacing: 10
		});
		let topiconsSettingsControl = new Gtk.Box({
			margin_left: 10, margin_right: 10
		});
		let topiconsSettingsGrid= new Gtk.Grid();

		// Icon Size Setting
		let iconSizeLabel = new Gtk.Label({
			label: Gettext.gettext("Icon Size <small><tt>(px)</tt></small>"),
			use_markup: true, xalign: 0, hexpand: true
		});
		let iconSizeWidget = new Gtk.SpinButton({ halign: Gtk.Align.END });
		iconSizeWidget.set_sensitive(true);
		iconSizeWidget.set_range(0, 32);
		iconSizeWidget.set_value(this.settings.get_int("icon-size"));
		iconSizeWidget.set_increments(1, 2);
		iconSizeWidget.connect("value-changed", Lang.bind(this,
			function(button) {
				let s = button.get_value_as_int();
				this.settings.set_int("icon-size", s);
			}
		));

		// Icon Padding Setting
		let iconPaddingLabel = new Gtk.Label({
			label: Gettext.gettext("Icon Padding <small><tt>(px)</tt></small>"),
			use_markup: true, xalign: 0, hexpand: true
		});
		let iconPaddingWidget = new Gtk.SpinButton({ halign: Gtk.Align.END });
		iconPaddingWidget.set_sensitive(true);
		iconPaddingWidget.set_range(0, 32);
		iconPaddingWidget.set_value(this.settings.get_int("icon-padding"));
		iconPaddingWidget.set_increments(1, 2);
		iconPaddingWidget.connect("value-changed", Lang.bind(this,
			function(button) {
				let s = button.get_value_as_int();
				this.settings.set_int("icon-padding", s);
			}
		));

		// Hidden Icons List
		let hiddenIconsLabel = new Gtk.Label({
			label: Gettext.gettext("Hidden Icons"),
			use_markup: true, xalign: 0, hexpand: true
		});
		this.hiddenIconsListStore = new Gtk.ListStore();
		this.hiddenIconsListStore.set_column_types([
			GObject.TYPE_STRING, GObject.TYPE_BOOLEAN
		]);
		let hiddenIconsTreeView = new Gtk.TreeView({
			expand: true, model: this.hiddenIconsListStore
		});
		let hiddenIconsNameCol = new Gtk.TreeViewColumn({
			title: "Name", expand: true
		});
		let hiddenIconsStatusCol = new Gtk.TreeViewColumn({ title: "Hidden" });
		let hiddenIconsNameRen = new Gtk.CellRendererText();
		let hiddenIconsStatusRen = new Gtk.CellRendererToggle();
		hiddenIconsNameCol.pack_start(hiddenIconsNameRen, true);
		hiddenIconsStatusCol.pack_start(hiddenIconsStatusRen, true);
		hiddenIconsNameCol.add_attribute(hiddenIconsNameRen, "text", 0);
		hiddenIconsStatusCol.add_attribute(hiddenIconsStatusRen, "active", 1);
		hiddenIconsTreeView.append_column(hiddenIconsNameCol);
		hiddenIconsTreeView.append_column(hiddenIconsStatusCol);

		hiddenIconsStatusRen.connect("toggled", Lang.bind(this,
			function(o, path) {
				let wmClass = this.listIcons[path];
				let foundIndex = this.hiddenIcons.indexOf(wmClass);
				if (foundIndex > -1) {
					this.hiddenIcons.splice(foundIndex, 1);
				} else {
					this.hiddenIcons.push(wmClass);
				}
				this.settings.set_strv("hidden-icons", this.hiddenIcons);
			}
		));
		this.settings.connect("changed::current-icons",
			Lang.bind(this, this._updateIconsList));
		this.settings.connect("changed::hidden-icons",
			Lang.bind(this, this._updateIconsList));
		this._updateIconsList();

		topiconsSettingsGrid.attach(iconSizeLabel, 0, 0, 1, 1);
		topiconsSettingsGrid.attach(iconSizeWidget, 1, 0, 1, 1);
		topiconsSettingsGrid.attach(iconPaddingLabel, 0, 1, 1, 1);
		topiconsSettingsGrid.attach(iconPaddingWidget, 1, 1, 1, 1);

		topiconsSettingsMain.add(topiconsSettingsGrid);
		topiconsSettingsMain.add(hiddenIconsLabel);
		topiconsSettingsMain.add(hiddenIconsTreeView);

		topiconsSettings.add(topiconsSettingsControl);
		topiconsSettings.add(topiconsSettingsMain);

		// ABOUT
		let topiconsAbout = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL
		});
		let topiconsAboutTitle = new Gtk.Label({
			label: Gettext.gettext("About")
		});
		let topiconsAboutMain = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
			margin: 10
		});
		let topiconsAboutControl = new Gtk.Box({
			margin_left: 10, margin_right: 10
		});
		let topiconsAboutGrid= new Gtk.Grid();

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
	},

	_updateIconsList: function() {
		this.currentIcons = this.settings.get_strv("current-icons");
		this.hiddenIcons = this.settings.get_strv("hidden-icons");
		let hasCurrentIcons = this.currentIcons.length > 0;
		this.listIcons = hasCurrentIcons ? this.currentIcons : this.hiddenIcons;

		this.hiddenIconsListStore.clear();
		for (let i = 0; i < this.listIcons.length; i++) {
			let wmClass = this.listIcons[i];
			let hidden = this.hiddenIcons.indexOf(wmClass) > -1;
			this.hiddenIconsListStore.set(this.hiddenIconsListStore.append(),
				[ 0, 1 ],
				[ wmClass, hidden ]
			);
		}
	}
});

function buildPrefsWidget() {
	let widget = new TopIconsSettingsWidget({
		orientation: Gtk.Orientation.VERTICAL
	});
	widget.show_all();

	return widget;
}
