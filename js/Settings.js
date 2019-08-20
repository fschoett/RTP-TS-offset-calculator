const Settings = ( function (){

  const CONFIG = {
    MODAL_EL_ID: "settings_modal",
    MODAL_OL_CLASS : "modal-overlay",
    MODAL_CLOSE_CLASS : "close_modal",
    CLOCK_SEL_EL_ID: "RTP_clock_selection",
    BTN_CONFIRM_EL_ID: "btn-settings_confirm",
    BTN_OPEN_SETTINGS_EL_ID: "btn-open_settings",
    CHKBX_IGN_FIRST_PCKT_EL_ID: "chkbx_ign_first_pckt",

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

  // Extract the values from the DOM elements of the modal
  function extractValues(){
    var output = {};

    var rtpClockStr = document.getElementById(CONFIG.CLOCK_SEL_EL_ID ).value;
    var rtpClockInt = parseInt( rtpClockStr );

    var ignoreFirstPcktChkbx = document.getElementById(
      CONFIG.CHKBX_IGN_FIRST_PCKT_EL_ID
    );
    var ignoreFirstPckt = ignoreFirstPcktChkbx.checked;

    output = {
      rtpClock: rtpClockInt,
      ignrFirstPckt : ignoreFirstPckt
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

    // Ignore First Packet
    var chkbx = document.getElementById( CONFIG.CHKBX_IGN_FIRST_PCKT_EL_ID );
    chkbx.addEventListener( "change", ()=>{
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

  // The callbacks are called on change, and close of the modal
  function callCallbacks(){
    for( var i=0; i<callbacks.length; i++){
      callbacks[ i ]( currValues );
    }
  }

  // Register a callback
  function onChange( callback ){
    callbacks.push( callback );
  }

  // Open the modal asyncronously
  function openAsync(){
    return new Promise( (res, rej) =>{
      // open the modal
      open();

      // Get the dom elements of the modal
      var modalOverlay = document.querySelector(
        `#${CONFIG.MODAL_EL_ID} .${CONFIG.MODAL_OL_CLASS}`
      );
      var closeBtn = document.querySelectorAll(
        `#${CONFIG.MODAL_EL_ID} .${CONFIG.MODAL_CLOSE_CLASS}`
      );

      // On Close, send resolve and remove EventListeners
      var onClose = ()=>{
        for( var i=0; i<closeBtn.length; i++ ){
          closeBtn [i].removeEventListener( "click", onClose );
        }
        modalOverlay.removeEventListener( "click", onClose );
        res();
      };

      // Register Event listeners
      modalOverlay.addEventListener( "click" , onClose );
      for( var i=0; i<closeBtn.length; i++ ){
        closeBtn [i].addEventListener( "click", onClose);
      }

    });
  }

  return {
    init   :  init,
    values :  currValues,
    onChange: onChange,
    openAsync:openAsync
  }

})();
