

var adapter = require('./adapter'),
    serial = require("serialport"),
    SerialPort = serial.SerialPort;


if( process.argv.length < 3 ){
  console.log( 'Please supply serial/com port path. ex: `node index ' + (process.platform == 'win32' ? 'COM3':'/dev/cu.usbmodem1234')+'`');
  process.exit();
}

var serialPort = new SerialPort(process.argv[2], {
  baudrate: 57600,
  parser: serial.parsers.readline('\r', 'binary'),
  disconnectedCallback: function(){ process.exit(); }
});

serialPort.on('error', function(err){
  console.error('\033[31m'+err+'\033[0m');
  process.exit();
});

adapter.init(serialPort, false);
