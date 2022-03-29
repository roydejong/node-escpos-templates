import * as assert from "assert";
import MockPrinter from "./mock/MockPrinter.js";
import {EscPosTemplate} from "../src/EscPosTemplate.js";

const mockPrinter = new MockPrinter();

describe('EscPosTemplate', () => {
  describe('#print()', () => {
    it('should throw on invalid printer argument', () => {
      assert.throws(() => {
        const template = new EscPosTemplate("");
        template.print({ "notAPrinter": true });
      }, Error);
    });

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
  });

  describe('#interpetLine()', () => {
    it('should do nothing for an empty line', () => {
      EscPosTemplate.interpretLine("", mockPrinter);
    });

    it('should do nothing for a commented line', () => {
      EscPosTemplate.interpretLine("# this is a comment", mockPrinter);
    });

    it('should throw for a badly formatted line', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('"not valid"', mockPrinter);
      }, /Unexpected start of string literal/);
    });

    it('should throw for an invalid command', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('invalid_command;', mockPrinter);
      },/Command not implemented: invalid_command/);
    });

    it('should throw for an invalid variable reference', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('print undefined_var', mockPrinter);
      },/Unresolved variable/);
    });

    it('should throw for an invalid variable count', () => {
      assert.throws(() => {
        EscPosTemplate.interpretLine('print "var one" "var two";', mockPrinter);
      },/Got 2 args, but expected at most 1/);
    });

    it('should execute chained commands', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print \"test\"; beep 1 10; feed 3; cut; cashdraw 1", mockPrinter);
      assert.deepEqual(mockPrinter.commands, ["text:test", "beep:1:10", "feed:3", "cut:false:5", "cashdraw:1"]);
    });

    it('should execute commands with variables', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print varName", mockPrinter, {varName: "testval"});
      assert.deepEqual(mockPrinter.commands, ["text:testval"]);
    });

    it('should execute commands with variables in string literals', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine("print \"Hello {{varName}}-{{ varName }}!\"", mockPrinter, {varName: "Bob"});
      assert.deepEqual(mockPrinter.commands, ["text:Hello Bob-Bob!"]);
    });

    it('should correctly interpret escape sequences in string literals', () => {
      mockPrinter.reset();
      EscPosTemplate.interpretLine(`print "This is an \\"escape\\" sequence test!"`, mockPrinter);
      assert.deepEqual(mockPrinter.commands, [`text:This is an "escape" sequence test!`]);
    });
  });
});