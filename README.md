# CANBus-Triple-Wireshark
Pipe for using the CANBus Triple with Wireshark

## Usage

clone the repo:
``git clone https://github.com/CANBus-Triple/CANBus-Triple-Wireshark.git``

install dependancies: ``npm install``

run: ``node index.js /dev/cu.usbmodem1421``

### Wireshark Setup

* Press **Control+K** to open 'Capture Settings'
* Click **Manage Interfaces** Button 
* Select the **Pipes** Tab
* Click the **New** button
* Enter '/tmp/cbtbus1' for Linux/Unix/MacOS or '\\\\?\pipe\cbtbus1' for Windows
* Click **Save** then **Close**

Each CAN bus on the CANBus Triple will get its own pipe:
* /tmp/cbtbus1
* /tmp/cbtbus2
* /tmp/cbtbus3

![Wireshark Setup](http://res.cloudinary.com/ddbgan4vk/image/upload/c_scale,w_720/v1428254840/ws-adapter-cfg_nckv0a.png)

### Get them packets

Now you can start a packet capture in Wireshark using the newly added Pipe interface to read from your CANBus Triple.

![Wireshark](http://res.cloudinary.com/ddbgan4vk/image/upload/c_scale,w_720/v1428254722/ws-adapter_xlmx3a.png)


