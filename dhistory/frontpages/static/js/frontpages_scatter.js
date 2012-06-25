$(function () {
    var chart;
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: ''
        },
        legend: {
            enabled: false  
        },
        xAxis: {
            title: {
                enabled: true,
                text: 'Year'
            },
            labels: {
                formatter: function() {
                    return Highcharts.numberFormat(this.value, 0, '', '');
                }
            }
        },
        yAxis: {
            title: {
                text: y_text
            },
            min: y_min,
            startOnTick: false
        },
        tooltip: {
            formatter: function() {
                    return newspapers[this.point.options.n] + '<br> ' + this.x +': '+ Highcharts.numberFormat(this.y, 2);
            },
            useHTML: true
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                }
            }
        },
        series: [{
            name: 'Female',
            cursor: 'pointer',
            point: {
                events: {
                    click: function() {
                        url = '/frontpages/' + this.options.n + '/' + this.x + '/' + total_type + '/' 
                        window.location.href = url;
                    }
                }
            },
            turboThreshold: 50000,
            color: 'rgba(223, 83, 83, .5)',
            data: data

        }]
    });
    $("#show_scatter").click(function() {
        var category = $("#category").val();
        var view = $("#view").val();
        var url = "/frontpages/all/" + category + "/" + view + "/";
        window.location.href = url;
        return false;
    });
});