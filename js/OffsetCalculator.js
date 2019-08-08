const GLOBAL_PCAP_HEADER_SIZE_BYTE = 24;
const RECORD_HEADER_SIZE = 16;

//All indices are realative to the beginning of the packet heaader
const SECONDS_INDEX_LOW = 0;
const SECONDS_INDEX_HIGH= 3;

const NANO_INDEX_LOW =  4;
const NANO_INDEX_HIGH = 7;

const PACKET_SIZE_INDEX_LOW = 8;
const PACKET_SIZE_INDEX_HIGH= 11;

const MARKER_INDEX = 43 + RECORD_HEADER_SIZE;

const DST_PORT_INDEX_LOW = 36 + RECORD_HEADER_SIZE;
const DST_PORT_INDEX_HIGH= 37 + RECORD_HEADER_SIZE;

const RTP_TS_INDEX_LOW = 62;
const RTP_TS_INDEX_HIGH= 65;

const NANS_PER_SEC = 1000000000.0;

var CLOCK_SPEED_HZ = 90000;


var tmpArr = [];



class RTPTSOffsetCalculator {
	constructor( uInt8Array ){

		this.dstPorts = {};
		this.offsetArray = [];

		this.rtpOffsetArray = [];
		this.tsOffsetArray  = [];

		this.rtp_diff_arr = [];
		this.ts_diff_arr = [];

		this.marker = [];

		this.frames = [];
		this.firstPacketDeltas = [];

		this.packets = this.parseCapture( uInt8Array );

	}

	parseCapture( capture ) {
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
		var marker;
		var has_marker;

		// Extract the packet data
		while( currIndex < capture.length ){

			seconds = capture.slice( currIndex+SECONDS_INDEX_LOW, currIndex+SECONDS_INDEX_HIGH+1 );
			seconds_dec = byteArrayTo32Int( seconds );

			nanos = capture.slice( currIndex+NANO_INDEX_LOW, currIndex+NANO_INDEX_HIGH+1);
			nanos_dec = byteArrayTo32Int( nanos );

			rtp_ts = capture.slice( currIndex+RTP_TS_INDEX_LOW, currIndex+RTP_TS_INDEX_HIGH+1 );
			rtp_ts_dec = byteArrayTo32Int( rtp_ts.reverse() );

			pckgLength = capture.slice( currIndex+PACKET_SIZE_INDEX_LOW, currIndex+PACKET_SIZE_INDEX_HIGH+1 );
			pckg_length_dec = byteArrayTo32Int(  pckgLength );

			dst_port = capture.slice( currIndex+DST_PORT_INDEX_LOW, currIndex+DST_PORT_INDEX_HIGH+1 );
			dst_port_dec = byteArrayTo16Int( dst_port.reverse() );

			marker = capture.slice( currIndex+MARKER_INDEX, currIndex+MARKER_INDEX+1 );

			if ( marker[0] >=  128 ){
				has_marker = true;
				this.marker.push( {currIndex: marker[0]} ) ;
			}
			else {
				has_marker = false;
			};


			output.push( {seconds_dec, nanos_dec, rtp_ts_dec, pckg_length_dec, dst_port_dec, has_marker });
			if( this.dstPorts[dst_port_dec] ) {
				this.dstPorts[dst_port_dec] = this.dstPorts[dst_port_dec]+1
			}
			else { this.dstPorts[dst_port_dec] = 1 }

			currIndex += pckg_length_dec + RECORD_HEADER_SIZE;

		}

		// Filter the packages so that only the packages with
		// the most occuring dst port are saved
		var most_packets_to = Object.keys( this.dstPorts ).reduce( ( a, b ) => this.dstPorts[a] > this.dstPorts[b] ? a : b);

		output = output.filter( pckt =>{
			return pckt.dst_port_dec == most_packets_to
		});

		return output;
	}

	getStats(){

		const num_packets = this.packets.length;

		var output = { };
		this.offsetArray = [];

		var recStr = mergeTS( this.packets[0].seconds_dec, this.packets[0].nanos_dec );
		var rtp = this.packets[0].rtp_ts_dec;

		var currDelta = calculateDeltaInTicks( recStr, rtp );
		var startDelta = currDelta;
		const clkspd_divided = CLOCK_SPEED_HZ / NANS_PER_SEC;

		var tsOffsetStats = new Statistics();
		var rtpOffsetStats= new Statistics();
		var deltaStats    = new Statistics();

		rtpOffsetStats.reset();

		var prev_ts_ticks_diff = 0;
		var prev_rtp_ticks_diff= 0;

		var prevRTP;
		var prevSecs;
		var prevNanos;


		var startSecs  = this.packets[0].seconds_dec;
		var startNanos = this.packets[0].nanos_dec;
		var startRTP   = this.packets[0].rtp_ts_dec;

		var secsDiff, nanosDiff;
		var ts_ticks_diff, rtp_ticks_diff;
		var currSecs, currNanos, currRTP;


		var is_firstFramePacket = true;

		// For each packet!
		this.packets.map( (curr, i) => {

			currSecs = curr.seconds_dec;
			currNanos= curr.nanos_dec;
			currRTP = curr.rtp_ts_dec;

			// Calculate RTP TS Offset;
			if( prevRTP !== undefined ){
				rtpOffsetStats.addValue( currRTP - prevRTP );
			}
			else{
				rtpOffsetStats.addValue( 0 );
			}
			prevRTP = currRTP;

			// Calculate Rec. TS Offset;
			if( prevSecs !== undefined ){
				secsDiff = currSecs-prevSecs;

				// Check for nanos overflow
				if( currNanos < prevNanos ){
					secsDiff--;
					nanosDiff = currNanos-prevNanos+NANS_PER_SEC;
				}
				else{
					nanosDiff = currNanos-prevNanos;
				}
				// Calculate the delta of the ts/rtp_ts regarding their first values
				ts_ticks_diff = secsDiff * CLOCK_SPEED_HZ + nanosDiff * clkspd_divided;
				tsOffsetStats.addValue( ts_ticks_diff );
			}
			else{
				tsOffsetStats.addValue( 0 );
			}
			prevSecs = currSecs;
			prevNanos= currNanos;

			if( is_firstFramePacket ){
				is_firstFramePacket = false;

				recStr = mergeTS( currSecs, currNanos );
				currDelta = calculateDeltaInTicks( recStr, currRTP );

				this.firstPacketDeltas.push( currDelta );

			}
			else{
				currDelta = currDelta + ts_ticks_diff - (currRTP - prevRTP);
			}

			deltaStats.addValue( currDelta );

			if( curr.has_marker || i >= this.packets.length ){
				is_firstFramePacket = true;
				var newFrame = new Frame();
				newFrame.index = i;
				newFrame.set_rtp_offset( rtpOffsetStats.getStats() );
				newFrame.set_rec_offset( tsOffsetStats.getStats() );
				newFrame.set_ts_delta( deltaStats.getStats() );
				this.frames.push( newFrame );
				tsOffsetStats.reset();
				rtpOffsetStats.reset();
				deltaStats.reset();
				//console.log( "prev ts ", prev_ts_ticks_diff);
				//console.log( "ts ", ts_ticks_diff);
			}



			prev_ts_ticks_diff  = ts_ticks_diff;
			prev_rtp_ticks_diff = rtp_ticks_diff;

		});


		// Output all the data :)
		var deltaStatsResults = deltaStats.getStats();
		var rtpOffsetStatsResults = rtpOffsetStats.getStats();
		var tsOffsetStatsResults = tsOffsetStats.getStats();

		output = this.analyzeWholeCapture();

		return output;


	}

	extractChartData(){
		var keys = {"rtp_offset": {}, "rec_offset":{} , "ts_delta":{} };

		for ( var key in keys ){
			var maxes = [];
			var avgs  = [];
			var mins  = [];
			var indices=[];

			this.frames.map( (curr,i) =>{
				maxes.push( curr[key].max.val );
				avgs.push( curr[key].avg );
				mins.push( curr[key].min.val );
				//indices.push( curr.index );
				indices.push( i );
			});

			keys[ key ] = { maxes:maxes, avgs:avgs, mins:mins, indices:indices };
		}

		return keys;

	}

	getFrameChartData(  key, frameIndex ){
		var frame = this.frames[ frameIndex ][ key ];
		if( frame ){
			var maxes = new Array( frame.data.length ).fill( frame.max.val );
			var avgs  = new Array( frame.data.length ).fill( frame.avg );
			var mins  = new Array( frame.data.length ).fill( frame.min.val );
			var vals  = frame.data;
			var indices = Array.from( Array( frame.data.length).keys() );
			return { maxes:maxes, avgs:avgs, mins:mins, vals:vals, indices:indices}
		}
	}

	analyzeWholeCapture(){

		var keys = {"rtp_offset": {}, "rec_offset":{} , "ts_delta":{} };

		for( var key in keys ){
			keys[ key ].max = {index:0, val:0};
			keys[ key ].avg = 0;
		}

		for ( var i=0; i< this.frames.length; i++){

			for( var key in keys ){
				var currFrame = this.frames[i][ key ];

				(currFrame.max.val > keys[key].max.val ) && ( keys[key].max = currFrame.max);
				keys[key].avg += currFrame.avg;

				if( !keys[key].min ) keys[key].min ={index: currFrame.min.index, val:currFrame.min.val};


				(currFrame.min.val < keys[key].min.val ) && (keys[key].min = currFrame.min);
			}

		}

		for ( var key in keys ) {
			keys[ key ].avg = keys[ key ].avg / this.frames.length;
		}

		var output = keys;
		return output
	}

}
