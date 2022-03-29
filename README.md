# escpos-templates

**Generic template engine for formatting [node-escpos](https://github.com/song940/node-escpos) receipts**.

## Installation

Add the `escpos-templates` package to your project:

```bash
yarn add escpos-templates
# or
npm install escpos-templates
```

## Usage

Instantiate `EscPosTemplate` with the template text, then provide it with a `printer` instance and your variables to
directly drive the printer interface:

```javascript
import {EscPosTemplate} from "node-escpos-templates";
import {Printer, Network} from "escpos";

const device = new Network("127.0.0.1", 1234);
const printer = new Printer(device);

const template = new EscPosTemplate(`print \"Hello {{theName}}!"; feed 2; cut;`);
const myVars = {theName: "Bob"};

device.open((err) => {
  // Directly drive printer instructions from the template, with optional variables
  template.print(printer, myVars);
  printer.close();
});
```

## Creating templates

This project uses a simple custom syntax to define print templates.

Each print instruction must be placed on separate line, and/or seperated with a semicolon `;`.

### "Hello world" example

A very simple template that prints some text, beeps once, then cuts the paper:

*Template text*:
```
print "Hello world!";
beep 1 1;
cut;
```

### Working with variables 

When calling `print()` you can provide an object of template variables.

You can refer to these anywhere in a template string by using the `{{variableName}}` syntax. You can also refer to
variables directly as arguments to template functions.

*Template text*:
```
# Print "Bob" 
print name;

# Print "Hello Bob!"
print "Hello {{name}}!";
```

*Code*:
```javascript
template.print(printer, {name: "Bob"});
```

Most functions expect integers or string values, but some special functions like images and tables may need special input (refer to the function list below for details).

### Printing special elements
#### Barcodes
Supported barcodes (depending on printer model) are `UPC_A`, `UPC_E`, `EAN13`, `EAN8`, `CODE39`, `ITF`, `NW7`, `CODE93`, and `CODE128`.

*Template text*:
```
# Print EAN-13 barcode
barcode "EAN13" "ABCDEF123456" 10 20
```

The arguments for the `barcode` function are: type, code, width (optional, range 2 - 6), height (optional, range 1-255), text position (optional, defaults to "below") and barcode font ("A" or "B").

Text position options are: `off` (no text), `above` (text above barcode), `below` (text below barcode), `both` (text above and below barcode).


## Function list

These are the functions that are currently implemented for use in the templates.

Arguments are listed in `[brackets]`, with optional arguments denoted with a `?`.

### Core

| Syntax           | Details                                                |
|------------------|--------------------------------------------------------|
| `init`           | Reset (initialize) printer                             |
| `print [text]`   | Prints one line of `text`                              |
| `feed [n?]`      | Feed `[n]` (1?) amount of lines.                       |
| `beep [n?] [t?]` | Beep `[n]` (1?) times for `[t]` (1?) × 100 ms duration |
| `cut [n?]`       | Feeds `[n]` (5?) lines then performs a full cut        |
| `cashdraw [p]`   | Pulses the cash drawer kick on pin `[p]` (2?)          |

### Text formatting

| Syntax             | Details                                                  |
|--------------------|----------------------------------------------------------|
| `align [a]`        | Align text `left`, `center` or `right`                   | 
| `bold [t]`         | Set bold / emphasis to `off` or `on`                     | 
| `underline [t]`    | Set underline mode to `off`, `on` or `double`            |
| `font [f]`         | Set font to `a`, `b`, or `c`                             | 
| `fontsize [w] [h]` | Sets character width × `[w]` and height × `[h]`  (1-8)   | 
| `reset`            | Resets all formatting options to their defaults          |


### Special elements

| Syntax                                       | Details                                                                                                                  |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `barcode [type] [code] [w?] [h?] [tp?] [f?]` | Prints `[code]` of `[type]` with height `[h]` (?), width `[w]` (?) and text position `[tp]` (`below`?) and font `[f]` (`a`?) |

## Additional information

### Template syntax
Some details about the template syntax this library uses:
- Each line is evaluated separately;
  - Empty lines are ignored
  - Lines that start with a hash `#` are ignored (comment)
- Each line is parsed for instructions;
  - Multiple instructions can be split using a semicolon `;`
  - Each instruction starts with an alphanumeric opcode (e.g. `print`)
  - Each instruction can have any amount of arguments, split by a space or tab
- Each argument can be passed as a string literal or variable;
  - Double quotes should `"` wrap around a string literal
  - Backslash ` \ ` can be used as an escape character anywhere
  - Any argument that isn't a string literal must be an integer or variable reference
  - Some variables are predefined (e.g. `true`, `false` and options listed in the table above)

### Special settings

#### Parity bit (barcodes)
You can globally control whether a parity bit is included for certain barcode types. It is enabled by default but may not be supported by some printers:

```javascript
EscPosTemplate.setEnableBarcodeParityBit(false); // turn parity bit OFF for all barcodes 
```