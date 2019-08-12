# RTP-TS-Offset-calculator
This is a very basic Calculator to compute the delta between the RTP timestamp and the receiving timestamp of a RTP packet. It is espacially usefull for a quick check if the devices of a captured RTP stream are synced properly.

## Usage
To use this tool, simply download the zip or clone this directory and open the index.html with your browser. I tested this tool only on Firefox, but it should work on any browser.
Here is a help which values to copy out of a RTP packet


## Third party
The tool uses local copies of [jQuery](https://jquery.com/) for convenient DOM manipulation, [Spectre.css](https://picturepan2.github.io/spectre/index.html) for the look and the [BigNumber](http://jsfromhell.com/classes/bignumber) script by Jonas Raoni Soares Silva to prevent a value overflow during offset calculation.
