// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// jshint esnext:true

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

function init () {
	Convenience.initTranslations();
}

const TopIconsSettingsWidget = new GObject.Class({
	Name: "WorkspaceIndicator.TopIconsSettingsWidget",
	GTypeName: "TopIconsSettingsWidget",
	Extends: Gtk.Box,

	_init: function (params) {
		this.parent(params);
		this.settings = Convenience.getSettings();

		let notebook = new Gtk.Notebook();

		/* SETTINGS */

		let topiconsSettings = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
		let topiconsSettingsTitle = new Gtk.Label({ label: Gettext.gettext("Settings") });

		let topiconsSettingsMain = new Gtk.Box({ spacing: 30, orientation: Gtk.Orientation.HORIZONTAL, homogeneous: true, margin: 10});
		indentWidget(topiconsSettingsMain);

		let topiconsSettingsControl = new Gtk.Box({ spacing: 30, margin_left: 10, margin_top: 10, margin_right: 10 });

		/* Icon Size Setting */

		let topiconsSettingsGrid= new Gtk.Grid({ row_homogeneous: true, column_homogeneous: false});

		let iconSizeLabel = new Gtk.Label({ label: Gettext.gettext("Icon Size (px)"), use_markup: true, xalign: 0, hexpand: true});
		let iconSizeWidget = new Gtk.SpinButton({ halign:Gtk.Align.END });
		iconSizeWidget.set_sensitive(true);
		iconSizeWidget.set_range(0, 32);
		iconSizeWidget.set_value(this.settings.get_int("icon-size"));
		iconSizeWidget.set_increments(1, 2);
		iconSizeWidget.connect("value-changed", Lang.bind(this, function (button) {
			let s = button.get_value_as_int();
			this.settings.set_int("icon-size", s);
			Main.refresh();
		}));

		let iconPaddingLabel = new Gtk.Label({ label: Gettext.gettext("Icon Padding (px)"), use_markup: true, xalign: 0, hexpand: true});
		let iconPaddingWidget = new Gtk.SpinButton({ halign:Gtk.Align.END });
		iconPaddingWidget.set_sensitive(true);
		iconPaddingWidget.set_range(0, 32);
		iconPaddingWidget.set_value(this.settings.get_int("icon-padding"));
		iconPaddingWidget.set_increments(1, 2);
		iconPaddingWidget.connect("value-changed", Lang.bind(this, function (button) {
			let s = button.get_value_as_int();
			this.settings.set_int("icon-padding", s);
			Main.refresh();
		}));

		topiconsSettingsGrid.attach(iconSizeLabel, 0, 0, 1, 1);
		topiconsSettingsGrid.attach(iconSizeWidget, 1, 0, 1, 1);
		topiconsSettingsGrid.attach(iconPaddingLabel, 0, 1, 1, 1);
		topiconsSettingsGrid.attach(iconPaddingWidget, 1, 1, 1, 1);

		topiconsSettingsMain.add(topiconsSettingsGrid);

		topiconsSettings.add(topiconsSettingsControl);
		topiconsSettings.add(topiconsSettingsMain);

		notebook.append_page(topiconsSettings, topiconsSettingsTitle);

		this.add(notebook);
	}
});

function buildPrefsWidget () {
	let widget = new TopIconsSettingsWidget({ orientation: Gtk.Orientation.VERTICAL, spacing: 5, border_width: 5 });
	widget.show_all();

	return widget;
}

/*
 * Add a margin to the widget:
 *  left margin in LTR
 *  right margin in RTL
 */
function indentWidget (widget){
	let indent = 20;

	if(Gtk.Widget.get_default_direction() == Gtk.TextDirection.RTL){
		widget.set_margin_right(indent);
	} else {
		widget.set_margin_left(indent);
	}
}
