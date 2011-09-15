#import <Foundation/Foundation.h>
#include <Carbon/Carbon.h>

// /System/Library/Frameworks/Carbon.framework/Frameworks/HIToolbox.framework/Headers/Events.h

#define kVK_RightCommand 0x36 // Missing from Events.h

static NSString *keynameMap[] = {
    [kVK_ANSI_A] = @"A",
    [kVK_ANSI_S] = @"S",
    [kVK_ANSI_D] = @"D",
    [kVK_ANSI_F] = @"F",
    [kVK_ANSI_H] = @"H",
    [kVK_ANSI_G] = @"G",
    [kVK_ANSI_Z] = @"Z",
    [kVK_ANSI_X] = @"X",
    [kVK_ANSI_C] = @"C",
    [kVK_ANSI_V] = @"V",
    [kVK_ANSI_B] = @"B",
    [kVK_ANSI_Q] = @"Q",
    [kVK_ANSI_W] = @"W",
    [kVK_ANSI_E] = @"E",
    [kVK_ANSI_R] = @"R",
    [kVK_ANSI_Y] = @"Y",
    [kVK_ANSI_T] = @"T",
    [kVK_ANSI_1] = @"1",
    [kVK_ANSI_2] = @"2",
    [kVK_ANSI_3] = @"3",
    [kVK_ANSI_4] = @"4",
    [kVK_ANSI_6] = @"6",
    [kVK_ANSI_5] = @"5",
    [kVK_ANSI_Equal] = @"Equal",
    [kVK_ANSI_9] = @"9",
    [kVK_ANSI_7] = @"7",
    [kVK_ANSI_Minus] = @"Minus",
    [kVK_ANSI_8] = @"8",
    [kVK_ANSI_0] = @"0",
    [kVK_ANSI_RightBracket] = @"RightBracket",
    [kVK_ANSI_O] = @"O",
    [kVK_ANSI_U] = @"U",
    [kVK_ANSI_LeftBracket] = @"LeftBracket",
    [kVK_ANSI_I] = @"I",
    [kVK_ANSI_P] = @"P",
    [kVK_ANSI_L] = @"L",
    [kVK_ANSI_J] = @"J",
    [kVK_ANSI_Quote] = @"Quote",
    [kVK_ANSI_K] = @"K",
    [kVK_ANSI_Semicolon] = @"Semicolon",
    [kVK_ANSI_Backslash] = @"Backslash",
    [kVK_ANSI_Comma] = @"Comma",
    [kVK_ANSI_Slash] = @"Slash",
    [kVK_ANSI_N] = @"N",
    [kVK_ANSI_M] = @"M",
    [kVK_ANSI_Period] = @"Period",
    [kVK_ANSI_Grave] = @"Grave",
    [kVK_ANSI_KeypadDecimal] = @"KeypadDecimal",
    [kVK_ANSI_KeypadMultiply] = @"KeypadMultiply",
    [kVK_ANSI_KeypadPlus] = @"KeypadPlus",
    [kVK_ANSI_KeypadClear] = @"KeypadClear",
    [kVK_ANSI_KeypadDivide] = @"KeypadDivide",
    [kVK_ANSI_KeypadEnter] = @"KeypadEnter",
    [kVK_ANSI_KeypadMinus] = @"KeypadMinus",
    [kVK_ANSI_KeypadEquals] = @"KeypadEquals",
    [kVK_ANSI_Keypad0] = @"Keypad0",
    [kVK_ANSI_Keypad1] = @"Keypad1",
    [kVK_ANSI_Keypad2] = @"Keypad2",
    [kVK_ANSI_Keypad3] = @"Keypad3",
    [kVK_ANSI_Keypad4] = @"Keypad4",
    [kVK_ANSI_Keypad5] = @"Keypad5",
    [kVK_ANSI_Keypad6] = @"Keypad6",
    [kVK_ANSI_Keypad7] = @"Keypad7",
    [kVK_ANSI_Keypad8] = @"Keypad8",
    [kVK_ANSI_Keypad9] = @"Keypad9",
    [kVK_Return] = @"Return",
    [kVK_Tab] = @"Tab",
    [kVK_Space] = @"Space",
    [kVK_Delete] = @"Delete",
    [kVK_Escape] = @"Escape",
    [kVK_Command] = @"Command",
    [kVK_Shift] = @"Shift",
    [kVK_CapsLock] = @"CapsLock",
    [kVK_Option] = @"Option",
    [kVK_Control] = @"Control",
    [kVK_RightCommand] = @"RightCommand",
    [kVK_RightShift] = @"RightShift",
    [kVK_RightOption] = @"RightOption",
    [kVK_RightControl] = @"RightControl",
    [kVK_Function] = @"Function",
    [kVK_F17] = @"F17",
    [kVK_VolumeUp] = @"VolumeUp",
    [kVK_VolumeDown] = @"VolumeDown",
    [kVK_Mute] = @"Mute",
    [kVK_F18] = @"F18",
    [kVK_F19] = @"F19",
    [kVK_F20] = @"F20",
    [kVK_F5] = @"F5",
    [kVK_F6] = @"F6",
    [kVK_F7] = @"F7",
    [kVK_F3] = @"F3",
    [kVK_F8] = @"F8",
    [kVK_F9] = @"F9",
    [kVK_F11] = @"F11",
    [kVK_F13] = @"F13",
    [kVK_F16] = @"F16",
    [kVK_F14] = @"F14",
    [kVK_F10] = @"F10",
    [kVK_F12] = @"F12",
    [kVK_F15] = @"F15",
    [kVK_Help] = @"Help",
    [kVK_Home] = @"Home",
    [kVK_PageUp] = @"PageUp",
    [kVK_ForwardDelete] = @"ForwardDelete",
    [kVK_F4] = @"F4",
    [kVK_End] = @"End",
    [kVK_F2] = @"F2",
    [kVK_PageDown] = @"PageDown",
    [kVK_F1] = @"F1",
    [kVK_LeftArrow] = @"LeftArrow",
    [kVK_RightArrow] = @"RightArrow",
    [kVK_DownArrow] = @"DownArrow",
    [kVK_UpArrow] = @"UpArrow",
    [kVK_ISO_Section] = @"Section",
    [kVK_JIS_Yen] = @"Yen",
    [kVK_JIS_Underscore] = @"Underscore",
    [kVK_JIS_KeypadComma] = @"KeypadComma",
    [kVK_JIS_Eisu] = @"Eisu",
    [kVK_JIS_Kana] = @"Kana"
};

static const int64_t keynameMapLength = sizeof(keynameMap) / sizeof(*keynameMap);

NSString *keynameForKeycode(int64_t keycode)
{
    return keycode >= 0 && keycode < keynameMapLength && keynameMap[keycode]
        ? keynameMap[keycode]
        : [NSString stringWithFormat:@"(%#llx)", keycode];
}


int eventFlagMaskForKeycode(int64_t keycode)
{
    // /System/Library/Frameworks/IOKit.framework/Versions/A/Headers/hidsystem/IOLLEvent.h

    switch (keycode) {    
        case kVK_Command: return NX_DEVICELCMDKEYMASK;
        case kVK_Shift: return NX_DEVICELSHIFTKEYMASK;
        case kVK_CapsLock: return NX_ALPHASHIFTMASK;
        case kVK_Option: return NX_DEVICELALTKEYMASK;
        case kVK_Control: return NX_DEVICELCTLKEYMASK;
        case kVK_RightCommand: return NX_DEVICERCMDKEYMASK;
        case kVK_RightShift: return NX_DEVICERSHIFTKEYMASK;
        case kVK_RightOption: return NX_DEVICERALTKEYMASK;
        case kVK_RightControl: return NX_DEVICERCTLKEYMASK;
        case kVK_Function: return NX_SECONDARYFNMASK;
        default: return 0;
    }
}
