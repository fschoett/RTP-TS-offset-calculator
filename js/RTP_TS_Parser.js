/*Copyright (C) 2019 Broadcasting Center Europe

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Written by Fabian Schoettler - fabian-schoettler@outlook.com


// Parses a pcap file by calling the parse function. The parse function needs
// an uint8array containing the pcap data
// Usage: RTP_TS_Parser.parse( uInt8Arr )
// Returns: ResultObject
const RTP_TS_Parser = (function(){

  // The global header size of a pcap file
  const GLOBAL_PCAP_HEADER_SIZE_BYTE = 24;
  // Each record (packet) contains headers too
  const RECORD_HEADER_SIZE_BYTE = 16;

  //All indices are realative to the beginning of the packet heaader
  const SECONDS_INDEX_LOW = 0;
  const SECONDS_INDEX_HIGH= 3;

  const NANO_INDEX_LOW  = 4;
  const NANO_INDEX_HIGH = 7;

  const PACKET_SIZE_INDEX_LOW = 8;
  const PACKET_SIZE_INDEX_HIGH= 11;

  const MARKER_INDEX = 59;

  const DST_PORT_INDEX_LOW = 52;
  const DST_PORT_INDEX_HIGH= 53;

  const RTP_TS_INDEX_LOW = 62;
  const RTP_TS_INDEX_HIGH= 65;


  function parse( uInt8Arr ){
    var currIndex = GLOBAL_PCAP_HEADER_SIZE_BYTE;

    var packets   = [];
    var markerArr = [];
    var dstPorts  = {};

    var seconds, seconds_dec, nanos, nanos_dec, rtp_ts, rtp_ts_dec, pckgLength,
      pckg_length_dec, dst_port, dst_port_dec, marker, has_marker;


    while( currIndex < uInt8Arr.length ){

      // Extract the data from the array and parse it to an integer
      // QUESTION: is there a better way of extracting the data out of the
      // array than array.slice?
			seconds = uInt8Arr.slice(
        currIndex + SECONDS_INDEX_LOW,
        currIndex + SECONDS_INDEX_HIGH + 1
      );
			seconds_dec = int8ToIntX( seconds );

			nanos = uInt8Arr.slice(
        currIndex + NANO_INDEX_LOW,
        currIndex + NANO_INDEX_HIGH + 1
      );
			nanos_dec = int8ToIntX( nanos );

			rtp_ts = uInt8Arr.slice(
        currIndex + RTP_TS_INDEX_LOW,
        currIndex + RTP_TS_INDEX_HIGH + 1
      );
			rtp_ts_dec = int8ToIntX( rtp_ts.reverse() );

			pckgLength = uInt8Arr.slice(
        currIndex + PACKET_SIZE_INDEX_LOW,
        currIndex + PACKET_SIZE_INDEX_HIGH + 1
      );
			pckg_length_dec = int8ToIntX(  pckgLength );

			dst_port = uInt8Arr.slice(
        currIndex + DST_PORT_INDEX_LOW,
        currIndex + DST_PORT_INDEX_HIGH + 1
      );
			dst_port_dec = int8ToIntX( dst_port.reverse() );

      // Check if the packets marker bit is set
			marker = uInt8Arr.slice(
        currIndex + MARKER_INDEX,
        currIndex + MARKER_INDEX + 1
      );
			if ( marker[0] >=  128 ){
				has_marker = true;
				markerArr.push( { packetIndex: packets.length } ) ;
			}
      else{ has_marker = false }

      // Each packet contains the RTP and Receiver timestamps, as well as the
      // length of the packet, the dst port and if the marker bit is set.
			packets.push({
				seconds_dec,
				nanos_dec,
				rtp_ts_dec,
				pckg_length_dec,
				dst_port_dec,
				has_marker
      });


      // Keep track of the dst ports
			if( dstPorts[dst_port_dec] ) {
				dstPorts[dst_port_dec] = dstPorts[dst_port_dec] + 1
			}
			else { dstPorts[dst_port_dec] = 1 }

      // Jump to the beginning of the next packet
			currIndex += pckg_length_dec + RECORD_HEADER_SIZE_BYTE;
		}

    // Filter the packages so that only the packages with
    // the most occuring dst port are saved
    var most_packets_to = Object.keys( dstPorts ).reduce( ( a, b ) => {
      return dstPorts[a] > dstPorts[b] ? a : b
    });

    packets = packets.filter( pckt => {
      return pckt.dst_port_dec == most_packets_to
    });

    var packetNumber = packets.length;
    var frameNumber  = markerArr.length;

    var firstPacket = packets[0];
    var lastPacket  = packets[ packets.length - 1 ];

    var rtpDurationTics  = lastPacket.rtp_ts_dec - firstPacket.rtp_ts_dec;

    var secsDuration = lastPacket.seconds_dec - firstPacket.seconds_dec;
    var nansDuration = lastPacket.nanos_dec - firstPacket.nanos_dec;

    if( nansDuration < 0 ) {
      secsDuration--;
      nansDuration += 1000000000;
    }

    var recDuration  = secsDuration + ( nansDuration / 1000000000 );

    return {
      packets,
      markerArr,
      dstPorts,
      packetNumber,
      frameNumber,
      recDuration,
      rtpDurationTics
    }

  }

  // Convert an integer8 Array to an integer with 8*arr.length base
  function int8ToIntX( int8Arr ){

    var output = int8Arr [0];

    for ( var i= 1; i< int8Arr.length ; i++){
      output += int8Arr[ i ] * Math.pow( 256, i );
    }
    return output
	}

  return{
    parse : parse,
    int8ToIntX: int8ToIntX
  }

})();
