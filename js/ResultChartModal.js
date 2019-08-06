const ResultChartModal = (function(){

  const CONFIG = {
    NAV_CHART_EL_ID  : "nav_chart",
    FRAME_CHART_EL_ID: "frame_chart",
    NEXT_FRAME_BTN_EL_ID :"next_frame_btn",
    PREV_FRAME_BTN_EL_ID :"prev_frame_btn",
    FRAME_INPUT_EL_ID: "frame_selection_input",
    MODAL_EL_ID: "result_modal"
  }

  var navChart;
  var frameChart;

  var currRtpOffsetCalc;

  var currKey;
  var globalKeyData;

  var is_open = false;

  var currIndex;

  function init(){
    navChart = new TSChart({
      el_id: CONFIG.NAV_CHART_EL_ID,
      onClick: onNavClick
    });
    frameChart=new TSChart({
      el_id: CONFIG.FRAME_CHART_EL_ID,
      onClick: onFrameChartClick,
      xlabel: "Packets"
    });

    $("#"+CONFIG.NEXT_FRAME_BTN_EL_ID).on("click", ()=>{
      if( (currIndex + 1) <= globalKeyData.maxes.length ){ currIndex++; }
      onIndexChange( currIndex );
    });

    $("#"+CONFIG.PREV_FRAME_BTN_EL_ID).on("click", ()=>{
      if( (currIndex - 1) >= 0 ){ currIndex--; }
      onIndexChange( currIndex );
    });

    $("#" + CONFIG.FRAME_INPUT_EL_ID ).on("change" ,function(){
      var newIndex = $(this).val();
      if ( newIndex <= globalKeyData.maxes.length && newIndex >= 0){
        onIndexChange( newIndex );
      }
    });

  };

  function onNavClick( e, x, points ){
    var index = x;
    currIndex = index;
    onIndexChange( index );
  };

  function onFrameChartClick( evt, arr ){
  }

  function onIndexChange( newIndex ){
    var newData = currRtpOffsetCalc.getFrameChartData( currKey, newIndex );
    renderFrameChart( newData );
    navChart.drawLine( newIndex );
  }

  function renderFrameChart( newData ){
    frameChart.destroy();
    frameChart.setData( newData );
    frameChart.render();
  }

  function setSource( key, rtpOffsetCalc ){
    currKey = key;
    //Reset Charts
    currRtpOffsetCalc = rtpOffsetCalc;
    globalKeyData = rtpOffsetCalc.extractChartData()[ key ];

    navChart.destroy();
    navChart.setData( globalKeyData );
    navChart.render();

    var firstPacketData = rtpOffsetCalc.getFrameChartData( key, 0 );
    renderFrameChart( firstPacketData );

  };

  function open(){
    $("#"+CONFIG.MODAL_EL_ID).addClass("active");
    is_open = true;
    navChart.resize();
    frameChart.resize();
  };

  function close(){
    $("#"+CONFIG.MODAL_EL_ID).removeClass("active");
    is_open = false;
  };

  function check_if_open(){
    if( $("#"+CONFIG.MODAL_EL_ID).hasClass("active") ) return true
    else return false
  }

  return {
    init,
    setSource,
    open,
    close,
    check_if_open
  }

})();
