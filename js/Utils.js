function mergeTS (seconds, nanos){
	var s_str = seconds.toString();
	var n_str = nanos.toString();
	n_str = "0".repeat(9-n_str.length) + n_str;
	var output = s_str + "." + n_str;
	return output
}

function calculateDeltaInTicks( rec, rtp){
	var recStr = new BigNumber(rec);
	var rtpStr = new BigNumber(rtp);


	var epochInTicks = recStr.multiply( CLOCK_SPEED_HZ.toString() );

	var arrivalTimestampTicks = epochInTicks.mod( TICKS_TILL_OVERFLOW );

	var diffInTicks = arrivalTimestampTicks.subtract( rtpStr );

	var output = parseFloat ( diffInTicks.valueOf() );

	return output

}

// PCAP PACKET HEADER + GLOBAL HEADER = 40Bytes
//ETHERNET
// IP

// ETHERNET + IP + UDP + RTP = 42Bytes
// RTP Unwichtige Byte = 4 Bytes
// --> RTP Timestamp at lower index: 86 - einschl.89
