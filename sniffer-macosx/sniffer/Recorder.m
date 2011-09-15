#import "Recorder.h"
#include "keycodes.h"
#include <Carbon/Carbon.h>
#import <AppKit/AppKit.h>

int64_t keycodeOfEvent(CGEventRef event)
{
    return CGEventGetIntegerValueField(event, kCGKeyboardEventKeycode);
}

NSString *keynameOfEvent(CGEventRef event)
{
    return keynameForKeycode(keycodeOfEvent(event));
}

BOOL isAutorepeat(CGEventRef event)
{
    return (BOOL)CGEventGetIntegerValueField(event, kCGKeyboardEventAutorepeat);
}

@implementation Recorder

// This works for flagsModified events too. */
- (void)handleKeyEvent:(CGEventRef)event action:(NSString*)action
{
    if (isAutorepeat(event))
        return;
    const char* string = [[NSString stringWithFormat:@"data:{'action':'%@','key':'%@'}\n\n", action, keynameOfEvent(event)] UTF8String];
    write(1, string, strlen(string));
}

- (void)handleFlagsEvent:(CGEventRef)event
{
    int64_t flags = CGEventGetFlags(event);
    int64_t keycode = keycodeOfEvent(event);
    int mask = eventFlagMaskForKeycode(keycode);
    if (!mask)
        return;
    [self handleKeyEvent:event action:((flags & mask) ? @"down" : @"up")];
}

- (void)tapDidReceiveEvent:(CGEventRef)event type:(CGEventType)type
{
    switch (type) {
        case kCGEventKeyDown: [self handleKeyEvent:event action:@"down"]; break;
        case kCGEventKeyUp: [self handleKeyEvent:event action:@"up"]; break;
        case kCGEventFlagsChanged: [self handleFlagsEvent:event]; break;
    }
}

CGEventRef onTapEvent(CGEventTapProxy proxy, CGEventType type, CGEventRef event, void* context)
{
    Recorder *recorder = (Recorder *)context;
    [recorder tapDidReceiveEvent:event type:type];
    return event;
}

- (void)run
{
    CFMachPortRef tap = CGEventTapCreate(kCGAnnotatedSessionEventTap, kCGHeadInsertEventTap, kCGEventTapOptionListenOnly,
                                         CGEventMaskBit(kCGEventKeyDown)
                                         | CGEventMaskBit(kCGEventKeyUp)
                                         | CGEventMaskBit(kCGEventFlagsChanged),
                                         onTapEvent, self);
    CFRunLoopSourceRef source = CFMachPortCreateRunLoopSource(NULL, tap, 0);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes);
    CGEventTapEnable(tap, true);
    [[NSRunLoop currentRunLoop] run];
}

@end
