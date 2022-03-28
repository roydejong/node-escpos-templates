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

    const templateLines = this.templateText.split("\n");

    let lineNumber = 0;
    let didError = false;

    templateLines.forEach(line => {
      lineNumber++;

      if (didError)
        return;

      try {
        EscPosTemplate.interpretLine(line, printer, data)
      } catch (err) {
        didError = true;
        throw new Error(`Template error on line ${lineNumber}: ${err.message}`);
      }
    });

    return true;
  }

  static interpretLine(line, printer, data = null) {
    const instructions = line.split(";");
    instructions.forEach(instruction => {
      instruction = instruction.trim();

      if (instruction.length === 0)
        return;

      let buffer = "";
      let readingOpcode = true;
      let readingArgs = false;
      let readingStringLiteral = false;
      let readingEscapeSequence = false;
      let finalOpcode = null;
      let finalArgs = [];

      const _finalizeBufferPart = (wasStringLiteral = false) => {
        if (!buffer.length)
          return;

        if (readingOpcode) {
          finalOpcode = buffer;
          readingOpcode = false;
          readingArgs = true;
        } else if (readingArgs) {
          if (wasStringLiteral) {
            finalArgs.push(this.replaceVariables(buffer, data));
          } else {
            if (isNaN(buffer)) {
              if (data && typeof data[buffer] !== "undefined") {
                finalArgs.push(data[buffer]);
              } else {
                throw new Error(`Unresolved variable: ${buffer}`)
              }
            } else {
              finalArgs.push(parseInt(buffer));
            }
          }
        }

        buffer = "";
      };

      for (let i = 0; i < instruction.length; i++) {
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

      this.handleInterpretedLine(printer, finalOpcode, finalArgs);
    });
  }

  static handleInterpretedLine(printer, opcode, args) {
    TemplateCommandRegistry.invoke(printer, opcode, args);
  }

  static replaceVariables(templateText, variableData) {
    if (variableData) {
      for (const key in variableData) {
        templateText = templateText.replace(new RegExp('\\{\\{\\s?' + key + '\\s?\\}\\}', 'g'), variableData[key]);
      }
    }
    return templateText;
  }
}