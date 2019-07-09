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


// Register listeners
$( document ).ready(function() {
    console.log( "ready!" );
	$("#rtp_tmstp").on("change", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	$("#rec_tmstp").on("change", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	$("#calc_btn").on("click", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
});

// Calculate the difference
function calculateDelta( rec, rtp ){
	var recStr = new BigNumber(rec);
	var rtpStr = new BigNumber(rtp);
	
	var epochInTicks = recStr.multiply("90000");
	console.log("Arrival timestamp [ticks] : ", epochInTicks.valueOf(), " ticks");
	
	
	var ticksTillOverflow = Math.pow(2,32);
	
	var arrivalTimestamp = epochInTicks.mod(ticksTillOverflow);
	console.log("Overflowed Arrival Timestamp [ticks] : ", arrivalTimestamp.valueOf(), " ticks");
	
	var diffInTicks = arrivalTimestamp.subtract(parseInt(rtp));
	console.log("Delta RTP - Arrival TS [ticks] : ", diffInTicks.valueOf(), " ticks");
	
	var diffInSecs = diffInTicks.divide("90000");
	console.log("Delta RTP - Arrival TS [s] : ", diffInSecs.valueOf(), " s");
	
	$("#delta").text(diffInSecs.valueOf());



}

// The alternative function with overflow rounding...
function calculateDelta2(rec, rtp){
	var epochInSec  = rec;

	var RTPTimestamp= rtp;

	//2^32

	var epochInTicks = epochInSec * 90000;


	var ticksTillOverflow = Math.pow(2,32);

	var arrivalTimestamp = parseInt(epochInTicks % ticksTillOverflow);

	console.log("\nComputed Arrival Timestamp               : " + arrivalTimestamp +" [Ticks]\n");
	console.log("Delta RTP-Timestamp to Arrival Timestamp : " + (arrivalTimestamp-RTPTimestamp) +" [Ticks]\n");
	console.log("Delta in secs                            : " + ((arrivalTimestamp-RTPTimestamp)/90000) + " [s]\n");	
	$("#delta").text(((arrivalTimestamp-RTPTimestamp)/90000));
}
