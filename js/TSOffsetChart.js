

function initOffsetChart( inputData ){
	
	var ctx = document.getElementById('offset_chart').getContext('2d');
	var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array.from( Array(200).keys()),
        datasets: [{
            label: 'RTP-TS Offset',
            data: inputData.slice(0,200),
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});

	
}