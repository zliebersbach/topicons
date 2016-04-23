// jshint esnext:true
/*
   topicons, a GNOME shell extension to show legacy tray icons in the top bar.
   Copyright (C) 2015  Kevin Boxhoorn

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

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Meta = imports.gi.Meta;
const Mainloop = imports.mainloop;
const NotificationDaemon = imports.ui.notificationDaemon;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

let trayAddedId = 0;
let trayRemovedId = 0;
let getSource = null;
let icons = [];
let notificationDaemon;
let schema;

function init() {
	if (Main.legacyTray) {
		notificationDaemon = Main.legacyTray;
		NotificationDaemon.STANDARD_TRAY_ICON_IMPLEMENTATIONS = imports.ui.legacyTray.STANDARD_TRAY_ICON_IMPLEMENTATIONS;
	}
	else if (Main.notificationDaemon._fdoNotificationDaemon) {
		notificationDaemon = Main.notificationDaemon._fdoNotificationDaemon;
		getSource = Lang.bind(notificationDaemon, NotificationDaemon.FdoNotificationDaemon.prototype._getSource);
	}
	else {
		notificationDaemon = Main.notificationDaemon;
		getSource = Lang.bind(notificationDaemon, NotificationDaemon.NotificationDaemon.prototype._getSource);
	}

	schema = Convenience.getSettings();
	// we need to refresh icons when user changes settings
	schema.connect("changed::icon-size", Lang.bind(this, refresh));
	schema.connect("changed::icon-padding", Lang.bind(this, refresh));
}

function enable() {
	GLib.idle_add(GLib.PRIORITY_LOW, moveToTop);
}

function disable() {
	moveToTray();
}

function createSource(title, pid, ndata, sender, trayIcon) {
	if (trayIcon) {
		onTrayIconAdded(this, trayIcon, title);
		return null;
	}

	return getSource(title, pid, ndata, sender, trayIcon);
}

function onTrayIconAdded(o, icon, role) {
	let wmClass = icon.wm_class ? icon.wm_class.toLowerCase() : "";
	if (NotificationDaemon.STANDARD_TRAY_ICON_IMPLEMENTATIONS[wmClass] !== undefined)
		return;

	let buttonBox = new PanelMenu.ButtonBox();
	let box = buttonBox.actor;
	let parent = box.get_parent();

	let iconSize = getIconSize();
	icon.set_size(iconSize, iconSize);
	icon.reactive = true;

	box.add_actor(icon);
	box.set_style(getIconStyle());
	if (parent)
		parent.remove_actor(box);

	icons.push(icon);
	Main.panel._rightBox.insert_child_at_index(box, 0);

	let clickProxy = new St.Bin({ width: iconSize, height: iconSize });
	clickProxy.reactive = true;
	Main.uiGroup.add_actor(clickProxy);

	icon._proxyAlloc = Main.panel._rightBox.connect("allocation-changed", function() {
		Meta.later_add(Meta.LaterType.BEFORE_REDRAW, function() {
			let [x, y] = icon.get_transformed_position();
			clickProxy.set_position(x, y);
		});
	});

	icon.connect("destroy", function() {
		Main.panel._rightBox.disconnect(icon._proxyAlloc);
		clickProxy.destroy();
	});

	clickProxy.connect("button-release-event", function(actor, event) {
		icon.click(event);
	});

	icon._clickProxy = clickProxy;
}

function onTrayIconRemoved(o, icon) {
	let parent = icon.get_parent();
	parent.destroy();
	icon.destroy();
	icons.splice(icons.indexOf(icon), 1);
}

function moveToTop() {
	notificationDaemon._trayManager.disconnect(notificationDaemon._trayIconAddedId);
	notificationDaemon._trayManager.disconnect(notificationDaemon._trayIconRemovedId);
	trayAddedId = notificationDaemon._trayManager.connect("tray-icon-added", onTrayIconAdded);
	trayRemovedId = notificationDaemon._trayManager.connect("tray-icon-removed", onTrayIconRemoved);

	notificationDaemon._getSource = createSource;

	let toDestroy = [];
	if (notificationDaemon._sources) {
		for (let i = 0; i < notificationDaemon._sources.length; i++) {
			let source = notificationDaemon._sources[i];
			if (!source.trayIcon)
				continue;
			let parent = source.trayIcon.get_parent();
			parent.remove_actor(source.trayIcon);
			onTrayIconAdded(this, source.trayIcon, source.initialTitle);
			toDestroy.push(source);
		}
	}
	else {
		for (let i = 0; i < notificationDaemon._iconBox.get_n_children(); i++) {
			let button = notificationDaemon._iconBox.get_child_at_index(i);
			let icon = button.child;
			button.remove_actor(icon);
			onTrayIconAdded(this, icon, "");
			toDestroy.push(button);
		}
	}

	for (let i = 0; i < toDestroy.length; i++) {
		toDestroy[i].destroy();
	}
}

function moveToTray() {
	if (trayAddedId !== 0) {
		notificationDaemon._trayManager.disconnect(trayAddedId);
		trayAddedId = 0;
	}

	if (trayRemovedId !== 0) {
		notificationDaemon._trayManager.disconnect(trayRemovedId);
		trayRemovedId = 0;
	}

	notificationDaemon._trayIconAddedId = notificationDaemon._trayManager.connect("tray-icon-added",
		Lang.bind(notificationDaemon, notificationDaemon._onTrayIconAdded));
	notificationDaemon._trayIconRemovedId = notificationDaemon._trayManager.connect("tray-icon-removed",
		Lang.bind(notificationDaemon, notificationDaemon._onTrayIconRemoved));
	notificationDaemon._getSource = getSource;

	for (let i = 0; i < icons.length; i++) {
		let icon = icons[i];
		let parent = icon.get_parent();
		if (icon._clicked) {
			icon.disconnect(icon._clicked);
		}
		icon._clicked = undefined;
		if (icon._proxyAlloc) {
			Main.panel._rightBox.disconnect(icon._proxyAlloc);
		}
		icon._clickProxy.destroy();
		parent.remove_actor(icon);
		parent.destroy();
		notificationDaemon._onTrayIconAdded(notificationDaemon, icon);
	}

	icons = [];
}

function refresh() {
	let iconSize = getIconSize();
	let iconStyle = getIconStyle();

	for (let i = 0; i < icons.length; i++) {
		let icon = icons[i];
		icon.set_size(iconSize, iconSize);
		icon.get_parent().set_style(iconStyle);
	}
}

function getIconSize() {
	let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
	return schema.get_int("icon-size") * scaleFactor;
}
function getIconStyle() {
	return "-natural-hpadding: %dpx".format(schema.get_int("icon-padding"));
}
