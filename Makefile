# topicons, a GNOME shell extension to show legacy tray icons in the top bar.
# Copyright (C) 2015  Kevin Boxhoorn
#
# topicons is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# topicons is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with topicons.  If not, see <http://www.gnu.org/licenses/>.

EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions
EXT_NAME=topIcons@kevin.sarox.com.au

build: build-schema
	mkdir -vp build
	cp -vr schemas convenience.js extension.js metadata.json prefs.js build

build-schema: schemas/org.gnome.shell.extensions.topicons.gschema.xml
	glib-compile-schemas schemas

install: build
	mkdir -vp $(EXT_DIR)/$(EXT_NAME)
	cp -vr build/* $(EXT_DIR)/$(EXT_NAME)

uninstall:
	rm -vrf $(EXT_DIR)/$(EXT_NAME)

clean:
	rm -vrf build
	rm -v schemas/gschemas.compiled
