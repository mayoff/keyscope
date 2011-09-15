#!/usr/bin/python

# Quartz is part of PyObjC, which comes standard on at least Mac OS X 10.6 and 10.7.
from Quartz import *

import json
import signal
import sys

# Try to make sure access for assistive devices is enabled, since the event tap won't work without it.
import subprocess
subprocess.call(['osascript', '-e', 'tell app "System Events" to set UI elements enabled to true'])

#/System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/Headers/Events.h
keynameForKeycode = ['A', 'S', 'D', 'F', 'H', 'G', 'Z', 'X', 'C', 'V', 'Section', 'B', 'Q', 'W', 'E', 'R', 'Y', 'T', '1', '2', '3', '4', '6', '5', 'Equal', '9', '7', 'Minus', '8', '0', 'RightBracket', 'O', 'U', 'LeftBracket', 'I', 'P', 'Return', 'L', 'J', 'Quote', 'K', 'Semicolon', 'Backslash', 'Comma', 'Slash', 'N', 'M', 'Period', 'Tab', 'Space', 'Grave', 'Delete', '0x34', 'Escape', 'RightCommand', 'Command', 'Shift', 'CapsLock', 'Option', 'Control', 'RightShift', 'RightOption', 'RightControl', 'Function', 'F17', 'KeypadDecimal', '0x42', 'KeypadMultiply', '0x44', 'KeypadPlus', '0x46', 'KeypadClear', 'VolumeUp', 'VolumeDown', 'Mute', 'KeypadDivide', 'KeypadEnter', '0x4d', 'KeypadMinus', 'F18', 'F19', 'KeypadEquals', 'Keypad0', 'Keypad1', 'Keypad2', 'Keypad3', 'Keypad4', 'Keypad5', 'Keypad6', 'Keypad7', 'F20', 'Keypad8', 'Keypad9', 'Yen', 'Underscore', 'KeypadComma', 'F5', 'F6', 'F7', 'F3', 'F8', 'F9', 'Eisu', 'F11', 'Kana', 'F13', 'F16', 'F14', '0x6c', 'F10', '0x6e', 'F12', '0x70', 'F15', 'Help', 'Home', 'PageUp', 'ForwardDelete', 'F4', 'End', 'F2', 'PageDown', 'F1', 'LeftArrow', 'RightArrow', 'DownArrow', 'UpArrow']

#/System/Library/Frameworks/IOKit.framework/Versions/A/Headers/hidsystem/IOLLEvent.h
eventFlagMaskForKeyname = {
    'Command': 0x00000008,
    'Shift': 0x00000002,
    'CapsLock': 0x00010000,
    'Option': 0x00000020,
    'Control': 0x00000001,
    'RightCommand': 0x00000010,
    'RightShift': 0x00000004,
    'RightOption': 0x00000040,
    'RightControl': 0x00002000,
    'Function': 0x00800000,
}

def keynameOfEvent(event):
    keycode = CGEventGetIntegerValueField(event, kCGKeyboardEventKeycode)
    if keycode >= 0 and keycode < len(keynameForKeycode):
        return keynameForKeycode[keycode]
    else:
        return '0x%x' % keycode

class Sniffer(object):
    isLeaf = True

    def __init__(self):
        self.__initEventTap()

    def __initEventTap(self):
        eventMask = (0
            | CGEventMaskBit(kCGEventKeyDown)
            | CGEventMaskBit(kCGEventKeyUp)
            | CGEventMaskBit(kCGEventFlagsChanged)
        )
        tap = CGEventTapCreate(kCGAnnotatedSessionEventTap, kCGHeadInsertEventTap, kCGEventTapOptionListenOnly, eventMask, self.__onTapEvent, None)
        source = CFMachPortCreateRunLoopSource(None, tap, 0)
        CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes)
        CGEventTapEnable(tap, True)

    def __onTapEvent(self
        , proxy # CGEventTapProxy
        , type # CGEventType
        , event # CGEventRef
        , context # void*
    ):
        message = { 'key': keynameOfEvent(event) }
        if type == kCGEventKeyDown:
            if CGEventGetIntegerValueField(event, kCGKeyboardEventAutorepeat):
                return
            message['action'] = 'down'
        elif type == kCGEventKeyUp:
            message['action'] = 'up'
        elif type == kCGEventFlagsChanged:
            flags = CGEventGetFlags(event)
            mask = eventFlagMaskForKeyname.get(message['key'])
            if not mask:
                # This happens after command-tab
                return
            message['action'] = 'down' if (flags & mask) else 'up'
        else:
            return

	sys.stdout.write('data:' + json.dumps(message) + '\n\n')
	sys.stdout.flush()

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    signal.signal(signal.SIGTERM, signal.SIG_DFL)
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    sniffer = Sniffer()
    CFRunLoopRun()
