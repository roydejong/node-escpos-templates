import TemplateCommand from "./TemplateCommand.js";
import {ArgValidation} from "./ArgValidation.js";
import {EscPosTemplate} from "./EscPosTemplate.js";
import {Image} from "escpos";

export default class TemplateCommandRegistry {
  static init() {
    this.commands = { };

    this.add(new TemplateCommand(
      "init",
      (printer, args) =>
        printer.text("\x1b\x40"),
      ArgValidation.Exactly(0)
    ));

    this.add(new TemplateCommand(
      "print",
      (printer, args) => {
        const arg = args[0];

        if (typeof arg === "object" && arg instanceof Image) {
          this.invoke(printer, "image", [arg]);
        } else {
          printer.text(arg.toString());
        }
      },
      ArgValidation.Exactly(1)
    ));

    this.add(new TemplateCommand(
      "feed",
      (printer, args) =>
        printer.feed(parseInt(args[0]) || 1),
      ArgValidation.AtMost(1)
    ));

    this.add(new TemplateCommand(
      "beep",
      (printer, args) => {
        const amount = parseInt(args[0]) || 1;
        const length = parseInt(args[1]) || 1;
        printer.beep(amount, length);
      },
      ArgValidation.AtMost(2)
    ));

    this.add(new TemplateCommand(
      "cut",
      (printer, args) => {
        const feedAmount = parseInt(args[0]) || 5;
        printer.cut(false, feedAmount)
      },
      ArgValidation.AtMost(1)
    ));

    this.add(new TemplateCommand(
      "cashdraw",
      (printer, args) =>
        printer.cashdraw(parseInt(args[0]) || 2),
      ArgValidation.AtMost(1)
    ));

    this.add(new TemplateCommand(
      "align",
      (printer, args) => {
        switch (args[0]) {
          case "l":
          case "lt":
          case "left":
            printer.align("lt");
            break;
          case "c":
          case "ct":
          case "center":
            printer.align("ct");
            break;
          case "r":
          case "rt":
          case "right":
            printer.align("rt");
            break;
          default:
            throw new Error($`Invalid align mode: ${args[0]}`);
        }
      },
      ArgValidation.Exactly(1)
    ));

    this.add(new TemplateCommand(
      "bold",
      (printer, args) => {
        switch (args[0].toString()) {
          case "1":
          case "true":
          case "on":
            printer.text("\x1b\x45\x01"); // Bold font ON
            break;
          case "0":
          case "false":
          case "off":
            printer.text("\x1b\x45\x00"); // Bold font OFF
            break;
          default:
            throw new Error($`Invalid bold mode: ${args[0]}`);
        }
      },
      ArgValidation.Exactly(1)
    ));

    this.add(new TemplateCommand(
      "underline",
      (printer, args) => {
        switch (args[0].toString()) {
          case "1":
          case "true":
          case "on":
            printer.text("\x1b\x2d\x01"); // Underline font 1-dot ON
            break;
          case "2":
          case "double":
            printer.text("\x1b\x2d\x02"); // Underline font 2-dot ON
            break;
          case "0":
          case "false":
          case "off":
            printer.text("\x1b\x2d\x00"); // Underline font OFF
            break;
          default:
            throw new Error($`Invalid underline mode: ${args[0]}`);
        }
      },
      ArgValidation.Exactly(1)
    ));

    this.add(new TemplateCommand(
      "font",
      (printer, args) => {
        switch (args[0].toString()) {
          case "a":
            printer.font('a');
            break;
          case "b":
            printer.font('b');
            break;
          default:
            throw new Error($`Invalid font mode: ${args[0]}`);
        }
      },
      ArgValidation.Exactly(1)
    ));

    this.add(new TemplateCommand(
      "fontsize",
      (printer, args) => {
        let w = parseInt(args[0]);
        let h = parseInt(args[1]);
        printer.size(w, h);
      },
      ArgValidation.Exactly(2)
    ));

    this.add(new TemplateCommand(
      "reset",
      (printer, args) => {
        this.invoke(printer, "align", ["left"]);
        this.invoke(printer, "bold", ["off"]);
        this.invoke(printer, "underline", ["off"]);
        this.invoke(printer, "font", ["a"]);
        this.invoke(printer, "fontsize", [1, 1]);
      },
      ArgValidation.Exactly(0)
    ));

    this.add(new TemplateCommand(
      "image",
      async (printer, args) => {
        const image = args[0];
        const density = args[1]?.toString();

        await printer.image(image, density);
      },
      ArgValidation.AtLeast(1)
    ));

    this.add(new TemplateCommand(
      "barcode",
      (printer, args) => {
        const type = args[0].toString().toUpperCase().replaceAll("-", "_");
        const codeValue = args[1].toString();

        const w = parseInt(args[2]) || null;
        const h = parseInt(args[3]) || null;

        let textPos = args[4]?.toString().toUpperCase() || "BLW";
        if (textPos === "BELOW") textPos = "BLW";
        if (textPos === "ABOVE") textPos = "ABV";
        if (textPos === "BOTH") textPos = "BTH";

        let barcodeFont = args[5];
        if (barcodeFont !== "A" && barcodeFont !== "B") barcodeFont = "A";

        printer.barcode(codeValue, type, {
          width: w,
          height: h,
          position: textPos,
          font: barcodeFont,
          includeParity: EscPosTemplate.enableBarcodeParityBit
        });
      },
      ArgValidation.AtLeast(2)
    ));
  }

  static add(templateCommand) {
    this.commands[templateCommand.opcode] = templateCommand;
  }

  static invoke(printer, opcode, args) {
    const command = this.commands[opcode];

    if (!command)
      throw new Error(`Command not implemented: ${opcode}`);

    if (!command.argValidation.validate(args))
      throw new Error(command.argValidation.getErrorMessage(args));

    command.invoke(printer, args);
  }
}

TemplateCommandRegistry.init();