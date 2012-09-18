/* Author:

*/
var dataSources = {
	'sources': [],
	'listSeries': function(type) {
			var series = [];
			$.each(this.sources, function(index, source) {
				series.push({'name': source.name + " (" + source.country[1] + ")", 'data': source.makeSeries(type)});
			});
			return series;
		}
};
function graphData() {
	this.name = '';
	this.query = '';
    this.api_query = '';
    this.web_query = '';
    this.data = {};
    this.interval = '';
    this.country = '';
    this.dates = [];
	this.getYears = function() {
		var years = [];
		$.each(this.data, function(year, value) {
			years.push(year);
		});
		years.sort();
		return years;
	};
	this.makeSeries = function(type) {
		//years = this.getYears();
		var series = [];
		//var self = this;
                if (this.interval == "year") {
                    $.each(this.data, function(year, values) {
                        series.push([Date.UTC(parseInt(year, 10), 0, 1), values[type]]);
                    });
                } else if (this.interval == "month") {
                    $.each(this.data, function(year, values) {
                        $.each(values, function(month, totals) {
                            series.push([Date.UTC(parseInt(year, 10), parseInt(month, 10)-1, 1), totals[type]]);
                        });
                    });
                }
		//$.each(years, function(index, year) {
		//	series.push([parseInt(year), self.data[year][type]]);
		//});
		return series;
	};
	this.getTotal = function(year, month) {
        if (month > 0) {
		return this.data[year.toString()][month.toString()]['total'];
            } else {
                return this.data[year.toString()]['total'];
            }
	};
    this.getRatio = function(year, month) {
        if (month > 0) {
            return this.data[year.toString()][month.toString()]['ratio'];
        } else {
            return this.data[year.toString()]['ratio'];
        }
	};
}

$(function(){
    reset();
    var digitalnz_api_key = "9yXNTynMDb3TUQws7QuD";
    var digitalnz_api_url = "http://api.digitalnz.org/v3/records.json?api_key=" + digitalnz_api_key + "&and[display_collection][]=Papers+Past";
    var digitalnz_html_url = "http://digitalnz.org.nz/records?i[display_collection]=Papers+Past";
    var trove_api_key = "6pi5hht0d2umqcro";
    var trove_api_url = "http://api.trove.nla.gov.au/result?zone=newspaper";
    var trove_html_url = "http://trove.nla.gov.au/newspaper/result?q=";
    var twitter_url ="http://platform.twitter.com/widgets/tweet_button.html";
    var query = {};
    var decade_start = 180;
    var decade_end = 195;
    var year_start = 1803;
    var year_end = 1954;
    var interval = "year";
    var decade_current = decade_start;
    var year_current = year_start;
    var queries = [];
    var query_type = 'ratio';
    var current_series;

    function get_query() {
        if ($("#query").val() !== "") {
            queries.push($("#query").val() + "|" + $("#country").val());
        } else if ($("#query_url").val() !== "") {
            queries.push($("#query_url").val());
        } else if (window.location.href.match(/(\?trove_query=.+|\?dnz_query=.+)/)) {
            if ($.url().param("trove_query")) {
                queries = queries.concat($.url().param("trove_query"));
            }
            if ($.url().param("dnz_query")) {
                queries = queries.concat($.url().param("dnz_query"));
            }
        } else if (window.location.href.match(/\?q=.+/)) {
            queries = window.location.href.split(/\?q=|&q=/);
            queries.shift();
        }
        setup_query();
    }
    function api_request() {
        var this_query = query[query_type];
        var callback;
        if (query["country"] == "Australia") {
            $("#status").html("<p>Retrieving data for the " + decade_current + "0s...</p>");
            this_query = this_query + "&l-decade=" + decade_current;
            if (query_type == "ratio") {
                this_query = this_query + "&q=date:[" + decade_current + "0 TO " + decade_current + "9]";
            }
            callback = "callback";
        } else if (query["country"] == "New Zealand") {
             $("#status").html("<p>Retrieving data...</p>");
            callback = "jsonp";
        }
        $.ajax({
            "dataType": "jsonp",
            "jsonp": callback,
            "url": this_query,
            "success": function(results) {
                process_results(results);
            },
            error: function(xmlReq, txtStatus, errThrown){
                $("#graph").hideLoading();
                $('#status').text(xmlReq.responseText);
            }
        });
   }

    function process_results(results) {
        if (query["country"] == "Australia") {
            process_trove_results(results);
        } else if (query["country"] == "New Zealand") {
            process_digitalnz_results(results);
        }
        if (query_type == "ratio") {
            query_type = "total";
            api_request();
        } else if (query_type == "total") {
            query_type = "ratio";
            if (query["country"] == "Australia" && decade_current < decade_end) {
                decade_current++;
                api_request();
            } else {
                dataSources.sources.push(current_series);
                $("#graph").hideLoading();
                setup_query();
            }
        }
   }

    function process_trove_results(results) {
        if (query_type == "total") {
            if (parseInt(results.response.zone[0].records.total, 10) > 0) {
                $.each(results.response.zone[0].facets.facet.term, function(index, value) {
                    current_year = value.display;
                    if (parseInt(current_year, 10) >= year_start && parseInt(current_year, 10) <= year_end) {
                        current_series.data[current_year]['total'] = parseInt(value.count, 10);
                        var ratio = value.count / current_series.data[current_year]['all'];
                        current_series.data[current_year]['ratio'] = ratio;
                    }
                });
            }
        } else if (query_type == "ratio") {
            $.each(results.response.zone[0].facets.facet.term, function(index, value) {
                current_year = value.display;
                if (parseInt(current_year, 10) >= year_start && parseInt(current_year, 10) <= year_end) {
                    current_series.data[current_year] = {};
                    current_series.data[current_year]['all'] = parseInt(value.count, 10);
                    current_series.data[current_year]['total'] = 0;
                    current_series.data[current_year]['ratio'] = 0;
                }
            });
        }
    }

    function process_digitalnz_results(results) {
        var facets = results.search.facets.year;
        if (query_type == "total") {
            $.each(facets, function(year, total) {
                if (year >= year_start && year <= year_end) {
                    current_series.data[year]['total'] = total;
                    var ratio = total / current_series.data[year]['all'];
                    current_series.data[year]['ratio'] = ratio;
                }
            });
        } else if (query_type == "ratio") {
            $.each(facets, function(year, total) {
                if (year >= year_start && year <= year_end) {
                    current_series.data[year] = {};
                    current_series.data[year]['all'] = total;
                    current_series.data[year]['total'] = 0;
                    current_series.data[year]['ratio'] = 0;
                }
            });
        }
   }

    function setup_query() {
        if (queries.length > 0) {
            $("#graph").show().showLoading();
            if (queries[0].match(/http/)) {
                process_url_query();
            } else {
                var query_parts = decodeURIComponent(queries.shift()).split('|');
                keywords = query_parts[0];
                var qstring, api_query, web_query, series_name, abbr;
                if (keywords.indexOf('"') == -1) {
                    qstring = keywords.split(" ").join(" AND ");
                } else {
                    qstring = keywords;
                }
                series_name = qstring;
                qstring = encodeURIComponent(qstring);
                if (query_parts[1] == "aus") {
                    query['total'] = trove_api_url + "&q=" + qstring + "&facet=year&n=0&encoding=json&key=" + trove_api_key;
                    query['ratio'] = trove_api_url + "&facet=year&n=0&encoding=json&key=" + trove_api_key;
                    query['country'] = "Australia";
                    abbr = "Aus";
                    api_query = trove_api_url + "&q=" + qstring + "&n=20&encoding=json&key=" + trove_api_key;
                    web_query = trove_html_url + qstring;
                    year_start = 1803;
                    year_end = 1954;
                } else if (query_parts[1] == "nz") {
                    query['total'] = digitalnz_api_url + '&text=' + qstring + '&facets=year&facets_per_page=150&per_page=0';
                    query['ratio'] = digitalnz_api_url + '&text=&facets=year&facets_per_page=150&per_page=0';
                    query['country'] = "New Zealand";
                    abbr = "NZ";
                    api_query = digitalnz_api_url + '&per_page=20&text=' + qstring;
                    web_query = digitalnz_html_url + '&text=' + qstring;
                    year_start = 1839;
                    year_end = 1945;
                }
                decade_start = Math.floor(year_start / 10);
                decade_end = Math.floor(year_end / 10);
                decade_current = decade_start;
                current_series = new graphData();
                current_series.name = series_name;
                current_series.query = web_query;
                current_series.api_query = api_query;
                current_series.web_query = web_query;
                current_series.interval = "year";
                current_series.country = [query['country'], abbr];
                current_series.dates = year_start + "&ndash;" + year_end;
            }
            api_request(query['ratio']);
        } else if (dataSources.sources.length > 0) {
            makeChart('ratio');
            $('#clear_last1').show();
            $('#clear_last2').show();
            if (dataSources.sources.length > 1) {
                $('#clear_all1').show();
                $('#clear_all2').show();
            }
        }
   }

   function process_url_query() {
        var url_query = queries.shift();
        if (url_query.match(/trove/)) {
            process_trove_query(url_query);
        } else if (url_query.match(/digitalnz/)) {
            process_dnz_query(url_query);
        }
   }

   function process_trove_query(trove_url) {
        //alert(encodeURIComponent('http://trove.nla.gov.au/newspaper/result?q=cat&exactPhrase=&anyWords=&notWords=&l-textSearchScope=*ignore*%7C*ignore*&fromdd=&frommm=&fromyyyy=1925&todd=&tomm=&toyyyy=1945&l-title=%7C61&l-title=%7C77&l-word=*ignore*%7C*ignore*&sortby='));
        //var trove_url = $.url().param("trove_query");
        var trove_params = $.url(trove_url).param();
        var keywords = [];
        var facets = [];
        var limits = {};
        if (trove_params['q']) {
            keywords.push(trove_params['q']);
        }
        if (trove_params['exactPhrase']) {
            keywords.push('"' + trove_params['exactPhrase'] + '"');
        }
        if (trove_params['anyWords']) {
            keywords.push('(' + trove_params['anyWords'].split(' ').join('+OR+') + ')');
        }
        if (trove_params['notWords']) {
            keywords.push('NOT+(' + trove_params['notWords'].split(' ').join('+OR+') + ')');
        }
        if (trove_params['fromyyyy'] || trove_params['toyyyy']) {
            if (trove_params['fromyyyy']) {
                year_start = trove_params['fromyyyy'];
            }
            if (trove_params['toyyyy']) {
                year_end = trove_params['toyyyy'];
            }
        } else {
            year_start = 1803;
            year_end = 1954;
        }
        decade_start = Math.floor(year_start / 10);
        decade_current = decade_start;
        decade_end = Math.floor(year_end / 10);
        if (trove_params['l-title']) {
            var titles = [];
            if ($.isArray(trove_params['l-title'])) {
                $.each(trove_params['l-title'], function(index, value) {
                    titles.push(value.match(/\|?(\d+)/)[1]);
                });
            } else {
                titles.push(trove_params['l-title'].match(/\|(\d+)/)[1]);
            }
            facets.push("&l-title=" + titles.join("&l-title="));
        }
        qstring = keywords.join('+');
        query['total'] = trove_api_url + "&q=" + qstring + facets + "&facet=year&n=0&encoding=json&key=" + trove_api_key;
        query['ratio'] = trove_api_url + facets + "&facet=year&n=0&encoding=json&key=" + trove_api_key;
        query['country'] = "Australia";
        current_series = new graphData();
        current_series.name = qstring.replace('+', ' ');
        current_series.query = trove_url;
        current_series.api_query = trove_api_url + "&q=" + qstring + facets + "&n=20&encoding=json&key=" + trove_api_key;
        current_series.web_query = remove_dates(trove_url);
        current_series.interval = "year";
        current_series.country = ["Australia", "Aus"];
        current_series.dates = year_start + "&ndash;" + year_end;
   }

   function process_dnz_query(dnz_url) {
        var dnz_params = $.url(dnz_url).param();
        qstring = dnz_params["text"];
        year_range = dnz_params["i"]["year"];
        if (typeof year_range !== "undefined") {
            years = year_range.match(/(\d{4}) TO (\d{4})/);
            if (years[1] >= 1839) {
                year_start = years[1];
            } else {
                year_start = 1839;
            }
            if (years[2] <= 1945) {
                year_end = years[2];
            } else {
                year_end = 1945;
            }
        } else {
            year_start = 1839;
            year_end = 1945;
        }
        query['total'] = digitalnz_api_url + '&text=' + qstring + '&facets=year&facets_per_page=150&per_page=0';
        query['ratio'] = digitalnz_api_url + '&text=&facets=year&facets_per_page=150&per_page=0';
        api_query = digitalnz_api_url + '&per_page=20&text=' + qstring;
        web_query = digitalnz_html_url + '&text=' + qstring;
        query['country'] = 'New Zealand';
        current_series = new graphData();
        current_series.name = qstring.replace('+', ' ');
        current_series.query = dnz_url;
        current_series.api_query = api_query;
        current_series.web_query = web_query;
        current_series.interval = "year";
        current_series.country = ["New Zealand", "NZ"];
        current_series.dates = year_start + "&ndash;" + year_end;
   }

   function remove_dates(url) {
        return url.replace(/&(from|to)(yyyy|mm|dd)=\d*/gi, '');
   }
    var chart;

    function makeChart(type) {
        $("#status").empty();
        $("#intro-hints").hide();
        $("#graph-notes").show();
        $("#intro-notes").hide();
        $("#graph-hints").show();
        $("#trove-results").show();
        $("#type_selector").show();
        $("#metadata").show();
        $('#graph_type').val(type);
        $("#query").val("");
        $("#query_url").val("");
        if (dataSources.sources[0].interval == "month") {
            x_date = "%b %Y";
            xLabel = "Month";
        } else {
            x_date = "%Y";
            xLabel = "Year";
        }
        if (type == "total") {
            yLabel = "Number of articles matching query";
        } else if (type == "ratio") {
            yLabel = "% of articles matching query";
        }
        chart = new Highcharts.Chart({
          chart: {
             renderTo: 'graph',
             type: 'spline',
             zoomType: 'x'
          },
          title: {
              text: 'Newspaper articles by date'
           },
           xAxis: {
                    title: {
                            text: xLabel
                    },
                    type: 'datetime',
                    labels: {
                        formatter: function() {
                            return Highcharts.dateFormat(x_date, this.value);
                        }
                    }
           },
           yAxis: {
              title: {
                    text: yLabel
                },
                labels: {
                    formatter: function() {
                        if (type == "ratio") {
                            return Highcharts.numberFormat(this.value * 100, 2, '.', '');
                        } else if (type == 'total') {
                            return this.value;
                        }
                    }
                },
              min: 0
           },
           tooltip: {
              formatter: function() {
                    year = new Date(this.x).getFullYear();
                    var interval;
                    if (dataSources.sources[this.series.index].interval == "month") {
                        interval = "month";
                        month = new Date(this.x).getMonth() + 1;
                        month_name = Highcharts.dateFormat("%b %Y", this.x);
                    } else {
                        interval = "year";
                        month = 0;
                    }
                    if (type == "total") {
                        displayValue = this.y + " articles (" + (dataSources.sources[this.series.index].getRatio(year, month) * 100).toPrecision(2) + "% )";
                    } else if (type == "ratio") {
                        displayValue = (this.y * 100).toPrecision(2) + "% (" + dataSources.sources[this.series.index].getTotal(year, month) + " articles)";
                    }
                    if (interval == "month") {
                        return '<b>'+ this.series.name +'</b><br/>'+ month_name + ': ' + displayValue;
                    } else {
                        return '<b>'+ this.series.name + '</b><br/>' + year +': ' + displayValue;

                    }
             }
           },
          series: dataSources.listSeries(type),
          plotOptions: {
               series: {
                  cursor: 'pointer',
                  point: {
                     events: {
                        click: function() {
                            date = new Date(this.x);
                            query_date = date.getFullYear();
                            if (dataSources.sources[this.series.index].interval == "month") {
                                month = date.getMonth() + 1;
                                if (month < 10) {
                                    query_date = query_date + "/0" + month;
                                } else {
                                    query_date = query_date + "/" + month;
                                }
                            }
                            showArticles(query_date, this.series);
                        }
                     }
                  }
               }
            }
        });
        showSeriesDetails();
    }
    function showArticles(query_date, series) {
            $('#articles').empty().height('50px');
            $('#articles').showLoading();
            var this_query = dataSources.sources[series.index].api_query;
            var callback;
            if (dataSources.sources[series.index].country[0] == "Australia") {
                this_query = this_query + "&l-year=" + query_date;
                callback = "callback";
            } else if (dataSources.sources[series.index].country[0] == "New Zealand") {
                this_query = this_query + "&and[year]=" + query_date;
                callback = "jsonp";
            }
            $.ajax({
                    "dataType": "jsonp",
                    "jsonp": callback,
                    "url": this_query,
                    "success": function(results) {
                            $('#articles').height('');
                            $('#articles').append('<h3>Articles</h3>');
                            if (dataSources.sources[series.index].country[0] == "Australia") {
                                show_trove_articles(results, query_date, series);
                            } else if (dataSources.sources[series.index].country[0] == "New Zealand") {
                                show_digitalnz_articles(results, query_date, series);
                            }
                            $('#articles').hideLoading();
                    }
            });
    }
    function show_trove_articles(results, query_date, series) {
        if (results.response.zone[0].records.article.length > 0) {
            var articles = $('<ul id="articles"></ul>');
            $.each(results.response.zone[0].records.article, function(key, article) {
                newspaper = article.title.value.match(/(.*?) \(/)[1];
                date = $.format.date(article.date + ' 00:00:00.000', 'd MMMM yyyy');
                articles.append('<li><a target="_blank" class="article" href="'+ article.troveUrl + '">' + article.heading + ' (' + newspaper + ', ' + date + ')</a></li>');
            });
            $('#articles').append(articles);
        }
        $('#articles').append('<div class="more"><p><a target="_blank" href="' + dataSources.sources[series.index].web_query + '&fromyyyy=' + query_date + '&toyyyy=' + query_date + '">&gt; View more in Trove</a></p></div>');

    }
    function show_digitalnz_articles(results, query_date, series) {
        if (results.search.results.length > 0) {
            var articles = $('<ul id="articles"></ul>');
            $.each(results.search.results, function(key, article) {
                    articles.append('<li><a target="_blank" class="article" href="'+ article.source_url + '">' + article.title + '</a></li>');
            });
            $('#articles').append(articles);
        }
        $('#articles').append('<div class="more"><p><a target="_blank" href="' + dataSources.sources[series.index].web_query + '&i[year]=%5B' + query_date + '+TO+' + query_date + '%5D&">&gt; View more at DigitalNZ</a></p></div>');
    }
    function clear_last() {
        dataSources.sources.pop();
        if (dataSources.sources.length > 0) {
            makeChart($('#graph_type').val());
            if (dataSources.sources.length == 1) {
                $("#clear_all").hide();
            }
        } else {
            chart.destroy();
            reset();
        }

    }
    function clear_all() {
        dataSources.sources = [];
        chart.destroy();
        reset();
    }
    function reset() {
        decade_current = decade_start;
        $("#graph").hide();
        $("#clear_last1").hide();
        $("#clear_all1").hide();
        $("#clear_last2").hide();
        $("#clear_all2").hide();
        $("#type_selector").hide();
        $("#trove-results").hide();
        $("#articles").empty();
        $("#metadata").hide();
    }
    $('#graph_type').change(function() {
       makeChart($('#graph_type').val());
    });
    $("#do_keyword_query").button().click(function(){ get_query(); });
    $("#do_url_query").button().click(function(){ get_query(); });
    $('#query').keydown(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            get_query();
        }
    });
    $("#clear_last1").button().click(function(){ clear_last(); });
    $("#clear_all1").button().click(function(){ clear_all(); });
    $("#clear_last2").button().click(function(){ clear_last(); });
    $("#clear_all2").button().click(function(){ clear_all(); });
    $('#query_forms a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
    function showSeriesDetails() {
        $("#series-details").empty();
        $.each(dataSources.sources, function(key, source) {
            var $group = $('<div class="accordion-group"></div>');
            var $header = $('<div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-parent="#series-details" href="#series' + key + '">Query ' + (key+1) + '</a></div>');
            var $body = $('<div id="series' + key + '" class="accordion-body collapse"></div>');
            var $inner = $('<div class="accordion-inner"></div>');
            $inner.append('<p><small>' + source.country[0] + '</small></p>');
            $inner.append('<p><small>' + source.name + '</small></p>');
            $inner.append('<p><small>' + source.dates + '</small></p>');
            if (source.country[0] == "Australia") {
                var $show_trove = $('<p><a target="_blank" href="' + source.query + '" class="btn btn-mini">Show in Trove &laquo;</a></p>');
                $inner.append($show_trove);
            } else if (source.country[0] == "New Zealand") {
                var $show_dnz = $('<p><a target="_blank" href="' + source.query + '" class="btn btn-mini">Show in DigitalNZ &laquo;</a></p>');
                $inner.append($show_dnz);
            }
            $body.append($inner);
            $group.append($header).append($body);
            $("#series-details").append($group);
        });
    }
    $("#show-form").click(function(){
        $("#save-graph").modal("show");
    });
    $("#save-form").submit(function() {
        $("#id_sources").val(JSON.stringify(dataSources));
    });
    $("#submit-form").click(function(){
        $("#save-form").submit();
    });
    get_query();
});




















