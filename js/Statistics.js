
class Statistics {

	constructor( dataSetSize ){
		if (dataSetSize ) this.dataSetSize = dataSetSize;
		this.data = [];

		// avg_sec is the alternative when the set size is known
		this.avg_sec = 0;
		this.max = undefined;
		this.min = undefined;
		this.avg = 0;
	}

	addValue( newValue ){
		var index = this.data.length;

		// Check if new Value is bigger than max or smaller than min
		if( this.min !== undefined ){

			(newValue < this.min.val) && (this.min={index:index ,val:newValue});
		}
		else{
			//console.log("This min is undefined, going to change this! New val: ", newValue)
			this.min = {index:index, val:parseFloat(newValue)};
		}

		//( newValue > this.max.val ) && ( this.max = {index: index, val:newValue} );

		if( this.max !== undefined ){
			if( newValue > this.max.val ) {
				this.max = {index: index, val:parseFloat(newValue)};
			}
		}
		else{
			this.max = {index:index, val:parseFloat(newValue)};
		}

		// If the max data set size is known:
		// Prevent the avg number getting to large
		// by divifing it directly through the set size
		if( this.dataSetSize ){
			this.avg_sec += ( newValue / this.dataSetSize );
		}
		else{
			this.avg += newValue;
		}

		this.data.push( newValue );
		return true;

	}

	getStats(){
		var tmp_avg;
		(this.dataSetSize) ? (tmp_avg=this.avg_sec) : (tmp_avg=this.calcAvg() );

		return ({ max:this.max, min:this.min, avg:tmp_avg, data: this.data })
	}

	calcAvg(){
		return this.avg / this.data.length
	}

	reset(){
		this.data = [];
		this.avg_sec = 0;
		this.max = undefined;
		this.min = undefined;
		this.avg = 0;
	}

}
