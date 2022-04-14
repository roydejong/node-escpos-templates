# escpos-templates
🖨️ **Template engine for easily formatting [node-escpos](https://github.com/song940/node-escpos) receipts**

[![Node.js CI](https://github.com/roydejong/node-escpos-templates/actions/workflows/node.js.yml/badge.svg)](https://github.com/roydejong/node-escpos-templates/actions/workflows/node.js.yml)
[![npm version](https://badge.fury.io/js/escpos-templates.svg)](https://badge.fury.io/js/escpos-templates)

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

# Print "Hello Bob Smith!"
print "Hello {{person.firstName}} {{person.lastName}}!";
```

*Code*:
```javascript
template.print(printer, {name: "Bob", person: {firstName: "Bob", lastName: "Smith"}});
```

Most functions expect integers or string values, but some special functions like images and tables may need special input (refer to the function list below for details).

### Printing special elements

#### Images
To print an image, you'll need to prepare an `escpos.Image` instance in advance and pass it as a variable:

*Code and template text*:
```javascript
import {Image} from "escpos";

Image.load("hippopotamus.png", function (hippoImg) {
  const template = new EscPosTemplate("init; align center; image hippoImg; feed 5; cut");

  device.open((err) => {
    template.print(printer, { hippoImg });
    printer.close();
  });
});
```

#### Barcodes
Supported barcodes (depending on printer model) are `UPC_A`, `UPC_E`, `EAN13`, `EAN8`, `CODE39`, `ITF`, `NW7`, `CODE93`, and `CODE128`.

*Template text*:
```
# Print EAN-13 barcode
barcode "EAN13" "ABCDEF123456" 2 50
```

The arguments for the `barcode` function are: type, code, width (optional, range 2 - 6), height (optional, range 1-255), text position (optional, defaults to "below") and barcode font ("A" or "B").

Text position options are: `off` (no text), `above` (text above barcode), `below` (text below barcode), `both` (text above and below barcode).

### Iterating through data
When you pass an array as a variable, you can iterate through it using a `loop` statement. This can be useful for line items.

*Template text:*
```
loop myArray
  # In the iteration context, each array item is available as "item"
  # You can access keys on variables as well for more flexibility
  print item.label
endloop 
```

*Code*:
```javascript
template.print(printer, {myArray: [{label: "One"}, {label: "Two"}, {label: "Three"}]});
// Prints "One", "Two" and "Three" each on a seperate line
```

Begin iterating over an array variable with the `loop` statement. Each following statement, until `endloop` the statement, will be executed for each item in the array, with `item` as variable for each array element.

### If-statements
The template syntax has limited support for if-statements. They allow you to make a set of instructions conditional on whether a variable is truthy or not.

*Template text:*
```
if varOne

  # If varOne is truthy, this instruction will execute...
  print "One!"
  
  # You can also nest statements!
  if varTwo
    print "Also, two?"
  endif
  
endif
```

*Code*:
```javascript
template.print(printer, {varOne: "This is truthy", varTwo: 0});
// Prints "One!"
```

## Function list

These are the functions that are currently implemented for use in the templates.

Arguments are listed in `[brackets]`, with optional arguments denoted with a `?`.

### Core

| Syntax           | Details                                                                 |
|------------------|-------------------------------------------------------------------------|
| `init`           | Reset (initialize) printer                                              |
| `print [text]`   | Prints one line of encoded `text`, with linebreak                       |
| `oprint [text]`  | Optionally prints one line of `text`, if it's not falsy, with linebreak |
| `send [..args]`  | Sends all args as raw, un-encoded text to the printer without linebreak |
| `feed [n?]`      | Feed `[n]` (1?) amount of lines.                                        |
| `beep [n?] [t?]` | Beep `[n]` (1?) times for `[t]` (1?) × 100 ms duration                  |
| `cut [n?]`       | Feeds `[n]` (5?) lines then performs a full cut                         |
| `cashdraw [p]`   | Pulses the cash drawer kick on pin `[p]` (2?)                           |

### Text formatting

| Syntax             | Details                                                       |
|--------------------|---------------------------------------------------------------|
| `linespacing [n?]` | Sets line spacing to `n` (default?, 1-255) × motion unit      |
| `invert [t]`       | Sets inverted mode (white on black printing) to `off` or `on` |
| `align [a]`        | Align text `left`, `center` or `right`                        | 
| `bold [t]`         | Set bold / emphasis to `off` or `on`                          | 
| `underline [t]`    | Set underline mode to `off`, `on` or `double`                 |
| `font [f]`         | Set font to `a`, `b`, or `c`                                  | 
| `fontsize [w] [h]` | Sets character width × `[w]` and height × `[h]`  (1-8)        | 
| `reset`            | Resets all formatting options to their defaults               |

### Special elements

| Syntax                                       | Details                                                                                                                      |
|----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `image [image] [density?]`                   | Prints a rasterized `[image]` (`escpos.Image` instance)                                                                      | 
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
- When using a `loop`, all instructions are buffered and will not be evaluated until the `endloop` statement is evaluated;
- When using an `if`, the argument is evaluated to check whether it is Truthy or not; if it's not, all statements following it until the `endif` will be skipped (but must still have valid syntax);
  - Nested if-statements are supported 

### Special settings

#### Parity bit (barcodes)
You can globally control whether a parity bit is included for certain barcode types. It is enabled by default but may not be supported by some printers:

```javascript
EscPosTemplate.setEnableBarcodeParityBit(false); // turn parity bit OFF for all barcodes 
```