

/*  CANBus Triple to SocketCAN / Pcap Pipe Adapter
*   https://github.com/CANBus-Triple/CANBus-Triple-Wireshark
*   http://canb.us
*   Derek Kuschel <etx313@gmail.com>
*/


var net = require('net'),
    fs  = require('fs'),
    Q = require('q'),
    debug = false,
    serialPort,
    pipes = process.platform == 'win32' ?
                                [
                                  '\\\\?\\pipe\\cbtbus1',
                                  '\\\\?\\pipe\\cbtbus2',
                                  '\\\\?\\pipe\\cbtbus3'
                                ]:[
                                  '/tmp/cbtbus1',
                                  '/tmp/cbtbus2',
                                  '/tmp/cbtbus3'
                                ],
    pcapHeader = new Buffer( [0xa1, 0xb2, 0xc3, 0xd4, // Magic number [Big Endian]
                                  0x00, 0x02, 0x00, 0x04, // Version (2.4)
                                  0x00, 0x00, 0x00, 0x00, // thiszone
                                  0x00, 0x00, 0x00, 0x00, // GMT timezone
                                  0x00, 0x00, 0xFF, 0xFF, // Snapshot Length
                                  0x00, 0x00, 0x00, 0xE3, // network type (227 for SocketCAN)
                                ]),
    sockets = [],
    servers = [];




function init( s, d ){

  debug = !!d;

  if( s.path )
    serialPort = s;
  else {
    console.error( 'init() requires an instance of the SerialPort module' );
    return 0;
  }

  if( serialPort.readable )
    setup();
  else
    serialPort.on("open", setup);

  return pipes;


}

function setup(){

  serialPort.flush();

  serialPort.on('data', handleSerialData);


  // Enable logging on all three busses
  var logCmd = [
    [0x03, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00],
    [0x03, 0x02, 0x01, 0x00, 0x00, 0x00, 0x00],
    [0x03, 0x03, 0x01, 0x00, 0x00, 0x00, 0x00]
  ];

  writeSerial( logCmd[0] )
    .then(function(r){
      return writeSerial( logCmd[1] );
    })
    .then(function(r){
      return writeSerial( logCmd[2] );
    }).then(function(){
      console.log('Logging enabled on all three busses');
    });
}


function handleSerialData(data) {
  var readPacket = new Buffer(data, 'ascii');
  if( readPacket[0] == 0x03 )
    writePacket( readPacket );
}


function writeSerial(data){

  var deferred = Q.defer();

  if(debug) console.log( 'Serial write ', data );

  serialPort.write(data, function(err, results) {
    if(err)
      deferred.reject(new Error(err));
    else
      setTimeout(function(){
        deferred.resolve(results);
      }, 32);
  });

  return deferred.promise;

}



// Setup pipes for all three busses.
pipes.forEach(function(pipePath, index){

  if(debug) console.info("Setup pipe: "+pipePath);

  // Cleanup any old pipe file
  if(fs.existsSync(pipePath)){
    if(debug) console.info('cleaning up old pipe ', pipePath);
    fs.unlinkSync(pipePath);
  }


  var server = net.createServer(function(socketConnection) {

      // socket = socketConnection;
      sockets[index] = socketConnection;

      // Write header
      socketConnection.write(pcapHeader);

      console.log('Client connected to '+pipePath);

      socketConnection.on('data', function(data) {
      });

      socketConnection.on('end', function(error) {
        console.log('Client disconnected');
        sockets[index] = null;
      });

      socketConnection.on('error', function(error) {
        console.log(error);
        process.exit();
      });

  });

  servers[index] = server;

  // New pipe
  server.listen(pipePath, function(){
    console.log('Socket bound: ' + pipePath);
  });


});


// listen for TERM signal .e.g. kill
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);

// Regular Exit
// process.on('exit', gracefulShutdown);




function gracefulShutdown(){
  console.log('About to exit, closing servers.');

  servers.forEach(function(server, index){
    server.close();
  });

  process.exit();
}



function writePacket(data){

  if(debug) console.log('data received from CBT: ' + data.toString('hex'));

  var timestamp = Math.floor(new Date().getTime() / 1000),
      hrTime = Math.floor(process.hrtime()[1] / 1000),
      header = new Buffer(16).fill(0);

  // Timestamp
  header.writeUIntBE( timestamp, 0, 4 );

  // Microseconds
  header.writeUIntBE( hrTime, 4, 4 );


  // Build Packet data
  var busId = data[1]-1;
  var packet = new Buffer(8 + data[12]).fill(0);

  // Message ID
  data.copy( packet, 2, 2, 4 );

  // Length
  data.copy( packet, 4, 12, 13 );

  // Payload
  data.copy( packet, 8, 4, 12 );


  header[11] = packet.length;
  header[15] = packet.length;

  // Test
  if(debug) console.log( 'Packet Header: ', header.toString('hex') );
  if(debug) console.log( 'Packet Data: ', packet.toString('hex'), packet.length );

  // Write to socket
  if( sockets[busId] ){
    sockets[busId].write(header);
    sockets[busId].write(packet);
  }



}

function stop(){
  serialPort.removeListener('data', handleSerialData);
}



module.exports = {
  init: init,
  stop: stop
};
