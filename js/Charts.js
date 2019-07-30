
const MAX_COLOR = "#e85600";
const AVG_COLOR = "#5755d9";
const MIN_COLOR = "#ffb700";
const VAL_COLOR = "#32b643";

var tmp_global_chart;

class TSChart {
  constructor( params ){
    //Maybe check input?
    this.ctx = document.getElementById( params.el_id ).getContext('2d');
    this.el_id = params.el_id;
    this.maxes= params.data.maxes;
    this.avgs = params.data.avgs ;
    this.mins = params.data.mins ;
    this.vals = params.data.vals;
    this.indices = params.data.indices;
    this.onClick = params.onClick;
    console.log({ maxes:this.maxes, avgs:this.avgs, mins:this.mins, vals:this.vals, indices:this.indices, onClick: this.onClick});
  }

  destroy(){
    this.chart.destroy();
  }

  render (){
    var chartData = {
      labels: this.indices,
      datasets:
      [
        {
            label: 'Max',
            backgroundColor: MAX_COLOR,
            borderColor    : MAX_COLOR,
            data: this.maxes,
            fill:false,
            tension: 0,
            pointRadius:0
        },
        {
            label: 'Avg',
            backgroundColor: AVG_COLOR,
            borderColor    : AVG_COLOR,
            data: this.avgs,
            fill:false,
            tension: 0,
            pointRadius:0
        },
        {
            label: 'Min',
            backgroundColor: MIN_COLOR,
            borderColor    : MIN_COLOR,
            data: this.mins,
            fill:false,
            tension: 0,
            pointRadius:0
        },
      ]
    };

    if( this.vals ){
      console.log(" This vals : ", this.vals);
      chartData.datasets.push({
        label: 'Vals',
        backgroundColor: VAL_COLOR,
        borderColor    : VAL_COLOR,
        data: this.vals,
        fill:false,
        tension: 0,
        pointRadius:0
      });
    }


    this.chart = new Chart( this.ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: chartData,


        // Configuration options go here
        options: {
          tooltips: {
              mode: 'index',
              intersect: false
          },
          hover: {
            intersect: false,
            animationDuration: 0
          },
          onClick: this.onClick

        }
    });

    tmp_global_chart=this.chart;




  }
}
