const Settings = ( function (){

  const CONFIG = {
    MODAL_EL_ID: "settings_modal",
    CLOCK_SEL_EL_ID: "RTP_clock_selection",
    BTN_CONFIRM_EL_ID: "btn-settings_confirm",
    BTN_OPEN_SETTINGS_EL_ID: "btn-open_settings"
  }

  var currValues;
  var is_open;
  var callbacks;

  function init(){
    currValues = extractValues();
    is_open = false;
    callbacks = [];

    addDOMListeners();

  };

  function extractValues(){
    var output = {};

    var rtpClockStr = document.getElementById( CONFIG.CLOCK_SEL_EL_ID ).value;
    var rtpClockInt = parseInt( rtpClockStr );

    output = {
      rtpClock: rtpClockInt
    }

    return output;
  }

  function addDOMListeners(){
    // Select element
    var sel = document.getElementById( CONFIG.CLOCK_SEL_EL_ID );
    sel.addEventListener( "change" , ()=>{
      currValues = extractValues();
      callCallbacks();
    });

    // Close btn
    var btnOK = document.getElementById( CONFIG.BTN_CONFIRM_EL_ID );
    btnOK.addEventListener( "click", ()=>{
      currValues = extractValues();
      callCallbacks();
      close();
    });

    // Open Settings
    var btnOpen = document.getElementById( CONFIG.BTN_OPEN_SETTINGS_EL_ID );
    btnOpen.addEventListener( "click", ()=>{
      console.log("Btn clicked");
      open();
    });
  }

  // Open or close the modal
  function close(){
    var modal = document.getElementById( CONFIG.MODAL_EL_ID );
    modal.className.replace(" active", "");
    is_open = false;
  }

  function open(){
    var modal = document.getElementById( CONFIG.MODAL_EL_ID );
    modal.className += " active";
    is_open = true;
  }

  function callCallbacks(){
    for( var i=0; i<callbacks.length; i++){
      callbacks[ i ]( currValues );
    }
  }

  function onChange( callback ){
    callbacks.push( callback );
  }

  return {
    init   : init,
    values : currValues,
    onChange: onChange
  }

})();
