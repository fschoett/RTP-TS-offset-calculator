
const MAX_COLOR = "#e85600";
const AVG_COLOR = "#5755d9";
const MIN_COLOR = "#ffb700";
const VAL_COLOR = "#32b643";

var tmp_global_chart;

class TSChart {
  constructor( params ){
    this.xlabel = "Frames";
    this.ylabel = "Ticks";

    //Maybe check input?
    //this.ctx = document.getElementById( params.el_id ).getContext('2d');
    this.el_id = params.el_id;
    if( params.data ){
      this.maxes= params.data.maxes;
      this.avgs = params.data.avgs ;
      this.mins = params.data.mins ;
      this.vals = params.data.vals;
      this.indices = params.data.indices;
    }

    if( params.xlabel ){ this.xlabel = params.xlabel }
    if( params.ylabel ){ this.ylabel = params.ylabel }

    this.onClick = params.onClick;

    this.lastIndex = 50;
    //console.log({ maxes:this.maxes, avgs:this.avgs, mins:this.mins, vals:this.vals, indices:this.indices, onClick: this.onClick});
  }

  destroy(){
    if( this.chart !== undefined ){
      this.chart.destroy();
    }
  }

  resize(){
    var container = document.getElementById( this.el_id );

    var containerSizeX = container.clientWidth;
    var containerSizeY = container.clientHeight;
    if( this.chart !== undefined ){
      this.chart.resize( containerSizeX, containerSizeY);
    }
  }

  setData( data ){
    this.maxes= data.maxes;
    this.avgs = data.avgs ;
    this.mins = data.mins ;
    this.vals = data.vals;
    this.indices = data.indices;
  }

  drawLine( x ){
    if( !this.chart ){
      return
    }
    this.chart.renderGraph_();
    this.canvas.fillStyle = MAX_COLOR;

    var highlight_period = (x_start, x_end) => {
      var canvas_left_x = this.g.toDomXCoord(x_start);
      var canvas_right_x = this.g.toDomXCoord(x_end);
      var canvas_width = canvas_right_x - canvas_left_x;

      var ctx = this.canvas;
      ctx.beginPath();
      ctx.moveTo(canvas_left_x, this.area.y);
      ctx.lineTo(canvas_left_x, this.area.h);
      ctx.strokeStyle = "#FF0000";
      ctx.stroke();

      //this.canvas.fillRect(canvas_left_x, this.area.y, canvas_width, this.area.h);
    }

    var getLastIndex = ()=>{ return this.lastIndex };

    highlight_period( this.g.getValue(x ,0), this.g.getValue(x ,0));
  }

  render (){
    var container = document.getElementById( this.el_id );

    var containerSizeX = container.offsetWidth;
    var containerSizeY = container.clientHeight;

    var mappedVals;
    var labels;

    if( this.vals ){
      mappedVals = this.maxes.map( (max, i) => {
        return [i,max,  this.avgs[i], this.vals[i], this.mins[i] ]
      } );
      labels = ["Frame", "Max", "Avg", "Value", "Min"];
    }
    else {
      mappedVals = this.maxes.map( (max, i) => {
        return [i,max,  this.avgs[i], this.mins[i] ]
      } );
      labels = ["Frame", "Max", "Avg", "Min"];
    }

    var onClickCallback = (e,x,pts)=>{
      this.onClick(e,x,pts);
      this.lastIndex = x;
    }

    this.chart = new Dygraph(
      document.getElementById(this.el_id),
      mappedVals,
      {
        labels: labels,
        clickCallback: onClickCallback,
        animatedZooms: true,
        underlayCallback: ( canvas, area, g)=>{
          this.area = area;
          this.g = g;
          this.canvas = canvas;

          //console.log( canvas, area, g);
        },
        legend:"always",
        maxNumberWidth:9,
        xRangePad:2,
        digitsAfterDecimal: 20,
        labelsKMB:true,
        axisLabelWidth: 80,
        colors: [
          MAX_COLOR,
          AVG_COLOR,
          VAL_COLOR,
          MIN_COLOR
        ],
        strokeWidth:2.0,
        xlabel: this.xlabel,
        ylabel: this.ylabel
      }
    );

    $( document ).on("contextmenu", "#"+this.el_id, (e)=>{
      this.chart.resetZoom();
      return false;
    });

    this.chart.resize( containerSizeX , containerSizeY );
    tmpGlobal = this.chart;


  }
}

var tmpGlobal;
