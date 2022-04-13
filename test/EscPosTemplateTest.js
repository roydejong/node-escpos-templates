const EscPosTemplate = require('../src/EscPosTemplate');

const MockPrinter = require('./mock/MockPrinter');
let mockPrinter = new MockPrinter();

const assert = require('assert');

describe('EscPosTemplate', () => {
  describe('#print()', () => {
    it('should throw on invalid data argument', () => {
      assert.throws(() => {
        const template = new EscPosTemplate("");
        template.print(mockPrinter, "not a data object");
      }, Error);
    });

    it('should use default variables for common strings', () => {
      mockPrinter.reset();
      const template = new EscPosTemplate("align center;");
      template.print(mockPrinter);
      assert.deepEqual(mockPrinter.commands, [`align:ct`]);
    });

    it('should correctly execute formatting commands', () => {
      mockPrinter.reset();
      const template = new EscPosTemplate(`align center; bold on; underline double;`);
      template.print(mockPrinter);
      assert.deepEqual(mockPrinter.commands, [`align:ct`, `text:\x1b\x45\x01`, `text:\x1b\x2d\x02`]);
    });

    it('should support iterations', () => {
      let arr = ["a", "b", "c", "d", "e"];
      mockPrinter.reset();
      const template = new EscPosTemplate(`loop arr; print item; endloop;`);
      template.print(mockPrinter, { arr });
      assert.deepEqual(mockPrinter.commands, [`text:a`, `text:b`, `text:c`, `text:d`, `text:e`]);
    });

    it('should support multi line iterations', () => {
      let arr = ["a", "b", "c", "d", "e"];
      mockPrinter.reset();
      const template = new EscPosTemplate(`loop arr
  print item
endloop`);
      template.print(mockPrinter, { arr });
      assert.deepEqual(mockPrinter.commands, [`text:a`, `text:b`, `text:c`, `text:d`, `text:e`]);
    });

    it('should support iterations with key-access', () => {
      let arr = [{ txt: "a" }, { txt: "b" }, { txt: "c" }, { txt: "d" }, { txt: "e" }];
      mockPrinter.reset();
      const template = new EscPosTemplate(`loop arr; print item.txt; endloop;`);
      template.print(mockPrinter, { arr });
      assert.deepEqual(mockPrinter.commands, [`text:a`, `text:b`, `text:c`, `text:d`, `text:e`]);
    });

    it('should support if-branches that evaluate to true', () => {
      mockPrinter.reset();
      const template = new EscPosTemplate(`if logicValue; print "test"; endif;`);
      template.print(mockPrinter, {
        logicValue: 1
      });
      assert.deepEqual(mockPrinter.commands, [`text:test`]);
    });

    it('should support if-branches that evaluate to false', () => {
      mockPrinter.reset();
      const template = new EscPosTemplate(`if logicValue; print "test"; endif;`);
      template.print(mockPrinter, {
        logicValue: 0
      });
      assert.deepEqual(mockPrinter.commands, []);
    });

    it('should support if-branches that are nested and mixed', () => {
      mockPrinter.reset();
      const template = new EscPosTemplate(`
      if logicValue1;
        print "level one";
        if logicValue2;
          print "level two";
          if logicValue3;
            print "level three";
          endif;
        endif;
      endif;
      `);
      template.print(mockPrinter, {
        logicValue1: true,
        logicValue2: "yeah",
        logicValue3: 0
      });
      assert.deepEqual(mockPrinter.commands, [`text:level one`, `text:level two`]);
    });
  });

  describe('#interpretLine()', () => {
    it('should do nothing for an empty line', () => {
      EscPosTemplate.interpretLine("", mockPrinter, { }, { });
    });

    it('should do nothing for a commented line', () => {
      EscPosTemplate.interpretLine("# this is a comment", mockPrinter, { }, { });
      EscPosTemplate.interpretLine("  # this is a tabbed comment", mockPrinter, { }, { });
    });

    it('should throw for a badly formatted line', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('"not valid"', mockPrinter, { }, { });
      }, /Unexpected start of string literal/);
    });

    it('should throw for an invalid command', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('invalid_command;', mockPrinter, { }, { });
      },/Command not implemented: invalid_command/);
    });

    it('should throw for an invalid variable reference', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('print undefined_var', mockPrinter, { }, { });
      },/Unresolved variable/);
    });

    it('should throw for an invalid variable count', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('print "var one" "var two";', mockPrinter, { }, { });
      },/Got 2 args, but expected at most 1/);
    });

    it('should execute chained commands', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print \"test\"; beep 1 10; feed 3; cut; cashdraw 1", mockPrinter, { }, { });
      assert.deepEqual(mockPrinter.commands, ["text:test", "beep:1:10", "feed:3", "cut:false:5", "cashdraw:1"]);
    });

    it('should execute commands with variables', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print varName", mockPrinter, {varName: "testval"}, { });
      assert.deepEqual(mockPrinter.commands, ["text:testval"]);
    });

    it('should execute commands with variables in string literals', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print \"Hello {{varName}}-{{ varName }}!\"", mockPrinter, {varName: "Bob"}, { });
      assert.deepEqual(mockPrinter.commands, ["text:Hello Bob-Bob!"]);
    });

    it('should execute commands with variables with key access in string literals', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print \"Hello {{varName.first}} {{ varName.last }}!\"", mockPrinter,
        {varName: {first: "Bob", last: "Smith"}}, { });
      assert.deepEqual(mockPrinter.commands, ["text:Hello Bob Smith!"]);
    });

    it('should correctly interpret escape sequences in string literals', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine(`print "This is an \\"escape\\" sequence test!"`, mockPrinter, { }, { });
      assert.deepEqual(mockPrinter.commands, [`text:This is an "escape" sequence test!`]);
    });
  });
});