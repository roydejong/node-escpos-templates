import {Network, Printer} from "escpos";
import {EscPosTemplate} from "./EscPosTemplate.js";

const device = new Network("192.168.178.32", 9100);
const printer = new Printer(device);

const templateText = `init;

# Beep
beep 2 1;

# Title
fontsize 2 2;
align center;
bold on;
underline double;
print "Nieuwe bestelling";

# Details
reset;
print "Datum:\t{{date}}";
print "Tijd:\t{{time}}";
print "Kassa:\t{{pos}}";
print "Klant:\t{{customer}}";

# test
feed 1;
align center;
barcode "EAN13" "123456789112" 2 50 "both" "b";

# Cut
feed 3;
cut;
`;

const template = new EscPosTemplate(templateText);
const myVars = {theName: "Bob", date: "2022-01-01", "time": "01:02:03", "pos": "KR-POS-01", "customer": "Manual, Order"};

device.open((err) => {
  // Directly drive printer instructions from the template, with optional variables
  template.print(printer, myVars);
  printer.close();
});