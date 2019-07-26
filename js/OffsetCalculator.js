const GLOBAL_PCAP_HEADER_SIZE_BYTE = 24;
const RECORD_HEADER_SIZE = 16;

//All indices are realative to the beginning of the packet heaader
const SECONDS_INDEX_LOW = 0;
const SECONDS_INDEX_HIGH= 3;

const NANO_INDEX_LOW =  4;
const NANO_INDEX_HIGH = 7; 

const PACKET_SIZE_INDEX_LOW = 8;
const PACKET_SIZE_INDEX_HIGH= 11;

const RTP_TS_INDEX_LOW = 62;
const RTP_TS_INDEX_HIGH= 65;

const DST_PORT_INDEX_LOW = 36 + RECORD_HEADER_SIZE;
const DST_PORT_INDEX_HIGH= 37 + RECORD_HEADER_SIZE;

const NANS_PER_SEC = 1000000000;

const CLOCK_SPEED_HZ = 148000000;



class RTPTSOffsetCalculator {
	constructor( UInt8Array ){
		this.capture = UInt8Array;
		this.dstPorts = {};
		this.offsetArray = [];
		
		this.rtpOffsetArray = [];
		this.tsOffsetArray  = [];
		
		this.rtp_diff_arr = [];
		this.ts_diff_arr = [];
		
		this.packets = this.parseCapture();
		
	}
	
	parseCapture() {
		var output = []; 
		var currIndex = GLOBAL_PCAP_HEADER_SIZE_BYTE;
		
		var seconds;
		var seconds_dec;
		var nanos;  
		var nanos_dec;
		var rtp_ts;
		var rtp_ts_dec;
		var pckgLength;
		var pckg_length_dec;
		var dst_port;
		var dst_port_dec;
		
		while( currIndex < this.capture.length ){
			
			seconds = this.capture.slice( currIndex+SECONDS_INDEX_LOW, currIndex+SECONDS_INDEX_HIGH+1 );
			seconds_dec = byteArrayTo32Int( seconds );
			
			nanos = this.capture.slice( currIndex+NANO_INDEX_LOW, currIndex+NANO_INDEX_HIGH+1);
			nanos_dec = byteArrayTo32Int( nanos );
			
			rtp_ts = this.capture.slice( currIndex+RTP_TS_INDEX_LOW, currIndex+RTP_TS_INDEX_HIGH+1 );
			rtp_ts_dec = byteArrayTo32Int( rtp_ts.reverse() );
			
			pckgLength = this.capture.slice( currIndex+PACKET_SIZE_INDEX_LOW, currIndex+PACKET_SIZE_INDEX_HIGH+1 );
			pckg_length_dec = byteArrayTo32Int(  pckgLength );
			
			dst_port = this.capture.slice( currIndex+DST_PORT_INDEX_LOW, currIndex+DST_PORT_INDEX_HIGH+1 );
			dst_port_dec = byteArrayTo16Int( dst_port.reverse() );
			
			output.push( {seconds_dec, nanos_dec, rtp_ts_dec, pckg_length_dec, dst_port_dec });
			if( this.dstPorts[dst_port_dec] ) {
				this.dstPorts[dst_port_dec] = this.dstPorts[dst_port_dec]+1
			}
			else { this.dstPorts[dst_port_dec] = 1 }
			
			currIndex += pckg_length_dec + RECORD_HEADER_SIZE;
			
		}
		
		var most_packets_to = Object.keys( this.dstPorts ).reduce( ( a, b ) => this.dstPorts[a] > this.dstPorts[b] ? a : b);
		
		var output = output.filter( pckt =>{
			return pckt.dst_port_dec == most_packets_to
		});
		
		return output;
	}
	
	getAvgMinMax(){
		const num_packets = this.packets.length;
		
		var output = { };
		this.offsetArray = [];
		
		var recStr = mergeTS( this.packets[0].seconds_dec, this.packets[0].nanos_dec );
		var rtp = this.packets[0].rtp_ts_dec;
		
		var currDelta = calculateDeltaInTicks( recStr, rtp );
		const startDelta = currDelta;
		console.log(currDelta);
		
		var startSecs = this.packets[0].seconds_dec;
		var startNanos = this.packets[0].nanos_dec;
		var startRTP  = this.packets[0].rtp_ts_dec;
		
		var maxDelta = {id : 0, val: 0};
		var minDelta = currDelta;
		var avgDelta = 0;
		
		var avgRTPOffset = 0;
		var avgTSOffset  = 0;
		
		var maxRTPOffset = {id:0, val:0};
		var minRTPOffset ;		
		var maxTSOffset  = {id:0, val: 0};
		var minTSOffset;
		
		var prev_ts_ticks_diff = 0;
		var prev_rtp_ticks_diff= 0;
		
		
		
		this.packets.map( (curr, i ) =>{
			var currSecs = curr.seconds_dec;
			var currNanos= curr.nanos_dec;
			var currRTP = curr.rtp_ts_dec;
			
			var secsDiff = currSecs-startSecs;
			var nanosDiff;
			
			//console.table(currDelta,currSecs, prevSecs, currNanos, prevNans, currRTP, prevRTP)
			
			if( currNanos < startNanos ){
				secsDiff -= 1;
				nanosDiff = currNanos-startNanos+NANS_PER_SEC;
			}
			else{
				nanosDiff = currNanos-startNanos;
			}
			
			var clkspd_divided = CLOCK_SPEED_HZ / NANS_PER_SEC;
			var ts_ticks_diff = secsDiff * CLOCK_SPEED_HZ + nanosDiff * clkspd_divided;
			var rtp_ticks_diff= currRTP - startRTP;
			
			currDelta = startDelta + ts_ticks_diff - rtp_ticks_diff;
			
			this.offsetArray.push( currDelta );
			
			(currDelta > maxDelta.val) && (maxDelta = {id:i, val:currDelta} );
			(currDelta < minDelta ) && (minDelta = currDelta );
			
			avgDelta += currDelta/num_packets;
			
			// Calculate average RTP and TS offset to previous package
			// If prev package number is null, dont do anything!
			if( prev_rtp_ticks_diff ){
				var currRTPOffset = rtp_ticks_diff - prev_rtp_ticks_diff;
				
				if( minRTPOffset ){ (currRTPOffset < minRTPOffset) && (minRTPOffset = currRTPOffset) }
				else { minRTPOffset = currRTPOffset }	
				
				(currRTPOffset > maxRTPOffset.val) && (maxRTPOffset = {id:i, val:currRTPOffset});

				
				this.rtpOffsetArray.push( currRTPOffset );
				avgRTPOffset += currRTPOffset;
			}
			if( prev_ts_ticks_diff ){
				var currTSOffset = ts_ticks_diff  - prev_ts_ticks_diff;
				
				if( minTSOffset ){ (currTSOffset < minTSOffset) && (minTSOffset = currTSOffset) }
				else{ minTSOffset = currTSOffset }
				
				(currTSOffset > maxTSOffset.val) && (maxTSOffset = {id:i, val:currTSOffset});
				
				this.tsOffsetArray.push( currTSOffset );
				avgTSOffset  += currTSOffset;
			}
			
			// Set previous package values
			prev_ts_ticks_diff = ts_ticks_diff ;
			prev_rtp_ticks_diff= rtp_ticks_diff;
			
			this.ts_diff_arr.push(ts_ticks_diff);
			this.rtp_diff_arr.push(rtp_ticks_diff);
			
			
			
		});
		
		output.maxDelta = maxDelta;
		output.minDelta = minDelta;
		output.avgDelta = avgDelta;
		
		output.maxDelta_s = maxDelta.val / CLOCK_SPEED_HZ;
		output.minDelta_s = minDelta / CLOCK_SPEED_HZ;
		output.avgDelta_s = avgDelta / CLOCK_SPEED_HZ;
		
		output.avgRTPOffset = avgRTPOffset / num_packets;
		output.minRTPOffset = minRTPOffset;
		output.maxRTPOffset = maxRTPOffset;
		output.avgTSOffset  = avgTSOffset  / num_packets;
		output.minTSOffset  = minTSOffset;
		output.maxTSOffset  = maxTSOffset;
		
		
		
		console.table(output);
		
		return output;
		
	}
	
	getDataOfPacket( packetIndex ){
		//console.log(" Packet : ", result);
		
		var firstPacketDataIndex;
		
		if( packetIndex === 0){
			firstPacketDataIndex = 24;
		}
		else{
			
		}

		const SECONDS_INDEX_LOW = 24;
		const SECONDS_INDEX_HIGH= 27;
		var seconds = result.slice( SECONDS_INDEX_LOW, SECONDS_INDEX_HIGH+1 );
		var seconds_dec = byteArrayTo32Int( seconds );
		
		const NANO_INDEX_LOW = 28;
		const NANO_INDEX_HIGH = 31; 
		var nanos = result.slice( NANO_INDEX_LOW, NANO_INDEX_HIGH+1);
		var nanos_dec = byteArrayTo32Int( nanos );
		
		const RTP_TS_INDEX_LOW = 86;
		const RTP_TS_INDEX_HIGH= 89;
		var rtp_ts = result.slice( RTP_TS_INDEX_LOW, RTP_TS_INDEX_HIGH+1 );
		var rtp_ts_dec = byteArrayTo32Int( rtp_ts.reverse() );
		
		var merged_ts_str = mergeTS( seconds_dec, nanos_dec );
		
		var output = { seconds_dec, nanos_dec, rtp_ts_dec, merged_ts_str }
		
		$("#rec_tmstp").val( merged_ts_str );
		$("#rtp_tmstp").val( rtp_ts_dec );
		
		console.table(output);
		return output;
	}
	
	getFirstPckgDelta(){
		
	}
	
	getAvgDelte(){
		
	}
	
	dropAllTS(){
		
	}
	
	dropAllRTP_TS(){
		
	}
	
}