 /*Copyright (C) 2019 Fabian Schoettler

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



var  rtpOffsetCalc;
// Register listeners
$( document ).ready(function() {


	document.getElementById("file_input").files = undefined;

    console.log( "ready!" );
	$("#rtp_tmstp").on("change", ()=>{
		console.log("RTP value changed. should compute this");
		//calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	$("#rec_tmstp").on("change", ()=>{
		console.log("RTP value changed. should compute this");
		//calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	$("#calc_btn").on("click", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDeltaInTicks($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});


	$(".close_modal").on("click", ()=>{
		$(".modal").each( function(){
			$( this ).removeClass("active");
		});
	});

	$("#file_upload").on("click", ()=>{
		var files = document.getElementById("file_input").files[0];


		$("#upload_modal").addClass("active");

		var reader = new FileReader();
		reader.onload = function(evt) {
			//var rtpOffsetCalc = new RTPTSOffsetCalculator ( new Uint8Array(evt.target.result) );
			var arr =  new Uint8Array(evt.target.result) ;
			rtpOffsetCalc =  new RTPTSOffsetCalculator ( arr );
			renderResult( rtpOffsetCalc.getStats(), rtpOffsetCalc.extractChartData(), rtpOffsetCalc );
			$("#upload_modal").removeClass("active");

			var tmpChartData = rtpOffsetCalc;
			//var firstFrameTestChart = new TSChart ( { el_id:"result_modal", data:})

			reader = undefined;
			//rtpOffsetCalc = undefined;
			arr = undefined;


		};

		reader.onprogress = function( evt ){
			$("#upload_progress_bar").css("width", ((evt.loaded / evt.total) * 100).toString()+"%" );
		}

		reader.readAsArrayBuffer( files );
	});

	var inputs = document.querySelectorAll( '.inputfile' );
	Array.prototype.forEach.call( inputs, function( input )
	{
		var label	 = input.nextElementSibling,
			labelVal = label.innerHTML;

		input.addEventListener( 'change', function( e )
		{
			var fileName = '';
			if( this.files && this.files.length > 1 )
				fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
			else
				fileName = e.target.value.split( '\\' ).pop();

			if( fileName ){
				label.querySelector( 'span' ).innerHTML = fileName;
				$("#file_upload").removeClass("is-hidden");
			}
			else
				label.innerHTML = labelVal;
		});
	});

	//initOffsetChart();

	addDropListener();
});




const TICKS_TILL_OVERFLOW = Math.pow(2,32);

function calculateDeltaInTicks( rec, rtp){
	var recStr = new BigNumber(rec);
	var rtpStr = new BigNumber(rtp);


	var epochInTicks = recStr.multiply( CLOCK_SPEED_HZ.toString() );

	console.log( "Epoch in Ticks : ", epochInTicks.valueOf());
	console.log( "rtpStr  : ", rtpStr.valueOf() );

	var arrivalTimestampTicks = epochInTicks.mod( TICKS_TILL_OVERFLOW );
	console.log("Arrival Timestamp in Ticks : ", arrivalTimestampTicks.valueOf())

	var diffInTicks = arrivalTimestampTicks.subtract( rtpStr );

	var output = parseFloat ( diffInTicks.valueOf() );
	console.log("RTP-TS Delta : ", output);

	return output


}


function addDropListener(){
  var $form = $("#upload_container");
  $form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function() {
    $form.addClass('is-dragover');
  })
  .on('dragleave dragend drop', function() {
    $form.removeClass('is-dragover');
  })
  .on('drop', function(e) {
    droppedFiles = e.originalEvent.dataTransfer.files;
	//console.log(droppedFiles[0].name);
	$("#upload_msg").text(droppedFiles[0].name);

	$("#upload_modal").addClass("active");
	var reader = new FileReader();

	reader.onload = function(evt) {
		$("#upload_modal").removeClass("active");
		//var timestamps = extractTimestamps( new Uint8Array(evt.target.result) );
		//calculateDelta( timestamps.merged_ts_str, timestamps.rtp_ts_dec );
		//var rtpOffsetCalc = new RTPTSOffsetCalculator ( new Uint8Array(evt.target.result) );
		//renderResult( rtpOffsetCalc.getAvgMinMax() );
		//reader = undefined;
		//rtpOffsetCalc = undefined;

	};

	reader.onprogress = function( evt ){
		console.log( evt );
	}

	reader.readAsArrayBuffer(droppedFiles[0]);
  });
}

function renderResult( result, chartData, calculator ){
	function round ( num ){
		const DIGIT_TO_ROUND = 1000000000;
		return (Math.round(num * DIGIT_TO_ROUND) / DIGIT_TO_ROUND) ;
	}

	var rounded_avg = round( result.avgDelta_s );
	var rounded_min = round( result.minDelta_s );
	var rounded_max = round( result.maxDelta_s );

	var rounded_rtp_offset_min = round( result.rtp_offset.min.val );
	var rounded_rtp_offset_max = result.rtp_offset.max.val ;
	var rounded_rtp_offset_avg = round( result.rtp_offset.avg );

	var rounded_rec_offset_min = round( result.rec_offset.min.val );
	var rounded_rec_offset_max = round( result.rec_offset.max.val );
	var rounded_rec_offset_avg = round( result.rec_offset.avg );

	var rounded_ts_delta_min = round( result.ts_delta.min.val );
	var rounded_ts_delta_max = round( result.ts_delta.max.val );
	var rounded_ts_delta_avg = round( result.ts_delta.avg );

	$("#rtp_offset_avg").find("span").text( rounded_rtp_offset_avg );
	$("#rtp_offset_max").find("span").text( rounded_rtp_offset_max );
	$("#rtp_offset_min").find("span").text( rounded_rtp_offset_min );

	$("#rec_offset_avg").find("span").text( rounded_rec_offset_avg );
	$("#rec_offset_max").find("span").text( rounded_rec_offset_max );
	$("#rec_offset_min").find("span").text( rounded_rec_offset_min );

	$("#ts_delta_avg").find("span").text( rounded_ts_delta_avg );
	$("#ts_delta_max").find("span").text( rounded_ts_delta_max );
	$("#ts_delta_min").find("span").text( rounded_ts_delta_min );


	var rtpGlobalChart = new TSChart( {
		el_id:"rtp_offset_global_chart" ,
		data:chartData.rtp_offset,
		onClick: (evt, arr) => {
			var frameChartData = calculator.getFrameChartData("rtp_offset", arr[0]._index);
			renderFrameChart( frameChartData )}
	});

	var recGlobalChart = new TSChart( {
		el_id:"rec_offset_global_chart" ,
		data:chartData.rec_offset,
		onClick: (evt, arr) => {
			var frameChartData = calculator.getFrameChartData("rec_offset", arr[0]._index);
			renderFrameChart( frameChartData )}
	});

console.log(chartData.ts_delta);
	var tsDeltaGlobalChart = new TSChart( {
		el_id:"ts_delta_global_chart" ,
		data:chartData.ts_delta,
		onClick: (evt, arr) => {
			var frameChartData = calculator.getFrameChartData("ts_delta", arr[0]._index);
			renderFrameChart( frameChartData );
		}
	});



	rtpGlobalChart.render();
	recGlobalChart.render();
	tsDeltaGlobalChart.render();


}

var frameChart;

function renderFrameChart( frameChartData ){
	if( frameChart ){
		frameChart.destroy();
	}
	var onClick2 = function(){console.log("CLIIICK");}
	frameChart = new TSChart( { el_id:"frame_chart", data:frameChartData, onClick:onClick2 });
	frameChart.render();
	$("#result_modal").addClass("active");
}


var globalResult;

function extractTimestamps( result ){

	globalResult =result;

	console.log(" Packet : ", result);

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

function mergeTS (seconds, nanos){
	var s_str = seconds.toString();
	var n_str = nanos.toString();
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
