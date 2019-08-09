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

	ResultChartModal.init();
	Settings.init();
	Settings.onChange( setClockSpeed );
	Settings.onChange( setIgnoreFirstPckt );

	function setClockSpeed( newVals ){
		CLOCK_SPEED_HZ = newVals.rtpClock;
	}

	function setIgnoreFirstPckt( newVals ){
		console.log(" CHKBX Changed : ",newVals.ignrFirstPckt )
		ignoreFirstPacket = newVals.ignrFirstPckt;
	}

	$("#btn_go_back").on("click", toggleView);

	document.getElementById("file_input").files = undefined;

  console.log( "ready!" );


	$("#calc_btn").on("click", ()=>{
		console.log("RTP value changed. should compute this");
		var result = calculateDeltaInTicks($("#rec_tmstp").val(), $("#rtp_tmstp").val());
		$("#result_delta_manual_calc-t").text(result);
		$("#result_delta_manual_calc-s").text(result/CLOCK_SPEED_HZ);
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
			toggleView();
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

function toggleView(){
	const CONFIG = {
		DIV_RESULT_CONTAINER_EL_ID : "result_container",
		DIV_INFO_CONTAINER_EL_ID   : "input_container"
	}

	$("#"+ CONFIG.DIV_RESULT_CONTAINER_EL_ID ).toggleClass("is-active");
	$("#"+ CONFIG.DIV_INFO_CONTAINER_EL_ID ).toggleClass("is-active");

}


const TICKS_TILL_OVERFLOW = Math.pow(2,32);

function calculateDeltaInTicks( rec, rtp){
	var recStr = new BigNumber(rec);
	var rtpStr = new BigNumber(rtp);


	var epochInTicks = recStr.multiply( CLOCK_SPEED_HZ.toString() );

	var arrivalTimestampTicks = epochInTicks.mod( TICKS_TILL_OVERFLOW );

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

	var rounded_rtp_ts_min = round( result.rtpTs.min.val );
	var rounded_rtp_ts_max = result.rtpTs.max.val ;
	var rounded_rtp_ts_avg = round( result.rtpTs.avg );

	var rounded_rec_ts_min = round( result.recTs.min.val );
	var rounded_rec_ts_max = result.recTs.max.val ;
	var rounded_rec_ts_avg = round( result.recTs.avg );

	var rounded_rtp_offset_min = round( result.rtp_offset.min.val );
	var rounded_rtp_offset_max = result.rtp_offset.max.val ;
	var rounded_rtp_offset_avg = round( result.rtp_offset.avg );


	var rounded_rec_offset_min = round( result.rec_offset.min.val );
	var rounded_rec_offset_max = round( result.rec_offset.max.val );
	var rounded_rec_offset_avg = round( result.rec_offset.avg );

	var rounded_ts_delta_min = round( result.ts_delta.min.val );
	var rounded_ts_delta_max = round( result.ts_delta.max.val );
	var rounded_ts_delta_avg = round( result.ts_delta.avg );

	$("#rtp_ts_max").find("span").text( rounded_rtp_ts_max );
	$("#rtp_ts_avg").find("span").text( rounded_rtp_ts_avg );
	$("#rtp_ts_min").find("span").text( rounded_rtp_ts_min );

	$("#rec_ts_max").find("span").text( rounded_rec_ts_max );
	$("#rec_ts_avg").find("span").text( rounded_rec_ts_avg );
	$("#rec_ts_min").find("span").text( rounded_rec_ts_min );

	$("#rtp_offset_avg").find("span").text( rounded_rtp_offset_avg );
	$("#rtp_offset_max").find("span").text( rounded_rtp_offset_max );
	$("#rtp_offset_min").find("span").text( rounded_rtp_offset_min );

	$("#rec_offset_avg").find("span").text( rounded_rec_offset_avg );
	$("#rec_offset_max").find("span").text( rounded_rec_offset_max );
	$("#rec_offset_min").find("span").text( rounded_rec_offset_min );

	$("#ts_delta_avg").find("span").text( rounded_ts_delta_avg );
	$("#ts_delta_max").find("span").text( rounded_ts_delta_max );
	$("#ts_delta_min").find("span").text( rounded_ts_delta_min );

	var rtpTsGlobalChart = new TSChart( {
		el_id:"rtp_ts_global_chart" ,
		data:chartData.rtpTs,
		ylabel: "RTP Timestamps [Ticks]",
		onClick: (e,x,pts) => {
			renderFrameChart( "rtpTs", calculator );
		}
	});

	var recTsGlobalChart = new TSChart( {
		el_id:"rec_ts_global_chart" ,
		data:chartData.recTs,
		ylabel: "REC Timestamps [Ticks]",
		onClick: (e,x,pts) => {
			renderFrameChart( "recTs", calculator );
		}
	});

	var rtpGlobalChart = new TSChart( {
		el_id:"rtp_offset_global_chart" ,
		data:chartData.rtp_offset,
		ylabel: "RTP Timestamp Offset [Ticks]",
		onClick: (e,x,pts) => {
			renderFrameChart( "rtp_offset", calculator );
		}
	});

	var recGlobalChart = new TSChart( {
		el_id:"rec_offset_global_chart" ,
		data:chartData.rec_offset,
		ylabel: "RX Timestamp Offset [Ticks]",
		onClick: (e,x,pts) => {
			renderFrameChart( "rec_offset", calculator );
		}
	});

	var tsDeltaGlobalChart = new TSChart( {
		el_id:"ts_delta_global_chart" ,
		ylabel: "RTP - RX Timestamp Delta [Ticks]",
		data:chartData.ts_delta,
		onClick: (e,x,pts) => {
			renderFrameChart( "ts_delta", calculator );
		}
	});

	rtpTsGlobalChart.render();
	recTsGlobalChart.render();
	rtpGlobalChart.render();
	recGlobalChart.render();
	tsDeltaGlobalChart.render();
}

function renderFrameChart( key, calc ){
	if( !ResultChartModal.check_if_open() ){
		ResultChartModal.open();
	}
	ResultChartModal.setSource( key, calc );
}

var frameChart;
