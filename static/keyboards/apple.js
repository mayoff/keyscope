

module.define('keyboards/apple', function (require, exports) {

    var KeyboardMaker = require('./maker').KeyboardMaker;

    exports.keyboard = function (props) {
        var maker = new KeyboardMaker(props);

        var kFKeyHeight = 9;
        var kGroupSeparation1 = 9.9;
        var kGroupSeparation2 = 10;

        var fKeyProps = { width: 16, height: kFKeyHeight, separation: 3.7 };
        maker
            .keys('Escape F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Eject', fKeyProps)
            .right(kGroupSeparation1).keys('F13 F14 F15', { height: kFKeyHeight })
            .right(kGroupSeparation2).keys('F16 F17 F18 F19', { height: kFKeyHeight });

        maker.newRow(13)
            .keys('Grave 1 2 3 4 5 6 7 8 9 0 Minus Equal').right()
            .wideKey('Delete', 25.1)
            .right(kGroupSeparation1).keys('Function Home PageUp')
            .right(kGroupSeparation2).keys('KeypadClear KeypadEquals KeypadDivide KeypadMultiply');

        maker.newRow()
            .wideKey('Tab', 25.1).right()
            .keys('Q W E R T Y U I O P LeftBracket RightBracket Backslash')
            .right(kGroupSeparation1).keys('ForwardDelete End PageDown')
            .right(kGroupSeparation2).keys('Keypad7 Keypad8 Keypad9 KeypadMinus');

        maker.newRow()
            .wideKey('CapsLock', 30).right()
            .keys('A S D F G H J K L Semicolon Quote').right()
            .wideKey('Return', 29.1)
            .right(kGroupSeparation1).nokeys(3)
            .right(kGroupSeparation2).keys('Keypad4 Keypad5 Keypad6 KeypadPlus');

        maker.newRow()
            .wideKey('Shift', 39).right()
            .keys('Z X C V B N M Comma Period Slash').right()
            .wideKey('RightShift', 39.1)
            .right(kGroupSeparation1)
            .nokeys(1).right().key('UpArrow').right().nokeys(1)
            .right(kGroupSeparation2).keys('Keypad1 Keypad2 Keypad3')
            .right().key('KeypadEnter', { height: 34 });

        maker.newRow()
            .wideKey('Control', 25).right()
            .wideKey('Option', 20).right()
            .wideKey('Command', 24).right()
            .wideKey('Space', 110).right()
            .wideKey('RightCommand', 24).right()
            .wideKey('RightOption', 20).right()
            .wideKey('RightControl', 25)
            .right(kGroupSeparation1).keys('LeftArrow DownArrow RightArrow')
            .right(kGroupSeparation2).wideKey('Keypad0', 34).right()
            .key('KeypadDecimal');

	maker.fingers({
	    L5: 'Escape Tilde 1 Tab Q CapsLock A Shift Z Control',
	    L4: '2 W S X',
	    L3: '3 E D C',
	    L2: '4 R F V 5 T G B',
	    L1: 'Option Command',
	    R1: 'Space RightCommand RightOption LeftArrow',
	    R2: '6 Y H N 7 U J M UpArrow DownArrow',
	    R3: '8 I K Comma RightArrow',
	    R4: '9 O L Period',
	    R5: '0 P Semicolon Slash Minus LeftBracket Quote Equal RightBracket Delete Backslash Return RightShift'
	});

        return maker.getKeyboard();
    };

});

