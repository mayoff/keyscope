

# KeyScope

## Quick Start

1.  Run `keyscope.py`.

2.  If you get a popup window telling you that System Events is trying to unlock Universal Access preferences, enter your password.  You won't get this window if you have already enabled access for assistive devices in your System Preferences.  This must be enabled for KeyScope to sniff your keyboard.

3.  After `keyscope.py' prints `starting...', go to [`http://localhost:8000/`](http://localhost:8000/) in your browser.

4.  Do normal activities.  KeyScope will track your key presses even when you're using other windows and other applications.

## Building the sniffer

The sniffer is a small Objective-C command-line program.  The source
code is under `sniffer-macosx`.  I include an executable in the
distribution, but if you want to build it yourself, it's easy enough.
You can use Xcode, or you can run the `build.sh` script in the
`sniffer-macosx` directory:

    cd sniffer-macosx
    ./build.sh

That will compile the `sniffer` program and copy it to the `keyscope`
directory (or whatever directory is the parent of the `sniffer-macosx`
directory).  It uses the `xcodebuild` program.

