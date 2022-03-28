import * as assert from "assert";
import MockPrinter from "./mock/MockPrinter.js";
import {EscPosTemplate} from "../src/EscPosTemplate.js";

const templateText = "";
const template = new EscPosTemplate(templateText);
const mockPrinter = new MockPrinter();

describe('EscPosTemplate', () => {
  describe('#print()', () => {
    it('should throw on invalid printer argument', () => {
      assert.throws(() => {
        template.print({ "notAPrinter": true });
      }, Error);
    });

    it('should throw on invalid data argument', () => {
      assert.throws(() => {
        template.print(mockPrinter, "not a data object");
      }, Error);
    });
  });

  describe('#interpetLine()', () => {
    it('should do nothing for an empty line', () => {
      EscPosTemplate.interpretLine("", mockPrinter);
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
      },/Invalid amount of arguments for print: got 2, expected 1/);
    });
  });
});