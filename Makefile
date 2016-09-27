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

# Install directory
EXT_DIR=$(HOME)/.local/share/gnome-shell/extensions
EXT_NAME=topIcons@kevinboxhoorn.yahoo.com

.PHONY: build clean install uninstall fetch-updates update

build:
	mkdir -vp build
	cp -vr schemas convenience.js extension.js metadata.json prefs.js build
	glib-compile-schemas build/schemas
clean:
	rm -vrf build

install: build
	ln -sfn ${PWD}/build $(EXT_DIR)/$(EXT_NAME)
uninstall:
	rm -v $(EXT_DIR)/$(EXT_NAME)

fetch-updates:
	git reset --hard HEAD
	git pull --rebase --prune
update: clean fetch-updates build
