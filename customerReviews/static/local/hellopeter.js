
var map;
var markers = [];
var services;

var latDimension;
var lngDimension;
var idDimension;
var idGrouping;

var services;
var service_all;
var  service_date;
var  service_dates ;
var  service_hour; 
var service_hours ;
       
var charts;
var chart;
var servicelist; 
var serviceNestByDate;

var formatNumber;
var formatChange;
var formatDate;
var formatTime;

var serviceBySupplier;
var serviceByIndustry;
var serviceGroupedBySuppliers;
var serviceGroupedByIndustries;

var serviceByDate;
var serviceBySuppliers;


//setting up legend plots
var colors =	[ ["Local", "#377EB8"],
				  ["Global", "#4DAF4A"] ];
				  
var margin = {top: 25, right: 40, bottom: 35, left: 85},
				w = 500 - margin.left - margin.right,
				h = 350 - margin.top - margin.bottom;
				
var svg = d3.select("#commentBar")
			.append("svg")
			.attr("width", 50)
			.attr("height", 40)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");				
				
				

serviceNestByDate = d3.nest().key(function(d) { return d3.time.day(d.comment_datetime); });

//nest by supplier and the by date
serviceNestBySupplier = d3.nest().key(function(d) { return d.supplier_name; }).sortKeys(d3.ascending);
								 
          
function init() {
	
	// Various formatters.
  	formatNumber = d3.format(",d"),
    formatChange = d3.format("+,d"),
    formatDate = d3.time.format("%B %d, %Y"),
    formatTime = d3.time.format("%I:%M %p");    
  
    //Initialize map
	initializeMap();
	
	//create crossfilter
	computeService();
	
	// bind map bounds to lat/lng filter dimensions
	latDimension = services.dimension(function(p) { return p.latitude; });
	lngDimension = services.dimension(function(p) { return p.longitude; });
	google.maps.event.addListener(map, 'bounds_changed', function() {
	var bounds = this.getBounds();
	var northEast = bounds.getNorthEast();
	var southWest = bounds.getSouthWest();
	
	lngDimension.filterRange([southWest.lng(), northEast.lng()]);
	latDimension.filterRange([southWest.lat(), northEast.lat()]);
	
    updateCharts();
  });

  // dimension and group for looking up currently selected markers
  idDimension = services.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });
  

  renderAll();
}

function initializeMap() {
  google.maps.visualRefresh = true;
  var myLatlng = new google.maps.LatLng(-25.74, 28.187);
  var mapOptions = {
    zoom: 6,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    panControl: false
  };
  //map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  map = new google.maps.Map(document.getElementById('hellomap'), mapOptions);
  // create array of markers from service branch areas and add them to the map
  console.log(serviceComments.length);
  for (var i = 0; i < serviceComments.length; i++) {
    var comment = serviceComments[i];
      markers[i] = new google.maps.Marker({
      position: new google.maps.LatLng(comment.latitude, comment.longitude),
      map: map,
      title: 'marker ' + comment.latitude
    });
  
  }
}
  

  
function computeService() {	
  
  // Date {Mon Jan 01 2001 06:00:00 GMT+0200 (SAST)}
  serviceComments.forEach(function(d, i) {
    d.index = i;
    d.comment_datetime = parseServiceDate(d.comment_datetime);
    d.longitude = +d.longitude;
    d.latitude = +d.latitude;
  });

  //console.log(services);

  services = crossfilter(serviceComments),
  service_all = services.groupAll(),
  service_date = services.dimension(function(d) { return d.comment_datetime; }),
  service_dates = service_date.group(d3.time.day),
  service_hour = services.dimension(function(d) { return d.comment_datetime.getHours() + d.comment_datetime.getMinutes() / 60; }),
  service_hours = service_hour.group(Math.floor);
  
  
  
  serviceBySupplier = services.dimension(function(d){return d.supplier_name;});
  serviceGroupedBySuppliers = serviceBySupplier.group();
  serviceByIndustry = services.dimension(function(d){return d.industry_name;});     
  serviceGroupedByIndustries = serviceByIndustry.group();

/*     
var a = serviceGroupedBySuppliers.top(5);
console.log( a[0].value, a[0].key );
console.log(a[1].value , a[1].key );
console.log(a[2].value,a[2].key );
console.log(a[3].value, a[3].key);
console.log(a[4].value, a[4].key);
console.log(serviceGroupedBySuppliers);   

var data = [
    { date: "25-1-2012",
        sentiment: "Positive",
        year: 2012
    },
    { date: "25-1-2012",
        sentiment: "Negative",
        year: 2012
    },
    { date: "25-1-2012",
        sentiment: "Positive",
        year: 2012
    },
    { date: "26-1-2012",
        sentiment: "Positive",
        year: 2012
    },
    { date: "27-1-2012",
        sentiment: "Negative",
        year: 2012
    }
]; 

var ndx  = crossfilter(data);

var dateDim = ndx.dimension(function(d) {return d.date;});
dateDim.filterRange(["25-1-2012","30-1-2012"]);
var sentimentDim = ndx.dimension(function(d) {return d.sentiment;});
var sentimentGroup = sentimentDim.group();
var d= sentimentGroup.top(Infinity);
   
var pivotGroup = services.dimension(function(d) { return d.supplier_name + "/" + d.comment_datetime; }).group();    
  
 */
 
 
      
  charts = [   
   barChart()
        .dimension(service_hour)
        .group(service_hours)
      .x(d3.scale.linear()
        .domain([0, 24])
        .rangeRound([0, 10 * 24])),
        //.xUnits(function(){return 10;}),
        
     barChart()
        .dimension(service_date)
        .group(service_dates)
        .round(d3.time.day.round)
        .x(d3.time.scale()
        .domain([new Date(2013, 4, 1), new Date(2014, 7, 1)])
        .rangeRound([0, 10 * 90]))
        .filter([new Date(2014, 3, 1), new Date(2014, 2, 1)]), 
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

 // Render the initial service list.
  //servicelist = d3.select("#service-list")
   //   .data([serviceList]);
  servicelist = d3.select("#reports")
      .data([serviceList]);
 }
 
 // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }
  
  

  // Renders all of the charts
 function updateCharts() {
   chart.each(render);
   servicelist.each(render);
 }
  
 // set visibility of markers based on crossfilter
 function updateMarkers() {
   var pointIds = idGrouping.all();
    for (var i = 0; i < pointIds.length; i++) {
        var pointId = pointIds[i];
       markers[pointId.key].setVisible(pointId.value > 0);
    }
 }
   
   
  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    updateMarkers();
    updateCharts();
  }
  
 //2013-05-03 14:53:00
  // Like d3.time.format, but faster.
  //new Date(year, month, day, hours, minutes, seconds, milliseconds)
  //Service comment example: 2013-12-10T14:30:20
  //JavaScript counts month from 0 to 11. January is 0. Dec is 11.
  function parseServiceDate(d) {
    return new Date(d.substring(0, 4),    
        d.substring(5, 7) - 1, 
        d.substring(8, 10),  
        d.substring(11, 13),  
        d.substring(14, 16)); 
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function serviceList(div) {
    serviceByDate = serviceNestByDate.entries(service_date.top(300));
    serviceBySuppliers = serviceNestBySupplier.entries(serviceBySupplier.top(300));
    
    console.log(serviceBySuppliers);

   // div.each(function() {
   //   var service_date = d3.select(this).selectAll(".date")
   //       .data(serviceByDate, function(d) { return d.key; });

   //   service_date.enter().append("div")
   //       .attr("class", "date")
   //       .append("div")
   //       .attr("class", "day")
  //        .text(function(d) { return formatDate(d.values[0].comment_datetime); });

  //    service_date.exit().remove();

  //    var service = service_date.order().selectAll(".service")
  //        .data(function(d) { return d.values; }, function(d) { return d.index; });
          

  //    var serviceEnter = service.enter().append("li")
  //        .attr("class", "service");

  //    serviceEnter.append("div")
  //        .attr("class", "time")
  //        .text(function(d) { return formatTime(d.comment_datetime); });

  //    serviceEnter.append("p")
  //        .attr("class", "service-content")
  //        .text(function(d) { return d.consumer_comment; });
      
  // ----------supplier service comments -----------
      div.each(function() {
      var service_supplier = d3.select(this).selectAll(".date")
          .data(serviceBySuppliers, function(d) { return d.key; });

      service_supplier.enter().append("div")
          .attr("class", "date")
          .append("div")
          .attr("class", "name")
          .text(function(d) { return d.values[0].supplier_name; })
          .attr("style","fill: #999999; stroke: #000000;  font-size: 16px; background-color: #d1dcc0")
      	  .style("color","#DE3378");//#DE3378
      	  //#e5d1c5,#fafafa
          //.append("div")
          //.attr("class", "name")
          //.text(function(d) { return formatDate(d.values[0].comment_datetime); });
 		 


      service_supplier.exit().remove();

      var serviceOrdered = service_supplier.order().selectAll(".service")
          .data(function(d) { return d.values; }, function(d) { return d.index; });
          
     
      var serviceEnter = serviceOrdered.enter().append("li")
          .attr("class", "service");

      serviceEnter.append("div")
          .attr("class", "day")
          .text(function(d) { return formatDate(d.comment_datetime); })
          .style("font-weight","bold");

      serviceEnter.append("p")
          .attr("class", "service-content")
          .text(function(d) { return d.consumer_comment; });
          
     var legend = svg.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 100)
		.attr('transform', 'translate(-20,50)');

	 var legendRect = legend.selectAll('rect').data(colors);

		legendRect.enter()
    			  .append("rect")
    			  .attr("y", 0)
                  .attr("width", 10)
    		      .attr("height", 10);

        legendRect
    			.attr("x", function(d, i) {
        							return w - 65 - i * 70;
    							})
    			.style("fill", function(d) {
        							return d[1];
    			});
      
          
      serviceOrdered.exit().remove();

      serviceOrdered.order();
    });
     //var point = new google.maps.LatLng(function(d) { return d.latitude; },function(d) { return d.longitude; });
    // var marker = new google.maps.Marker({
     //           position: point,
     //           map: map
     //       }); 
    
  }
  
 function serviceList2(div) {
    serviceByDate = serviceNestByDate.entries(service_date.top(300));
    serviceBySuppliers = serviceNestBySupplier.entries(serviceBySupplier.top(300));
    
    var nested_comments = d3.nest()
							.key(function(d) { return d.supplier_name; })
							.key(function(d) { return d.comment_datetime; })
							.entries(services);
    
  // ----------supplier service comments -----------
      div.each(function() {
      var service_supplier = d3.select(this).selectAll(".date")
          .data(serviceBySuppliers, function(d) { return d.key; });

      service_supplier.enter().append("div")
          .attr("class", "date")
          .append("div")
          .attr("class", "name")
          .text(function(d) { return d.values[0].supplier_name; })
          .attr("style","fill: #999999; stroke: #000000;  font-size: 16px; background-color: #d1dcc0")
      	  .style("color","#DE3378");//#DE3378
      	  //#e5d1c5,#fafafa
          //.append("div")
          //.attr("class", "name")
          //.text(function(d) { return formatDate(d.values[0].comment_datetime); });
 		 


      service_supplier.exit().remove();

      var serviceOrdered = service_supplier.order().selectAll(".service")
          .data(function(d) { return d.values; }, function(d) { return d.index; });
          
     
      var serviceEnter = serviceOrdered.enter().append("li")
          .attr("class", "service");

      serviceEnter.append("div")
          .attr("class", "day")
          .text(function(d) { return formatDate(d.comment_datetime); })
          .style("font-weight","bold");

      serviceEnter.append("p")
          .attr("class", "service-content")
          .text(function(d) { return d.consumer_comment; });
          
     var legend = svg.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 100)
		.attr('transform', 'translate(-20,50)');

	 var legendRect = legend.selectAll('rect').data(colors);

		legendRect.enter()
    			  .append("rect")
    			  .attr("y", 0)
                  .attr("width", 10)
    		      .attr("height", 10);

        legendRect
    			.attr("x", function(d, i) {
        							return w - 65 - i * 70;
    							})
    			.style("fill", function(d) {
        							return d[1];
    			});
      
          
      serviceOrdered.exit().remove();

      serviceOrdered.order();
    });
    
    
  }


function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  };