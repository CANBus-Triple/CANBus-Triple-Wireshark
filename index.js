

var adapter = require('./adapter'),
    serial = require("serialport"),
    SerialPort = serial.SerialPort;


if( process.argv.length < 3 ){
  console.log( 'Please supply serial/com port path. ex: node index.js /dev/cu.usbmodem1234' );
  process.exit();
}

var serialPort = new SerialPort(process.argv[2], {
  baudrate: 57600,
  parser: serial.parsers.readline('\r', 'binary'),
  disconnectedCallback: function(){ process.exit(); }
});

adapter.init(serialPort, false);
