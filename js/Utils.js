function mergeTS (seconds, nanos){
	var s_str = seconds.toString();
	var n_str = nanos.toString();
	n_str = "0".repeat(9-n_str.length) + n_str;
	var output = s_str + "." + n_str;
	return output
}

function byteArrayTo32Int( byteArray ){
	if( byteArray.length != 4){
		console.error("BYTE ARRAY - Wrong length!");
	}
	else{
		return byteArray[0] + byteArray[1]* 256 + byteArray[2]*Math.pow(256,2) + byteArray[3]*Math.pow(256,3);
	}
}

function byteArrayTo16Int( byteArray ){
	if( byteArray.length != 2){
		console.error("BYTE ARRAY - Wrong length!");
	}
	else{
		return byteArray[0] + byteArray[1]* 256;
	}
}

// PCAP PACKET HEADER + GLOBAL HEADER = 40Bytes
//ETHERNET
// IP

// ETHERNET + IP + UDP + RTP = 42Bytes
// RTP Unwichtige Byte = 4 Bytes
// --> RTP Timestamp at lower index: 86 - einschl.89
