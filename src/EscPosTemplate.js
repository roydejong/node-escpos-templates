import {Printer} from "escpos";
import MockPrinter from "../test/mock/MockPrinter.js";
import TemplateCommandRegistry from "./TemplateCommandRegistry.js";

export class EscPosTemplate {
  constructor(templateText) {
    this.templateText = templateText || "";
  }

  print(printer, data) {
    if (!(printer instanceof Printer) && !(printer instanceof MockPrinter))
      throw new Error("Invalid data argument: must provide escpos printer instance");

    if (data && typeof data !== "object")
      throw new Error("Invalid data argument: must be object or null");

    if (!data) {
      data = {};
    }
    data = Object.assign({ }, data, EscPosTemplate.defaultVars);

    const templateLines = this.templateText.split("\n");

    let lineNumber = 0;
    let didError = false;
    let state = { };

    templateLines.forEach(line => {
      lineNumber++;

      if (didError)
        return;

      try {
        EscPosTemplate.interpretLine(line, printer, data, state);
      } catch (err) {
        didError = true;
        throw new Error(`Template error on line ${lineNumber}: ${err}`);
      }
    });

    return true;
  }

  static interpretLine(line, printer, data = null, state = null) {
    if (!line || line.startsWith('#'))
      return;

    if (!state)
      if (printer instanceof MockPrinter)
        state = { };
      else
        throw new Error("interpretLine() should not be called without a shared state object");

    const instructions = line.split(";");
    instructions.forEach(instruction => {
      this.interpretInstruction(instruction, printer, data, state);
    });
  }

  static interpretInstruction(instruction, printer, data = null, state = null) {
    if (!instruction || instruction.startsWith('#'))
      return;

    if (!state)
      throw new Error("interpretInstruction() should never be called without a shared state object");

    instruction = instruction.trim();
    
    let buffer = "";
    let readingOpcode = true;
    let readingArgs = false;
    let readingStringLiteral = false;
    let readingEscapeSequence = false;
    let finalOpcode = null;
    let finalArgs = [];
    let abortRead = false;

    const _finalizeBufferPart = (wasStringLiteral = false) => {
      if (!buffer.length)
        return;

      if (readingOpcode) {
        finalOpcode = buffer;
        readingOpcode = false;
        readingArgs = true;

        if (state.iteratorTarget) {
          // Active loop: stop interpreting, this line will not be executed in this scope
          abortRead = true;
        }
      } else if (readingArgs) {
        if (wasStringLiteral) {
          finalArgs.push(this.replaceVariables(buffer, data));
        } else {
          const resolvedArg = this.resolveArg(data, buffer);
          if (resolvedArg) {
            finalArgs.push(resolvedArg);
          } else {
            throw new Error(`Unresolved variable: ${buffer}`)
          }
        }
      }

      buffer = "";
    };

    for (let i = 0; i < instruction.length; i++) {
      if (abortRead)
        break;

      const char = instruction[i];

      if (readingEscapeSequence) {
        // Reading escape sequence: buffer one character while ignoring its syntax meaning
        buffer += char;
        readingEscapeSequence = false;
        continue;
      } else if (char === '\\') {
        // Beginning escape sequence: ignore this character, and escape the following one
        readingEscapeSequence = true;
        continue;
      } else if (readingStringLiteral) {
        // Reading string literal: keep buffering characters until we hit unescaped end quote
        if (char === '"') {
          readingStringLiteral = false;
          _finalizeBufferPart(true);
        } else {
          buffer += char;
        }
        continue;
      } else if (char === '"') {
        // Beginning string literal: ignore this character, and buffer all the following ones until end of literal
        if (readingOpcode || buffer.length) {
          throw new Error("Unexpected start of string literal (\")");
        }
        readingStringLiteral = true;
        continue;
      } else if (char === ' ' || char === '\t' || char === '\r') {
        // Character denoting the end of the line or current part
        _finalizeBufferPart();
        continue;
      }

      // General buffered character
      buffer += char;
    }

    _finalizeBufferPart();

    if (finalOpcode === "loop") {
      // Beginning of loop: start capturing loop lines
      if (finalArgs.length !== 1)
        throw new Error("loop: only expected 1 arg");

      const iteratorTarget = finalArgs[0];

      if (!Array.isArray(iteratorTarget))
        throw new Error(`loop: iterator target must be array, got ${iteratorTarget}`);

      state.iteratorTarget = iteratorTarget;
      state.iteratorInstructions = [];
    } else if (finalOpcode === "endloop") {
      // Ending of loop: perform iteration
      if (finalArgs.length)
        throw new Error("endloop: unexpected args");

      if (!state.iteratorTarget)
        throw new Error("unexpected endloop: not iterating");

      for (let i = 0; i < state.iteratorTarget.length; i++) {
        let subState = {};
        let mergedData = Object.assign({}, data);
        state.iteratorInstructions.forEach(iInst => {
          mergedData = Object.assign(mergedData, {item: state.iteratorTarget[i]});
          this.interpretInstruction(iInst, printer, mergedData, subState);
        });
      }

      state.iteratorTarget = null;
      state.iteratorInstructions = null;
    } else if (state.iteratorTarget) {
      // Active loop
      state.iteratorInstructions.push(instruction);
    } else {
      this.handleInterpretedLine(printer, finalOpcode, finalArgs);
    }
  }

  static handleInterpretedLine(printer, opcode, args) {
    TemplateCommandRegistry.invoke(printer, opcode, args);
  }

  static replaceVariables(templateText, variableData) {
    if (!templateText || !variableData)
      return templateText;

    // Detect vars
    let replaceList = { };
    templateText.match(new RegExp('\\{\\{\\s?(.*?)\\s?\\}\\}', 'g')).forEach((match) => {
      // Do something with each element
      let innerText = match.substring(2, match.length - 2).trim();
      if (typeof replaceList[innerText] === "undefined") {
        const resolvedArg = this.resolveArg(variableData, innerText);
        if (resolvedArg) {
          replaceList[innerText] = resolvedArg;
        } else {
          console.warn(`Unresolved variable in template expression: ${match}`);
        }
      }
    });

    // Replace vars
    Object.entries(replaceList).forEach(([key, value]) => {
      templateText = templateText.replace(new RegExp('\\{\\{\\s?' + key + '\\s?\\}\\}', 'g'), value);
    });
    return templateText;
  }

  static setEnableBarcodeParityBit(toggle) {
    this.enableBarcodeParityBit = !!toggle;
  }

  static resolveArg(data, inputText) {
    if (isNaN(inputText)) {
      if (data && typeof data[inputText] !== "undefined") {
        // Directly resolve to a variable
        return data[inputText];
      } else {
        // Check if accessor was used to access a key on a variable
        let accessorResolved = false;
        let accessedVariable = null;

        if (inputText.indexOf('.') >= 0) {
          let accessorParts = inputText.split('.');
          accessedVariable = data;

          for (let i = 0; i < accessorParts.length; i++) {
            let accessorPart = accessorParts[i];
            if (accessedVariable && typeof accessedVariable[accessorPart] !== "undefined") {
              accessedVariable = accessedVariable[accessorPart];
              if (i === (accessorParts.length - 1)) {
                accessorResolved = true;
              }
            } else {
              break;
            }
          }
        }

        if (accessorResolved) {
          return accessedVariable;
        } else {
          return null;
        }
      }
    } else {
      return parseInt(inputText);
    }
  }
}

EscPosTemplate.defaultVars = {
  true: true,
  false: false,
  on: true,
  off: false,
  double: "double",
  left: "left",
  center: "center",
  right: "right",
  a: "a",
  b: "b",
  c: "c"
};

EscPosTemplate.setEnableBarcodeParityBit(true);