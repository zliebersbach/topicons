# Top Icons

A GNOME shell extension to show legacy tray icons in the top bar. This is a fork of a repo found [here](https://github.com/mjnaderi/TopTray).

## Prerequisites

*   GNOME Shell
*   GNOME Tweak Tool

## Installing

To install Top Icons, run the following commands in an empty directory:

    $ git clone https://github.com/wincinderith/topicons
    $ cd topicons
    $ make install

This will install into your user's extension directory (`~/.local/share/gnome-shell/extensions`). The install directory can be changed in the Makefile.

## Configuring

To enable and configure Top Icons, open GNOME Tweak tool and navigate to the extensions page.

## Updating

To update Top Icons, run the following command in the directory where the source code was downloaded:

    $ make update

## Uninstalling

To uninstall Top Icons, simply run the following command in the directory where the source code was downloaded:

    $ make uninstall
