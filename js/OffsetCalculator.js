const NANS_PER_SEC = 1000000000.0;

var CLOCK_SPEED_HZ = 90000;
var ignoreFirstPacket = false;


var tmpArr = [];



class RTPTSOffsetCalculator {
	constructor( parsedPcap ){

		this.marker  = parsedPcap.markerArr;
		this.packets = parsedPcap.packets;
		this.dstPorts= parsedPcap.dstPorts;
		this.recDur  = parsedPcap.recDuration;
		this.rtpDur  = parsedPcap.rtpDurationTics;
		this.frameNumber = parsedPcap.frameNumber;
		this.packetNumber= parsedPcap.packetNumber;

		this.offsetArray = [];

		this.rtpOffsetArray = [];
		this.tsOffsetArray  = [];

		this.rtpTSArr = [];
		this.recTSArr = [];

		this.rtp_diff_arr = [];
		this.ts_diff_arr = [];


		this.frames = [];
		this.firstPacketDeltas = [];


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

		var rtpTSStats    = new Statistics();
		var recTSStats    = new Statistics();

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

				if( ignoreFirstPacket && is_firstFramePacket ){
					tsOffsetStats.addValue( 0 );
				}
				else{
					tsOffsetStats.addValue( ts_ticks_diff );
				}

			}
			else{
				tsOffsetStats.addValue( 0 );
			}

			// Calculate Rec. TS Offset;


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

			rtpTSStats.addValue( curr.rtp_ts_dec );
			recTSStats.addValue( curr.nanos_dec );



			if( curr.has_marker || i >= this.packets.length ){
				is_firstFramePacket = true;
				var newFrame = new Frame();
				newFrame.index = i;
				newFrame.set_rtp_offset( rtpOffsetStats.getStats() );
				newFrame.set_rec_offset( tsOffsetStats.getStats() );
				newFrame.set_ts_delta( deltaStats.getStats() );
				newFrame.set_rtpTs( rtpTSStats.getStats() );
				newFrame.set_recTs( recTSStats.getStats() );
				this.frames.push( newFrame );

				tsOffsetStats.reset();
				rtpOffsetStats.reset();
				deltaStats.reset();
				rtpTSStats.reset();
				recTSStats.reset();
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
		var rtpTsStatsResults = rtpTSStats.getStats();
		var recTsStatsResults = recTSStats.getStats();

		output = this.analyzeWholeCapture();

		return output;


	}

	extractChartData(){
		var keys = {
			"rtp_offset": {},
			"rec_offset":{} ,
			"ts_delta":{},
			"rtpTs":{},
			"recTs": {}
		};

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

		var keys = {
			"rtp_offset": {},
			"rec_offset": {},
			"ts_delta":   {},
			"rtpTs": {},
			"recTs": {}
		};

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
