const ArgValidation = require('./ArgValidation');
const TemplateCommand = require('./TemplateCommand');
const iconv = require('iconv-lite');
const {Image} = require("escpos");

class TemplateCommandRegistry {
  static init() {
    this.commands = { };

    this.add(new TemplateCommand(
      "init",
      (printer, args) =>
        printer.print("\x1b\x40"),
      ArgValidation.Exactly(0)
    ));

    this.add(new TemplateCommand(
      "print",
      (printer, args) => {
        const arg = args[0];
        const encoding = args[1] || "CP437";

        if (typeof arg === "object" && arg instanceof Image) {
          this.invoke(printer, "image", [arg]);
        } else {
          printer.text(arg.toString(), encoding);
        }
      },
      ArgValidation.AtLeast(1)
    ));

    this.add(new TemplateCommand(
      "iprint",
      (printer, args) => {
        const arg = args[0];
        const encoding = args[1] || "CP437";
        printer.print(iconv.encode(arg.toString(), encoding));
      },
      ArgValidation.AtLeast(1)
    ));

    this.add(new TemplateCommand(
      "oprint",
      (printer, args) => {
        const arg = args[0] || null;
        if (!!arg) {
          this.invoke(printer, "print", [arg]);
        }
      },
      ArgValidation.AtMost(1)
    ));

    this.add(new TemplateCommand(
      "send",
      (printer, args) => {
        args.forEach(arg => {
          printer.print(arg.toString());
        });
      }
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
        const argM = parseInt(args[0]) || 0;
        const argN = parseInt(args[1]) || 0;

        // GS V [m] [n]
        const GS_V = "\x1d\x56";
        if (argM === 65 || argM === 66 || argM === 97 || argM === 98 || argM === 103 || argM === 104) {
          // Function B, C and D take an extra "n" param
          printer.print(GS_V + String.fromCodePoint(argM) + String.fromCodePoint(argN));
        } else {
          // Function A takes no extra param
          printer.print(GS_V + String.fromCodePoint(argM));
        }
      },
      ArgValidation.AtMost(2)
    ));

    this.add(new TemplateCommand(
      "cashdraw",
      (printer, args) =>
        printer.cashdraw(parseInt(args[0]) || 2),
      ArgValidation.AtMost(1)
    ));

    this.add(new TemplateCommand(
      "linespacing",
      (printer, args) => {
        const arg = parseInt(args[0]) || null;
        printer.lineSpace(arg);
      },
      ArgValidation.AtMost(1)
    ));

    this.add(new TemplateCommand(
      "invert",
      (printer, args) => {
        const arg = args[0];

        if (arg && (arg !== "off" && arg !== "false")) {
          printer.print("\x1d\x42\x01"); // Inverse mode ON
        } else {
          printer.print("\x1d\x42\x00"); // Inverse mode OFF
        }
      },
      ArgValidation.Exactly(1)
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
            printer.print("\x1b\x45\x01"); // Bold font ON
            break;
          case "0":
          case "false":
          case "off":
            printer.print("\x1b\x45\x00"); // Bold font OFF
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
            printer.print("\x1b\x2d\x01"); // Underline font 1-dot ON
            break;
          case "2":
          case "double":
            printer.print("\x1b\x2d\x02"); // Underline font 2-dot ON
            break;
          case "0":
          case "false":
          case "off":
            printer.print("\x1b\x2d\x00"); // Underline font OFF
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
        this.invoke(printer, "linespacing", []);
        this.invoke(printer, "invert", ["off"]);
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
          includeParity: TemplateCommandRegistry.enableBarcodeParityBit
        });
      },
      ArgValidation.AtLeast(2)
    ));

    this.add(new TemplateCommand(
      "qr",
      (printer, args) => {
        const argCode = args[0].toString();
        const argSize = parseInt(args[1]) || 12;
        const argVersion = parseInt(args[2]) || 3;
        const argLevel = args[3] || "L";

        printer.qrcode(argCode, argVersion, argLevel, argSize);
      },
      ArgValidation.AtLeast(1)
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

module.exports = TemplateCommandRegistry;