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

var  rtpOffsetCalc;
var CLOCK_SPEED_HZ = 90000;
const TICKS_TILL_OVERFLOW = Math.pow(2,32);


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

	//Reset files input field
	document.getElementById("file_input").files = undefined;

	$("#calc_btn").on("click", ()=>{

		var result = calculateDeltaInTicks(
			$("#rec_tmstp").val(),
			$("#rtp_tmstp").val()
		);
		$("#result_delta_manual_calc-t").text(result);
		$("#result_delta_manual_calc-s").text(result/CLOCK_SPEED_HZ);

	});


	$(".close_modal").on("click", ()=>{
		$(".modal").each( function(){
			$( this ).removeClass("active");
		});
	});

	$("#file_upload").on("click", ()=>{
		var file = document.getElementById("file_input").files[0];
		onFileUpload( file );
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
		droppedFile = e.originalEvent.dataTransfer.files[0];
		onFileUpload( droppedFile );
	});
}

function toggleView(){
	const CONFIG = {
		DIV_RESULT_CONTAINER_EL_ID : "result_container_wrapper",
		DIV_INFO_CONTAINER_EL_ID   : "input_container"
	}

	$("#"+ CONFIG.DIV_RESULT_CONTAINER_EL_ID ).toggleClass("is-active");
	$("#"+ CONFIG.DIV_INFO_CONTAINER_EL_ID ).toggleClass("is-active");

}


function onFileUpload( droppedFile ){
//console.log(droppedFiles[0].name);
	$("#upload_msg").text(droppedFile.name);
	$("#upload_modal").addClass("active");

	var reader = new FileReader();

	reader.onload = function(evt) {
		toggleView();

		var arr        =  new Uint8Array( evt.target.result );
		var parsedPcap = RTP_TS_Parser.parse(arr)
		rtpOffsetCalc  =  new RTP_TS_Analyzer ( parsedPcap );

		renderResult(
			rtpOffsetCalc.getStats(),
			rtpOffsetCalc.extractChartData(),
			rtpOffsetCalc
		);

		$("#upload_modal").removeClass("active");
	};

	reader.onprogress = function( evt ){
		var newWidth = ((evt.loaded / evt.total) * 100).toString()+"%";
		$("#upload_progress_bar").css("width", newWidth );
	}

	reader.readAsArrayBuffer( droppedFile );
}

function renderResult( result, chartData, calculator ){
	function round ( num ){
		const DIGIT_TO_ROUND = 1000000000;
		return (Math.round(num * DIGIT_TO_ROUND) / DIGIT_TO_ROUND) ;
	}

	var resultConfig = [
		{
			data: result.rtpTs,
			resultTableElId: "rtp_ts",
			chartElId: "rtp_ts_global_chart",
			chartData: chartData.rtpTs,
			ylabel: "RTP Timestamps [Ticks]",
			key: "rtpTs"
		},
		{
			data: result.recTs,
			resultTableElId: "rec_ts",
			chartElId: "rec_ts_global_chart",
			chartData: chartData.recTs,
			ylabel: "REC Timestamps [Ticks]",
			key: "recTs"
		},
		{
			data: result.rtp_offset,
			resultTableElId: "rtp_offset",
			chartElId: "rtp_offset_global_chart",
			chartData: chartData.rtp_offset,
			ylabel: "RTP Timestamp Offset [Ticks]",
			key: "rtp_offset"
		},
		{
			data: result.rec_offset,
			resultTableElId: "rec_offset",
			chartElId: "rec_offset_global_chart",
			chartData: chartData.rec_offset,
			ylabel: "RX Timestamp Offset [Ticks]",
			key: "rec_offset"
		},
		{
			data: result.ts_delta,
			resultTableElId: "ts_delta",
			chartElId: "ts_delta_global_chart",
			chartData: chartData.ts_delta,
			ylabel: "RTP - RX Timestamp Delta [Ticks]",
			key: "ts_delta"
		}
	];

	resultConfig.map( el =>{
		var roundedMax = round( el.data.max );
		var roundedAvg = round( el.data.avg );
		var roundedMin = round( el.data.min );

		$("#"+el.resultTableElId+"_max").find("span").text( roundedMax );
		$("#"+el.resultTableElId+"_avg").find("span").text( roundedAvg );
		$("#"+el.resultTableElId+"_min").find("span").text( roundedMin );

		var chart = new TSChart({
			el_id: el.chartElId,
			data:  el.chartData,
			ylabel:el.ylabel,
			onClick: (e,x,pts) => {
				renderFrameChart( el.key, calculator );
			}
		});

		chart.render();

	});

}

function renderFrameChart( key, calc ){
	if( !ResultChartModal.check_if_open() ){
		ResultChartModal.open();
	}
	ResultChartModal.setSource( key, calc );
}
