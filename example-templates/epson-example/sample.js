const escpos = require('escpos');
const EscPosTemplate = require('escpos-templates');

const device = new escpos.Network("XXX.XXX.XXX.XXX", 9100);
const printer = new escpos.Printer(device);

const template = new EscPosTemplate(`# Initialize printer
init;

# Set line spacing: For the TM-T20, 1.13 mm (18/406 inches)
linespacing 18;

# Select justification: Centering
align center;

# Select character size: (horizontal (times 2) x vertical (times 2))
fontsize 2 2;

# Print stamp data and line feed: quadruple-size character section, 1st line
print  "╔═══════════╗";
 
# Print stamp data and line feed: quadruple-size character section, 2nd line
print  "║   EPSON   ║";

# Print stamp data and line feed: quadruple-size character section, 3rd line
#   Left frame and empty space data
iprint "║   ";
#   Select character size: Normal size
fontsize 1 1;
#   Character string data in the frame
iprint "Thank you ";
#   Select character size: (horizontal (times 2) x vertical (times 2))
fontsize 2 2;
#   Empty space and right frame data, and print and line feed
print "   ║";

# Print stamp data and line feed: quadruple-size character section, 4th line
print  "╚═══════════╝";

# Initializing line spacing
linespacing;

# Select character size: Normal size
fontsize 1 1;

# Print the date and time
send "NOVEMBER 1, 2012  10:30";
feed 3;

# Select justification: Left justification
align left;
print "TM-Uxxx                            6.75";
print "TM-Hxxx                            6.00";
print "PS-xxx                             1.70";
feed;

# Select character size: horizontal (times 1) x vertical (times 2)
fontsize 1 2;

# Details text data and print and line feed
print "TOTAL                             14.45";

# Select character size: Normal size
fontsize 1 1;

# Details characters data and print and line feed
print "---------------------------------------";
print "PAID                              50.00";
print "CHANGE                            35.55";

# Generate pulse: Drawer kick-out connector pin 2
#cashdraw 2;

# Select cut mode and cut paper
# [Function B] Feed paper to (cutting position + 0 mm) and executes a partial cut.
cut 66 0;`);

device.open((err) => {
  template.print(printer);
  printer.close();
});
