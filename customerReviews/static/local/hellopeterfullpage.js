var map, layer;
var comment, latLng, marker;
var markers = [];
var markerCluster = null;
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
var serviceNestBySupplier;


// Various formatters.
var formatNumber= d3.format(",d");
var formatChange= d3.format("+,d");
var formatDate= d3.time.format("%B %d, %Y");
var formatTime = d3.time.format("%I:%M %p");

var serviceBySupplier;
var serviceGroupedBySuppliers;
var serviceByIndustry;
var serviceGroupedByIndustries;

var serviceNestByIndustry;
var industries;

var sentimentNestBySupplierByProvince;
var sentimentBySupplier;
var sentimentGroupedBySuppliers;

var serviceByDate;
var serviceBySuppliers;
var sentimentByProvinces;
var sentimentByBranchByHour;
var markerBounds;

var gp_pos_sentcount,fs_pos_sentcount,mp_pos_sentcount,lp_pos_sentcount,nw_pos_sentcount,ec_pos_sentcount,wc_pos_sentcount,nc_pos_sentcount,kzn_pos_sentcount;
var gp_neg_sentcount,fs_neg_sentcount,mp_neg_sentcount,lp_neg_sentcount,nw_neg_sentcount,ec_neg_sentcount,wc_neg_sentcount,nc_neg_sentcount,kzn_neg_sentcount;

var gp_branches_dict_pos, gp_branches_dict_neg , nw_branches_dict_pos , nw_branches_dict_neg;
var nc_branches_dict_pos,  nc_branches_dict_neg , wc_branches_dict_pos , wc_branches_dict_neg;
var mp_branches_dict_neg,  mp_branches_dict_pos , lp_branches_dict_neg, lp_branches_dict_pos; 
var kz_branches_dict_neg,  kz_branches_dict_pos , fs_branches_dict_neg, fs_branches_dict_pos; 
var ec_branches_dict_neg,  ec_branches_dict_pos;


var gp_branches_pos_words_dict, gp_branches_neg_words_dict , nw_branches_pos_words_dict , nw_branches_neg_words_dict;
var nc_branches_pos_words_dict,  nc_branches_neg_words_dict , wc_branches_pos_words_dict , wc_branches_neg_words_dict;
var mp_branches_neg_words_dict,  mp_branches_pos_words_dict , lp_branches_neg_words_dict, lp_branches_pos_words_dict; 
var kz_branches_neg_words_dict,  kz_branches_pos_words_dict , fs_branches_neg_words_dict, fs_branches_pos_words_dict; 
var ec_branches_neg_words_dict,  ec_branches_pos_words_dict;
 
var provinceSelected;
var wordcountdict ={};


var chart_sentiment, data, chart_sentiment_neg;

var date_width;
var time_width; 

var choose_province_list = [];

var industry_arr = [];
var the_pos_sent_arr = [];
var the_neg_sent_arr = [];


//setting up legend plots
var colors =	[ ["Local", "#377EB8"],
				  ["Global", "#4DAF4A"] ];
				  
var margin = {top: 25, right: 40, bottom: 35, left: 85},
				w = 500 - margin.left - margin.right,
				h = 350 - margin.top - margin.bottom;
				
var margin = {top: 30, right: 10, bottom: 30, left: 10}	;			

		

serviceNestByDate = d3.nest().key(function(d) { return d3.time.day(d.comment_datetime); });
//nest by supplier and the by date
serviceNestBySupplier = d3.nest().key(function(d) { return d.supplier_name; }).sortKeys(d3.ascending)
								 .key(function(d) { return formatDate(d.comment_datetime); }).sortKeys(d3.ascending);
								 
								 
sentimentNestBySupplierByProvince = d3.nest().key(function(d) { return d.supplier_name; }).sortKeys(d3.ascending)
											 .key(function(d) { return d.province; })
											 .key(function(d) { return d.comment_sentiment; })
											 .rollup(function(sentiments) { return sentiments.length; });

sentimentNestByBranchByHour = d3.nest().key(function(d) { return d.supplier_name; }).sortKeys(d3.ascending)
											 .key(function(d) { return d.province; })
											 .key(function(d) { return d.branch_area; })
											 .key(function(d) { return d.comment_sentiment; })
											 .rollup(function(sentiment_per_hour) { return sentiment_per_hour.length; });
											 
commentsNestByBranch = d3.nest().key(function(d) { return d.supplier_name; }).sortKeys(d3.ascending)
								  .key(function(d) { return d.province; })
								  .key(function(d) { return d.branch_area; })
								  .key(function(d) { return d.comment_sentiment; });
											 											 
sentimentNestByIndustry = d3.nest().key(function(d) { return d.industry_name; }).sortKeys(d3.ascending)
								.key(function(d) { return d.comment_sentiment; });									 
//sentimentNestByBranchByHour.sortValues =  function(order) { return sentimentNestByBranchByHour.rollup(function(values) { return values.sort(order); }); }; 

document.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) {
        //alert('Enter keydown');
        handleSubmit();
        event.preventDefault();
    }
});
        
              
function init() {
	
    //Initialize map
	initializeMap();
	
	//handleSubmit();
	
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
    //provinceSentimentCount();
  });

	//updateCharts();
  // dimension and group for looking up currently selected markers
  idDimension = services.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });
  
  //clear before you re-render
  renderAll();
}


function initializeMap() {

  google.maps.visualRefresh = true;
  var myLatlng = new google.maps.LatLng(-25.74, 28.187);
  var mapOptions = {
    zoom: 5,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('hellomap'), mapOptions);
  
  
  // create array of markers from service branch areas and add them to the map
  for (var i = 0; i < serviceComments.length; i++) {
    var comment = serviceComments[i];
      markers[i] = new google.maps.Marker({
      'position': new google.maps.LatLng(comment.latitude, comment.longitude),
      map: map,
      title: 'marker ' + comment.consumer_comment,
      icon:'images/marker-icon.jpg'
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
  //console.log(d.comment_datetime);
  services = crossfilter(serviceComments),
  service_date = services.dimension(function(d) {  return d.comment_datetime; }),
  service_dates = service_date.group(d3.time.day),
  service_hour = services.dimension(function(d) { return d.comment_datetime.getHours() + d.comment_datetime.getMinutes() / 60; }),
  service_hours = service_hour.group(Math.floor);
  
  serviceBySupplier = services.dimension(function(d){return d.supplier_name;}); 
  
  industries = services.dimension(function(d){return d.industry_name;});

  // service_branch = services.dimension(function(d){return d.branch_area;});  
  //sentimentBySupplier = services.dimension(function(d){return d.sentiment;}); // create sentiment dimension
 
  time_width = parseInt(d3.select('#timechartcontainer').style('width'), 10);
  date_width = parseInt(d3.select('#datechartcontainer').style('width'), 10);  
     
  charts = [   
   barChart()
        .dimension(service_hour)
        .group(service_hours)
      .x(d3.scale.linear()
        .domain([0, 24])
        //.rangeRound([0,10 * 24]))
        .rangeRound([0,time_width -20]))
        .filter([8,20]),
        
     barChart()
        .dimension(service_date)
        .group(service_dates)
        .round(d3.time.day.round)
       .x(d3.time.scale()
        //.domain([new Date(2014, 4, 31), new Date(2014, 8, 31)])
        .domain(d3.extent(serviceComments, function(d) { return d.comment_datetime; }))
        .rangeRound([0,date_width - 20]))
        //.rangeRound([0, 10 * 90]))
        .filter(d3.extent(serviceComments, function(d) { return d.comment_datetime; })), 
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  
  chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });


 // Render the initial service list.
    servicelist = d3.select("#supplierstable").data([serviceTable]); 	     
 }
 

	// var the_industri;
	// function getTheIndustry(myArray)
	// {
		// var the_details;
		// var the_details_int;
		// var the_final_dets;
// 	
	// console.log("the service suppliers");
	// console.log(serviceBySuppliers.length);
// 		
		// for ( var k = 0; k < serviceBySuppliers.length; k++ )
		// {
			// if( serviceBySuppliers[k].key == myArray[0] )
			// {
				// the_details = serviceBySuppliers[k].values;
// 				
				// for( var j = 0; j < the_details.length; j++ )
				// {
					// the_details_int = the_details[j].values;
// 					
					// for ( var e = 0; e < the_details_int.length; e++)
					// {
						// the_final_dets = the_details_int[e];
						// the_industri = the_final_dets["industry_name"];
						// //console.log(the_industri);
						// return the_industri;
					// }
				// }	
			// }
		// }
	// }
	
 //takes user input and updates all filters according to user query! re-renders all the views
 function handleSubmit(){
 	//console.log("refresh");
	var myArray;
	myArray = document.getElementById("supplierInput").value.toUpperCase().split(",");
	
	//console.log(myArray[0]);
	
	//ind = getTheIndustry(myArray);
	//console.log(ind);

	if (myArray.length >= 1 && myArray[0].length > 1){	
			serviceBySupplier.filter(function(d){return myArray.indexOf(d) > -1;}); 
		}
	else{
	   serviceBySupplier.filterAll();
	   industries.filterAll();
	  }
	renderAll();
}

 
 // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }
  
  // Renders all of the charts
 function updateCharts() {
    chart.each(render);
    //chart1.each(render);
    //chart2.each(render);
    servicelist.each(render);
    //provinceSentimentCount(); 
    drawSentimentChart();
    //drawPie3dChart();
    //drawBranchSentimentChart(1,104);
    
 }
 
  // set visibility of markers based on crossfilter
 function updateMarkers() {
 	
    markerBounds = new google.maps.LatLngBounds();
    
    var pointIds = idGrouping.all();
    var point;
    for (var i = 0; i < pointIds.length; i++) {
       var pointId = pointIds[i];
       markers[pointId.key].setVisible(pointId.value > 0);
    }   
      markers.forEach (function (d) {     
        	point = new google.maps.LatLng(d.position.k, d.position.B);
        	markerBounds.extend(point);
        }); 
        	
        //map.fitBounds(markerBounds);
		markerCluster = new MarkerClusterer(map, markers,{
        	gridSize:40,
        	minimumClusterSize: 4,
        	calculator: function(markers, numStyles) {
	    	// Custom style can be returned here
            	return {
                	text: markers.length,
                	index: 1
            	};
       		}
    	});
		markerCluster.setIgnoreHidden(true);
		//markerCluster.resetViewport();			    
		markerCluster.repaint();	      
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
  
  
 
  function sentimentByIndustry()
  {
	industry_arr = [];
  	for( var i = 0; i < sentimentNestByIndustries.length; i++ )
  	{
  		industry_name = sentimentNestByIndustries[i].key;
  		industry_arr.push(industry_name);
        sentiments_objects = sentimentNestByIndustries[i].values;
        
        for ( var j = 0; j < sentiments_objects.length; j++ )
        {
        	
        	the_sentiment = sentiments_objects[j].key;
        	the_sentiment_arr = sentiments_objects[j].values;
        	the_count_sentiment = the_sentiment_arr.length;
        	
        	if( sentiments_objects.length > 1 )
        	{
	        	if( the_sentiment == "positive" )
	        	{
	        		the_pos_sent_arr.push(the_count_sentiment);
	        	}
        	
	        	else if( the_sentiment == "negative" )
	        	{
	        		the_neg_sent_arr.push(the_count_sentiment);
	        	}
        	}
        	
        	        	
        	else if ( sentiments_objects.length < 2 )
        	{
        		the_sentiment = sentiments_objects[j].key;
	        	//console.log(i, ": ", j, " : the sentiment", the_sentiment);
	        	
	        	the_sentiment_arr = sentiments_objects[j].values;
	        	the_count_sentiment = the_sentiment_arr.length;
        		
        		if( the_sentiment == "positive" )
	        	{
	        		the_pos_sent_arr.push(the_count_sentiment);
	        		the_neg_sent_arr.push(0);
	        	}
        	
	        	else if( the_sentiment == "negative" )
	        	{
	        		the_neg_sent_arr.push(the_count_sentiment);
	        		the_pos_sent_arr.push(0);
	        	}
        	}
        }
                 
  	}
  }
  
  function serviceTable(div) {
  	
  	
    serviceBySuppliers = serviceNestBySupplier.entries(serviceBySupplier.top(Infinity));
    sentimentByProvinces = sentimentNestBySupplierByProvince.entries(serviceBySupplier.top(Infinity));
    sentimentByBranchByHours = sentimentNestByBranchByHour.entries(serviceBySupplier.top(Infinity));
    commentsNestByBranches = commentsNestByBranch.entries(serviceBySupplier.top(Infinity));

   sentimentNestByIndustries = sentimentNestByIndustry.entries(industries.top(500));
   
    provinceSentimentCount();
    createPieChartProvData();
    createPieChartIndData();
    sentimentByBranches();
    wordCloudByBranches();
    
    
    //sentimentByIndustry();
    
    //console.log(commentsNestByBranches);
    //alertobjectKeys(sentimentByBranchByHours);
    
      div.each(function() {
      	 
       var tr = d3.select(this)
  				.selectAll("tr")
  				.data(serviceBySuppliers,function(d) { return d.key; });
    	tr.enter().append("tr")
    	            .append("td")
    				.text(function(d){return d.key;}) // print supplier name
    				.attr("style","fill: #999999; stroke: #000000; font-weight:bold");			
    	tr.exit().remove();
    	
    	var tc_svg = tr.order().selectAll("tr")
      					.data(function(d) { return d.values; })
      					.enter().append("tr")
      					.text(function(d2){return d2.key;}) //print service date
    					.attr("style","background-color:white; color: steelblue")
        				.append("th")
        				.append("svg")
        				.attr("height", 16)
        				//.attr("width", "100%")
        				.attr('transform', 'translate(-5,-2)')
        				.style("background-color","white");			
        				
		var rects =	 tc_svg.selectAll("td")
						.data(function(d2){ return  d2.values;})
                 		.enter().append("svg:rect") // create the rectangle
                 		.attr("y", 0)
                 		.attr("x", function(d, i) {
            				return (i * 15) + 5;
        						})
					    .attr("height",15)
					    .attr("width",11)
					    .attr("rx","15")
					    .attr("ry", "2")
					    .attr("style", function(d, i) { return d.comment_score == "1" ? "stroke:#2ca02c; fill:#2ca02c" : "stroke:#d62728;fill:#d62728"; }) // color code rectangles
					    .on("mouseover", rollover);
								    //.append("svg:title") 
								    //.text(function(d) {  return d.consumer_comment; });
						function rollover(d,i) {
							        var text_color = "" + d.comment_score;
							        //var txt = text_color.substr(0, text_color.indexOf("<")).trim();
							        console.log(text_color);
								 	d3.select("p.rollover").remove();
								 	d3.select("#textreports")
								 		.attr("style","background-color:#1BBC9; font-size:4; text-align: left;")
								 		.attr("class", "rollover")
								 		.text(d.consumer_comment)
								 		.attr("style", function(txt) { return text_color === "1" ? "font-size:4; text-align: left; color:green" : "font-size:4; text-align: left; color:red"; });
								 		//.attr("style", function(text_color) { return text_color == "negative" ? "font-size:4; text-align: left; color:red" : "font-size:4; text-align: left; color:green"; });
								 	//d3.select("#textreports").attr("style","background-color:white; font-size:4; text-align: left;").text(d.consumer_comment).style("color", "green");
								 	//text_color.valueOf() == new String("negative").valueOf()
								 	getCommentDate(d.comment_datetime);
								 	getBranch(d.branch_area);
								 	getCustomerName(d.consumer_name);
								 	//console.log(d.industry_name);
								 	
								 	//sentimentByIndustry();
								 	
								 	// for (var i = 0; i < serviceComments.length; i++) 
								 	// {
								 		// console.log(serviceComments[i]);
								 	// }
							
								 };			    	
    });
       
    
  }


function changeFromIntMonthToDay(month_int)
{
 	var monthNames = ["January", "February", "March", "April", "May", "June",
  						"July", "August", "September", "October", "November", "December"
					];
 	var date_str = monthNames[month_int];
 	
 	return date_str;
}


function getMinsInTwoDigitFormat(min_time)
{
 	
 	var min_two = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];
 	var time_two_dig = "";
 	if( min_time < 10 )
 	{
 		time_two_dig = min_two[min_time];
 	}
 	
 	else 
 	{
 		time_two_dig = min_time;
 	}
 	
 	return time_two_dig;	
}


  
 function getCommentDate(the_date)
 {
 	var date_month = the_date.getMonth();
 	var date_mon_str = changeFromIntMonthToDay(date_month);
 	var mins = getMinsInTwoDigitFormat(the_date.getMinutes());
 	var date_full = "DATE:  " + the_date.getDate() + " " + date_mon_str + " " + the_date.getFullYear() + " " + the_date.getHours() + ":" + mins;
 	
 	d3.select("#date_roll").attr("style","background-color:#1BBC8B; font-size:4;").text(date_full);
 	//console.log(the_date);
 }
 
function getBranch(the_branch) 
{
	that_branch = "BRANCH:    " + the_branch;
	d3.select("#branch_roll").attr("style","background-color:#1BBC8B; font-size:4;").text(that_branch);
}

function getCustomerName(the_client) 
{
	that_client = "CLIENT:     " + the_client;
	d3.select("#client_roll").attr("style","background-color:#1BBC6B; font-size:4;").text(that_client);
}
 
 
function provinceSentimentCount(){
  	
  	var supplierkey,provinceslist,province,provincesentiments;
  	gp_pos_sentcount = fs_pos_sentcount =mp_pos_sentcount =lp_pos_sentcount =nw_pos_sentcount =ec_pos_sentcount =wc_pos_sentcount =nc_pos_sentcount =kzn_pos_sentcount =0;
  	gp_neg_sentcount = fs_neg_sentcount =mp_neg_sentcount =lp_neg_sentcount =nw_neg_sentcount =ec_neg_sentcount =wc_neg_sentcount =nc_neg_sentcount =kzn_neg_sentcount =0;
  	
  	for (var i = 0; i < sentimentByProvinces.length; i++) {
    	supplierkey = sentimentByProvinces[i].key;
        provinceslist = sentimentByProvinces[i].values;
        
        for (var j = 0; j < provinceslist.length; j++) {
    		province = provinceslist[j].key;
        	provincesentiments = provinceslist[j].values;
        	  	
        	for (var k = 0; k < provincesentiments.length; k++) {
       
	        	if (province == "GP"){
	        		if (provincesentiments[k].key == "positive"){
	        			gp_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			gp_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	            if (province == "WC"){
	        		if (provincesentiments[k].key == "positive"){
	        			wc_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			wc_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "FS"){
	        		if (provincesentiments[k].key == "positive"){
	        			fs_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			fs_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "NC"){
	        		if (provincesentiments[k].key == "positive"){
	        			nc_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			nc_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "ES"){
	        		if (provincesentiments[k].key == "positive"){
	        			ec_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			ec_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "NW"){
	        		if (provincesentiments[k].key == "positive"){
	        			nw_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			nw_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "KZ"){
	        		if (provincesentiments[k].key == "positive"){
	        			kzn_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			kzn_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "MP"){
	        		if (provincesentiments[k].key == "positive"){
	        			mp_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			mp_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}
	        	if (province == "LP"){
	        		if (provincesentiments[k].key == "positive"){
	        			lp_pos_sentcount += provincesentiments[k].values;
	        		}
	        		else if(provincesentiments[k].key == "negative"){
	        			lp_neg_sentcount += provincesentiments[k].values;
	        		}
	        	}             
  	        }
      	}
  	 }
  	 
  }
  
/*  
function denestData(data){
	var key; var count =0;
	for (key in data) {
		count += 1;
    	if (typeof(data[key]) == "object" && data[key] != null) {
      		denestData(data[key]);
    	} else { 
      		console.log("{"+ key + ":" + data[key] + "}");
      		//console.log("Value:" + data[key]);
      		//alert("Key:" + key + " Values:" + data[key]);
    	}
  	}	
}

function alertobjectKeys(data) {
  for (var key in data) {
  	//data[key] is values whose key is key
  	denestData(data[key]);
 	
    if (typeof(data[key]) == "object" && data[key] != null) {
      alertobjectKeys(data[key]);
    } else { 
      //console.log("Key:" + key);
      console.log("Value:" + data[key]);
      //alert("Key:" + key + " Values:" + data[key]);
    }
  } 
}
*/

function sortObject(obj) {
    var arr =[];
    var arr2 = [];
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'key': prop,
                'value': obj[prop]
            });
        }
    }
    arr.sort(function(a, b) { return b.value - a.value; });
   
   
	
	if (arr.length >10){
		limit = 10;
	}
	else {limit = arr.length;}
	
	dictSorted = {};
	
	// Now process that object with it:
	for (var i=0; i<limit; i++) {
	    arr2.push(arr[i].value);
	    dictSorted[arr[i].key] = arr[i].value;
	}
    
    //console.log(Object.keys(dictSorted));
    //return dictSorted; // returns sorted dictionary object
    return {
     sortedKeys: Object.keys(dictSorted),
     dictData: dictSorted
    };  
}

function sentimentByBranches(){
  	
  	var provinceslist,province,sentimentlist,branch,sentiment,hourlist,sent_count,hour,branchlist;
  	gp_branches_dict_pos ={}, gp_branches_dict_neg ={}, nw_branches_dict_pos ={}, nw_branches_dict_neg={};
    nc_branches_dict_pos={},  nc_branches_dict_neg ={}, wc_branches_dict_pos ={}, wc_branches_dict_neg={};
    mp_branches_dict_neg={},  mp_branches_dict_pos ={}, lp_branches_dict_neg={}, lp_branches_dict_pos = {}; 
    kz_branches_dict_neg={},  kz_branches_dict_pos ={}, fs_branches_dict_neg={}, fs_branches_dict_pos = {}; 
    ec_branches_dict_neg={},  ec_branches_dict_pos ={};
    var sent_count =0;
  	for (var i = 0; i < sentimentByBranchByHours.length; i++) {
    	supplierkey = serviceBySuppliers[i].key;
        provinceslist = sentimentByBranchByHours[i].values;
       
        for (var j = 0; j < provinceslist.length; j++) {
    		province = provinceslist[j].key;
        	branchlist = provinceslist[j].values;
       
        	if (province == "GP"){     		
	        	for (var k = 0; k < branchlist.length; k++) {
	        		branch = branchlist[k].key;
	        		sentimentlist = branchlist[k].values;
	        		for (var s = 0; s < sentimentlist.length; s++) {
	        			sentiment = sentimentlist[s].key;
	        			sent_count = sentimentlist[s].values;
	        			
	        			   if (branch in gp_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	gp_branches_dict_pos[branch] += sent_count;
						        }
						    }
						    
						    else if (branch in gp_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	gp_branches_dict_neg[branch] += sent_count;
						        }
						     }
						    else if(sentiment == "positive" && (!(branch in gp_branches_dict_neg))){
						            gp_branches_dict_pos[branch] = sent_count;
						            gp_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {gp_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in gp_branches_dict_pos))){
						            gp_branches_dict_neg[branch] = sent_count;
						            gp_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {gp_branches_dict_neg[branch] = sent_count;} 
				    }
				//total_gp[supplierkey] = gp_branches_dict_neg;
			 }
			}	            
			else if (province == "WC"){
				    for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			 if (branch in wc_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	wc_branches_dict_pos[branch] += sent_count;
						        }
						    }    
						    else if (branch in lp_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	wc_branches_dict_neg[branch] += sent_count;
						        }
						     }
						    
						    else if(sentiment == "positive" && (!(branch in wc_branches_dict_neg))){
						            wc_branches_dict_pos[branch] = sent_count;
						            wc_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {wc_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in wc_branches_dict_pos))){
						            wc_branches_dict_neg[branch] = sent_count;
						            wc_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {wc_branches_dict_neg[branch] = sent_count;} 	
						    
						 }
						        	
					}
			        	
			  }
			  else if (province == "FS"){
				       for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			if (branch in fs_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	fs_branches_dict_pos[branch] += sent_count;
						        }
						    }
						       
						    else if (branch in fs_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	fs_branches_dict_neg[branch] += sent_count;
						        }
						     }
						   else if(sentiment == "positive" && (!(branch in fs_branches_dict_neg))){
						            fs_branches_dict_pos[branch] = sent_count;
						            fs_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {fs_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in fs_branches_dict_pos))){
						            fs_branches_dict_neg[branch] = sent_count;
						            fs_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {fs_branches_dict_neg[branch] = sent_count;} 	
						   
				        }
					}
			   }
			   else if (province == "NC"){
			         for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			 if (branch in nc_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	nc_branches_dict_pos[branch] += sent_count;
						        }
						     }
						      
						    else if (branch in nc_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	nc_branches_dict_neg[branch] += sent_count;
						        }
						     }
						   else if(sentiment == "positive" && (!(branch in nc_branches_dict_neg))){
						            nc_branches_dict_pos[branch] = sent_count;
						            nc_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {nc_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in nc_branches_dict_pos))){
						            nc_branches_dict_neg[branch] = sent_count;
						            nc_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {nc_branches_dict_neg[branch] = sent_count;} 	 
						    
						}
			        }
			    }
			   else if (province == "ES"){
			        for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			 if (branch in ec_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	ec_branches_dict_pos[branch] += sent_count;
						        }
						       }
						      
						    else if (branch in ec_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	ec_branches_dict_neg[branch] += sent_count;
						        }
						     }
						    
						    else if(sentiment == "positive" && (!(branch in ec_branches_dict_neg))){
						            ec_branches_dict_pos[branch] = sent_count;
						            ec_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {ec_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in ec_branches_dict_pos))){
						            ec_branches_dict_neg[branch] = sent_count;
						            ec_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {ec_branches_dict_neg[branch] = sent_count;} 	
		        		
					    }
			        }
			    }
			    else if (province == "NW"){
			       for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			 if (branch in nw_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	nw_branches_dict_pos[branch] += sent_count;
						        }
						       }
						    
						    else if (branch in nw_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	nw_branches_dict_neg[branch] += sent_count;
						        }
						     }
						    
						    else if(sentiment == "positive" && (!(branch in nw_branches_dict_neg))){
						            nw_branches_dict_pos[branch] = sent_count;
						            nw_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {nw_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in nw_branches_dict_pos))){
						            nw_branches_dict_neg[branch] = sent_count;
						            nw_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {nw_branches_dict_neg[branch] = sent_count;} 	
					     
					     }
				   }
			    }    	
			    else if (province == "KZ"){
			        for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			 if (branch in kz_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	kz_branches_dict_pos[branch] += sent_count;
						        }
						       }
						      
						    else if (branch in kz_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	kz_branches_dict_neg[branch] += sent_count;
						        }
						     }
						    
						    else if(sentiment == "positive" && (!(branch in kz_branches_dict_neg))){
						            kz_branches_dict_pos[branch] = sent_count;
						            kz_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {kz_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in kz_branches_dict_pos))){
						            kz_branches_dict_neg[branch] = sent_count;
						            kz_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {kz_branches_dict_neg[branch] = sent_count;} 	
					    }
				   }
			    }
			    else if (province == "MP"){
			        for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
		        			 if (branch in mp_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	mp_branches_dict_pos[branch] += sent_count;
						        }
						       }
						       
						    else if (branch in mp_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	mp_branches_dict_neg[branch] += sent_count;
						        }
						     }
						   else if(sentiment == "positive" && (!(branch in mp_branches_dict_neg))){
						            mp_branches_dict_pos[branch] = sent_count;
						            mp_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {mp_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in mp_branches_dict_pos))){
						            mp_branches_dict_neg[branch] = sent_count;
						            mp_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {mp_branches_dict_neg[branch] = sent_count;} 	
					    }
			        }
			     }
			     else if (province == "LP"){
			        for (var k = 0; k < branchlist.length; k++) {
		        		branch = branchlist[k].key;
		        		sentimentlist = branchlist[k].values;
		        		for (var s = 0; s < sentimentlist.length; s++) {
		        			sentiment = sentimentlist[s].key;
		        			sent_count = sentimentlist[s].values;
		        			
						   if (branch in lp_branches_dict_pos){	        			 	
						        if (sentiment == "positive"){
						        	lp_branches_dict_pos[branch] += sent_count;
						        }
						       }
						     
						    else if (branch in lp_branches_dict_neg){	        			 	
						        if (sentiment == "negative"){
						        	lp_branches_dict_neg[branch] += sent_count;
						        }
						     }
						    else if(sentiment == "positive" && (!(branch in lp_branches_dict_neg))){
						            lp_branches_dict_pos[branch] = sent_count;
						            lp_branches_dict_neg[branch] = 0;
						    }
						    else if(sentiment == "positive") {lp_branches_dict_pos[branch] = sent_count;}   
						    
						    else if(sentiment == "negative" && (!(branch in lp_branches_dict_pos))){
						            lp_branches_dict_neg[branch] = sent_count;
						            lp_branches_dict_pos[branch] = 0;
						    }
						    else if(sentiment == "negative") {lp_branches_dict_neg[branch] = sent_count;} 					      						       					      
					    }						
			         } 	
	            }             
  	       }
      }
    
    gp_branches_dict_pos = sortObject(gp_branches_dict_pos);
    gp_branches_dict_neg = sortObject(gp_branches_dict_neg);
    
    nw_branches_dict_pos = sortObject(nw_branches_dict_pos); 
    nw_branches_dict_neg = sortObject(nw_branches_dict_neg);
    
    nc_branches_dict_pos = sortObject(nc_branches_dict_pos);  
    nc_branches_dict_neg = sortObject(nc_branches_dict_neg);
     
    wc_branches_dict_pos = sortObject(wc_branches_dict_pos);
    wc_branches_dict_neg = sortObject(wc_branches_dict_neg);
    
    mp_branches_dict_pos = sortObject(mp_branches_dict_pos);
    mp_branches_dict_neg = sortObject(mp_branches_dict_neg);
    
    lp_branches_dict_pos = sortObject(lp_branches_dict_pos);   
    lp_branches_dict_neg = sortObject(lp_branches_dict_neg); 
    
    kz_branches_dict_pos = sortObject(kz_branches_dict_pos); 
    kz_branches_dict_neg = sortObject(kz_branches_dict_neg);  
    
    fs_branches_dict_pos = sortObject(fs_branches_dict_pos); 
    fs_branches_dict_neg = sortObject(fs_branches_dict_neg); 
    
    ec_branches_dict_pos = sortObject(ec_branches_dict_pos);
    ec_branches_dict_neg = sortObject(ec_branches_dict_neg);  
    
    //sortedKeys: Object.keys(dictSorted),
   //  dictData: dictSorted
  //console.log(gp_branches_dict_pos.sortedKeys);
  //console.log(kz_branches_dict_neg);	
  }
  
  //Create a dictionary and count word occurrence
function groupWordCounts(wordcountdict,wordfreq){
 	for (var i=0; i< wordfreq.length; i++){
 		if (wordfreq[i][0] in wordcountdict) {
 			wordcountdict[wordfreq[i][0]] += wordfreq[i][1];
 		}
 		else{wordcountdict[wordfreq[i][0]] = wordfreq[i][1];}
 	}
 	return wordcountdict;	
 } 
 
//function for computing the word frequency for each branch in each province
function wordCloudByBranches(){
  	
  	var cloud_provinceslist,cloud_province,cloud_sentimentlist,cloud_branch,sentiment,cloud_branchlist;
  	
  	gp_branches_pos_words_dict= {}, gp_branches_neg_words_dict = {} , nw_branches_pos_words_dict = {} , nw_branches_neg_words_dict = {};
	nc_branches_pos_words_dict = {},  nc_branches_neg_words_dict = {} , wc_branches_pos_words_dict = {} , wc_branches_neg_words_dict = {};
	mp_branches_neg_words_dict = {},  mp_branches_pos_words_dict = {} , lp_branches_neg_words_dict = {}, lp_branches_pos_words_dict = {}; 
	kz_branches_neg_words_dict = {},  kz_branches_pos_words_dict = {} , fs_branches_neg_words_dict = {}, fs_branches_pos_words_dict = {}; 
	ec_branches_neg_words_dict = {},  ec_branches_pos_words_dict = {};
 
  	for (var i = 0; i < commentsNestByBranches.length; i++) {
    	supplierkey = commentsNestByBranches[i].key;
        cloud_provinceslist = commentsNestByBranches[i].values;
       
        for (var j = 0; j < cloud_provinceslist.length; j++) {
    		cloud_province = cloud_provinceslist[j].key;
        	cloud_branchlist = cloud_provinceslist[j].values;
       
        	if (cloud_province == "GP"){     		
	        	for (var k = 0; k < cloud_branchlist.length; k++) {
	        		var word_pos_list = {};
	        		var word_neg_list = {};
	        		branch = cloud_branchlist[k].key;
	        		cloud_sentimentlist = cloud_branchlist[k].values;
	        		
	        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
	        			sentiment = cloud_sentimentlist[s].key;
	        			var sentimentgrouped = cloud_sentimentlist[s].values;
	        			
	        			
	        			for (var jj=0; jj < sentimentgrouped.length; jj++){
	   	        			 	
						    if (sentiment == "positive"){
						        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
						        	}
						    else if (sentiment == "negative"){
						        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
						        	}
						 }
						if (sentiment == "positive"){
				    		gp_branches_pos_words_dict[branch] = word_pos_list;
				    		}
				  	
					   if (sentiment == "negative"){
					    	gp_branches_neg_words_dict[branch] = word_neg_list;
							
							}     
				    }
				   // if(gp_branches_pos_words_dict[branch] != null){console.log(gp_branches_pos_words_dict[branch]);}
				    //if(gp_branches_neg_words_dict[branch] != null){console.log(gp_branches_neg_words_dict[branch]);}				  
			 	}
			}	            
			else if (cloud_province == "WC"){
				for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
	
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		wc_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	wc_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(wc_branches_pos_words_dict[branch] != null){console.log(wc_branches_pos_words_dict[branch]);}
					    //if(gp_branches_neg_words_dict[branch] != null){console.log(gp_branches_neg_words_dict[branch]);}				  
				 	}
			        	
			  }
			  else if (cloud_province == "FS"){
				for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
	
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		fs_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	fs_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(fs_branches_pos_words_dict[branch] != null){console.log(fs_branches_pos_words_dict[branch]);}
					    //if(fs_branches_neg_words_dict[branch] != null){console.log(fs_branches_neg_words_dict[branch]);}				  
				 	}       
			  }
			  else if (cloud_province == "NC"){
			    for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
	
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		nc_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	nc_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(nc_branches_pos_words_dict[branch] != null){console.log(nc_branches_pos_words_dict[branch]);}
					    //if(nc_branches_neg_words_dict[branch] != null){console.log(nc_branches_neg_words_dict[branch]);}				  
				 	}     
			  }
			  else if (cloud_province == "ES"){
			    for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;

		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		ec_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	ec_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(ec_branches_pos_words_dict[branch] != null){console.log(ec_branches_pos_words_dict[branch]);}
					    //if(ec_branches_neg_words_dict[branch] != null){console.log(ec_branches_neg_words_dict[branch]);}				  
				 	}    
			  }
			  else if (cloud_province == "NW"){
			     for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
	
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		nw_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	nw_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(nw_branches_pos_words_dict[branch] != null){console.log(nw_branches_pos_words_dict[branch]);}
					    //if(nw_branches_neg_words_dict[branch] != null){console.log(nw_branches_neg_words_dict[branch]);}				  
				 	}  
			  }    	
			  else if (cloud_province == "KZ"){
			     for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
	
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		kz_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	kz_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(kz_branches_pos_words_dict[branch] != null){console.log(kz_branches_pos_words_dict[branch]);}
					    //if(kz_branches_neg_words_dict[branch] != null){console.log(kz_branches_neg_words_dict[branch]);}				  
				 	}   
			  }
			  else if (cloud_province == "MP"){
			    for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
	
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		mp_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	mp_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(mp_branches_pos_words_dict[branch] != null){console.log(mp_branches_pos_words_dict[branch]);}
					    //if(mp_branches_neg_words_dict[branch] != null){console.log(mp_branches_neg_words_dict[branch]);}				  
				 	}    
			  }
			  else if (cloud_province == "LP"){
			    for (var k = 0; k < cloud_branchlist.length; k++) {
		        		var word_pos_list = {};
		        		var word_neg_list = {};
		        		branch = cloud_branchlist[k].key;
		        		cloud_sentimentlist = cloud_branchlist[k].values;
		        		for (var s = 0; s < cloud_sentimentlist.length; s++) {
		        			sentiment = cloud_sentimentlist[s].key;
		        			var sentimentgrouped = cloud_sentimentlist[s].values;
		        			
		        			
		        			for (var jj=0; jj < sentimentgrouped.length; jj++){
		   	        			 	
							    if (sentiment == "positive"){
							        	word_pos_list = groupWordCounts(word_pos_list,sentimentgrouped[jj].comment_wordFreq);
							        	
							        	}
							    else if (sentiment == "negative"){
							        	word_neg_list = groupWordCounts(word_neg_list,sentimentgrouped[jj].comment_wordFreq);
							        	}
							 }
							if (sentiment == "positive"){
					    		lp_branches_pos_words_dict[branch] = word_pos_list;
					    		}
					  	
						   if (sentiment == "negative"){
						    	lp_branches_neg_words_dict[branch] = word_neg_list;
								
								}     
					    }
					    //if(lp_branches_pos_words_dict[branch] != null){console.log(lp_branches_pos_words_dict[branch]);}
					    //if(lp_branches_neg_words_dict[branch] != null){console.log(lp_branches_neg_words_dict[branch]);}				  
				 	}    
	        }             
  	    }
      }
  }


function drawSentimentChart() {

		      var  data = new google.visualization.arrayToDataTable([
		          ['Province', 'Positive', 'Negative'],
		          ['Gauteng',  gp_pos_sentcount,      gp_neg_sentcount],
		          ['Western Cape',  wc_pos_sentcount,      wc_neg_sentcount],
		          ['Eastern Cape',  ec_pos_sentcount,      ec_neg_sentcount],
		          ['Northen Cape', nc_pos_sentcount,       nc_neg_sentcount],
		          ['Free State',  fs_pos_sentcount,      fs_neg_sentcount],
		          ['Limpopo',  lp_pos_sentcount,      lp_neg_sentcount],
		          ['KwaZulu-Natal',  kzn_pos_sentcount,     kzn_neg_sentcount],
		          ['Mpumalanga',  mp_pos_sentcount,       mp_neg_sentcount],
		          ['North West',  nw_pos_sentcount,      nw_neg_sentcount],
		        ]);
		        
		        
		       var options = {
		          title:'Sentiment By Province',
		          //title: 'Service Sentiment',
		          //vAxis: {title: 'Province',  titleTextStyle: {color: 'red'}},
		          //vAxis: {title: 'Province',  titleTextStyle: {color: 'steelblue'}},
		          vAxis:{ textStyle:{color: "black"}},
		          hAxis: { gridlines: {color: "steelblue"},
    						baselineColor: "steelblue",
    						textStyle:{color: "black"}
						 },
		          series: [{color: '#2ca02c', visibleInLegend: true}, 
           				   {color: '#d62728', visibleInLegend:true}
           				  ],
           		  legendTextStyle: {color:"black"},
           		  backgroundColor: '#1BBC9B',  
		        };
		        chart_sentiment = new google.visualization.BarChart(document.getElementById('province-sentiment'));
		        chart_sentiment.draw(data, options);
		        
		        // chart_sentiment_neg = new google.visualization.BarChart(document.getElementById('province-sentiment'));
		        // chart_sentiment_neg.draw(data, options);
		        
			  function selectHandler() {
		          var selectedItem = chart_sentiment.getSelection()[0];
		          	if (selectedItem) {
		            		provinceSelected = data.getValue(selectedItem.row, 0);
		            		alert('The user selected ' + province);
		          	}
		      }
		      //console.log(sortObject(gp_branches_dict_neg));
		      //console.log(sortObject(gp_branches_dict_pos));
		      google.visualization.events.addListener(chart_sentiment, 'select', selectHandler); 
		      //google.visualization.events.addListener( chart_sentiment, 'select', function() {selectHandler;} ); 
		       	        
}

  //Create a dictionary and count word occurrence
function cloudWordCounts(wordcountdict,wordfreq){
 	for (var key in wordfreq){
 		if (wordcountdict[key] != null) {
 			wordcountdict[key] += wordfreq[key];
 		}
 		else{wordcountdict[key] = wordfreq[key];}
 	}
 	return wordcountdict;	
 } 


function word2DArray(worddict) {
  wordlist_lists =[];
   for (var key in worddict) {
    wordlist_lists.push([key,worddict[key]]);
  }
  return wordlist_lists;
}

function placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, branches_dict_pos, branches_pos_words_dict, branches_dict_neg, branches_neg_words_dict)
{
	var temp_limit = 0;
    var prov_pos_words = [];
    var prov_neg_words = [];
    
    prov_branches_dict_pos = branches_dict_pos;
    prov_branches_pos_words_dict = branches_pos_words_dict;
    prov_branches_dict_neg = branches_dict_neg;
    prov_branches_neg_words_dict = branches_neg_words_dict;
    
    //console.log("in positive sentiments");
   

  
	provinceSelected = "GP";
	if (provinceSelected == "GP"){
   	    var datapos = new google.visualization.DataTable();
	  	datapos.addColumn('string', 'Branch');
	  	datapos.addColumn('number', 'positive');
   		var keypos = prov_branches_dict_pos.sortedKeys;
   		for (var i=0;i<keypos.length;i++){
   			datapos.addRow([keypos[i], prov_branches_dict_pos.dictData[keypos[i]]]);
   			prov_pos_words = cloudWordCounts(prov_pos_words,prov_branches_pos_words_dict[keypos[i]]);
   		}
   		var prov_pos_words_list = word2DArray(prov_pos_words);
   		cloudPlot(prov_pos_words_list, pos_cloud);
   		//cloudPlotByBranches(prov_pos_words_list, pos_cloud);
   		
   		 var options = {
		          titlePosition: 'none',
		          vAxis:{ textStyle:{color: "steelblue"}},
		          hAxis: { gridlines: {color: "steelblue"},
    						baselineColor: "steelblue",
    						textStyle:{color: "steelblue"}
						 },
		          series: [{color: '#2ca02c', visibleInLegend: true} 
           				   //{color: '#d62728', visibleInLegend:true}
           				  ],
           		  legendTextStyle: {color:"steelblue"},
           		  // backgroundColor: '#1BBC9B',
           		  gridSize : Math.round(16 * document.getElementById(pos_plot).offsetWidth / 1024 )
		        };
		        chart_sentiment = new google.visualization.BarChart(document.getElementById(pos_plot));
		        chart_sentiment.draw(datapos, options);

   		var dataneg = new google.visualization.DataTable();
	  	dataneg.addColumn('string', 'Branch');
	  	dataneg.addColumn('number', 'negative');
   		var keyneg = prov_branches_dict_neg.sortedKeys;
   		for (var j=0;j<keyneg.length;j++){
   			dataneg.addRow([keyneg[j], prov_branches_dict_neg.dictData[keyneg[j]]]);
   			prov_neg_words = cloudWordCounts(prov_neg_words,prov_branches_neg_words_dict[keyneg[j]]);	
   		}
   		
   		var prov_neg_words_list = word2DArray(prov_neg_words);
   		//console.log(gp_neg_words_list);
   		cloudPlot(prov_neg_words_list,neg_cloud);
   		//cloudPlotByBranches(prov_neg_words_list,neg_cloud);
   		
   		 var options = {
		          titlePosition: 'none',
		          vAxis:{ textStyle:{color: "steelblue"}},
		          hAxis: { gridlines: {color: "steelblue"},
    						baselineColor: "steelblue",
    						textStyle:{color: "steelblue"}
						 },
		          series: [{color: '#d62728', visibleInLegend: true} 
           				  ],
           		  legendTextStyle: {color:"steelblue"},
           		  // backgroundColor: '#1BBC9B',
           		  gridSize : Math.round(16 * document.getElementById(pos_plot).offsetWidth / 1024 )
		        };
		        chart_sentiment_neg = new google.visualization.BarChart(document.getElementById(neg_plot));
		        chart_sentiment_neg.draw(dataneg, options);
   	 }	//end if statement
   		       
			  function selectHandler() {
		          var selectedItem = chart_sentiment.getSelection()[0];
		          	if (selectedItem) {
		            		var province = data.getValue(selectedItem.row, 0);
		            		alert('The user selected ' + province);
		            		//console.log('This is the lucky province ' + province);
		          	}
		      }
		
		      google.visualization.events.addListener(chart_sentiment, 'select', selectHandler);
		     	      
		      //google.visualization.events.addListener( chart, 'select', function() {selectHandler();} );  

}


function drawBranchSentimentChart(val,loc) {
   
    var pos_plot = "";
    var pos_cloud = "";
   	var neg_plot = "";
    var neg_cloud = "";
    
    if(loc == 101)
    {
    	pos_plot = "sentiment_div";
    	pos_cloud = "canvas_cloud";
    	neg_plot = "sentiment_div2";
    	neg_cloud = "canvas_cloud2";
    	
    	if( val == 1 ) 
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
		}
		
		else if( val == 2 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
		}
		
		else if( val == 3 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
		}
		
		else if( val == 4 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
		}
		
		else if( val == 5 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
		}
		
		else if( val == 6 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
		}
		
		else if( val == 7 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
		}

		else if( val == 8 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
		}
		
		
		else if( val == 9 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
		}
	
    }
	
	
	
	if(loc == 102)
    {
    	pos_plot = "sentiment_divKZ";
    	pos_cloud = "canvas_cloudKZ";
    	neg_plot = "sentiment_div2KZ";
    	neg_cloud = "canvas_cloud2KZ";
    	
    	if( val == 1 ) 
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
		}
		
		else if( val == 2 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
		}
		
		else if( val == 3 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
		}
		
		else if( val == 4 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
		}
		
		else if( val == 5 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
		}
		
		else if( val == 6 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
		}
		
		else if( val == 7 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
		}

		else if( val == 8 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
		}
		
		
		else if( val == 9 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
		}
	
    }
    
    
    if(loc == 103)
    {
    	pos_plot = "sentiment_divEC";
    	pos_cloud = "canvas_cloudEC";
    	neg_plot = "sentiment_div2EC";
    	neg_cloud = "canvas_cloud2EC";
    	
    	if( val == 1 ) 
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
		}
		
		else if( val == 2 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
		}
		
		else if( val == 3 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
		}
		
		else if( val == 4 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
		}
		
		else if( val == 5 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
		}
		
		else if( val == 6 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
		}
		
		else if( val == 7 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
		}

		else if( val == 8 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
		}
		
		
		else if( val == 9 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
		}
	
    }
    
    
    if(loc == 104)
    {
    	pos_plot = "sentiment_divCT";
    	pos_cloud = "canvas_cloudCT";
    	neg_plot = "sentiment_div2CT";
    	neg_cloud = "canvas_cloud2CT";
    	
    	if( val == 1 ) 
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
		}
		
		else if( val == 2 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
		}
		
		else if( val == 3 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
		}
		
		else if( val == 4 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
		}
		
		else if( val == 5 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
		}
		
		else if( val == 6 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
		}
		
		else if( val == 7 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
		}

		else if( val == 8 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
		}
		
		
		else if( val == 9 )
		{
			placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
		}
	
    }
			       	        
}   

// Load the latest version of the Google Data JavaScript Client
google.load("visualization", "1.x", {packages:["corechart"]});
google.setOnLoadCallback(drawSentimentChart());
//google.setOnLoadCallback(drawPie3dChart());

function cloudPlot(wordlist,canvas_id){
	//var surr_div = document.getElementById("sourrounding_div");
	var canvas = document.getElementById(canvas_id);
	//canvas.height = surr_div.offsetHeight + 100;
	//canvas.width = surr_div.offsetWidth + 100;
		
	var div_factor = 1024;

	var options = {
		list : wordlist,
		// backgroundColor: '#1BBC9B',
		gridSize : Math.round(16 * document.getElementById(canvas_id).offsetWidth / 1024 ),
		weightFactor : function(size) {
			//return Math.pow(size, 3) * document.getElementById(canvas_id).offsetWidth / 1024;
			if(wordlist.length < 1 )
			{
				div_factor = 1024;
			}
			
			else
			{
				div_factor = (wordlist.length * 2.5);
			}
			return Math.pow(size, 3) * document.getElementById(canvas_id).offsetWidth / div_factor;
		}
	}; 
	//console.log(wordfreq);
	//console.log(options.list);
	WordCloud(document.getElementById(canvas_id), options);
	//WordCloud(document.getElementById('canvas_cloud'), { list: wordlist } );
}
function cloudPlot2(wordlist){
	
  d3.layout.cloud().size([800, 300])
      .words([
        ".NET", "Silverlight", "jQuery", "CSS3", "HTML5", "JavaScript", "SQL","C#"].map(function(d) {
        return {text: d, size: 10 + Math.random() * 50};
      }))
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      //.text(function(d) { return d.text; })
      .fontSize(function(d) { return d.size; })
      .on("end", draw)
      .start();
}

function draw(words) {
	//console.log(words);
	var fill = d3.scale.category20();
    d3.selectAll("body").append("svg")
        .attr("width", 850)
        .attr("height", 350)
      .append("g")
      .attr("transform", "translate(150,150)")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
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
      //var width = time_width;
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
              .call(axis)
              .attr("style","font-weight:bold; fill:#004769"); // change x-axis font-size and color
    
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
  


 function updateChartGP(val,loc)
 {
 	chart.each(render);
    servicelist.each(render);
    //console.log('in update charts');

 	drawBranchSentimentChart(val,loc);
 }
 

function updatingTheSentiments(prov1,prov2,prov3,prov4)
{
	//console.log("in that thing here");
	
	if( prov1 == 1 )
	{ 
		updateChartGP(1,101);
		//document.addEventListener('DOMContentLoaded', function() {updateChartGP(1,101)}, false);
	//updateChartEC();			
	}
	
	
	if( prov2 == 1 )
	{   
		updateChartGP(1,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 1 )
	{ 
		updateChartGP(1,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 1 )
	{ 
		updateChartGP(1,104);			
	}
	
	//**********************************************2************************************************************
	if( prov1 == 2 )
	{ 
		updateChartGP(2,101);		
	}
	
	
	if( prov2 == 2 )
	{ 
		updateChartGP(2,102);
		
	}
	
	
	if( prov3 == 2 )
	{ 
		updateChartGP(2,103);
			
	}
	
	
	if( prov4 == 2 )
	{ 
		updateChartGP(2,104);
	//updateChartEC();			
	}
	
	//***************************************3*******************************************************************
	
	if( prov1 == 3 )
	{ 
		updateChartGP(3,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 3 )
	{ 
		updateChartGP(3,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 3 )
	{ 
		updateChartGP(3,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 3 )
	{ 
		updateChartGP(3,104);
	//updateChartEC();			
	}
	
	//*****************************************4*****************************************************************
	if( prov1 == 4 )
	{ 
		updateChartGP(4,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 4 )
	{ 
		updateChartGP(4,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 4 )
	{ 
		updateChartGP(4,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 4 )
	{ 
		updateChartGP(4,104);
	//updateChartEC();			
	}
	
	//**********************************************5************************************************************
	
	if( prov1 == 5 )
	{ 
		updateChartGP(5,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 5 )
	{ 
		updateChartGP(5,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 5 )
	{ 
		updateChartGP(5,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 5 )
	{ 
		updateChartGP(5,104);
	//updateChartEC();			
	}
	
	//**********************************************6************************************************************
	if( prov1 == 6 )
	{ 
		updateChartGP(6,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 6 )
	{ 
		updateChartGP(6,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 6 )
	{ 
		updateChartGP(6,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 6 )
	{ 
		updateChartGP(6,104);
	//updateChartEC();			
	}
	
	//**********************************************7************************************************************
	
	if( prov1 == 7 )
	{ 
		updateChartGP(7,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 7 )
	{ 
		updateChartGP(7,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 7 )
	{ 
		updateChartGP(7,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 7 )
	{ 
		updateChartGP(7,104);
	//updateChartEC();			
	}
	
	//******************************************8****************************************************************
	if( prov1 == 8 )
	{ 
		updateChartGP(8,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 8 )
	{ 
		updateChartGP(8,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 8 )
	{ 
		updateChartGP(8,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 8 )
	{ 
		updateChartGP(8,104);
	//updateChartEC();			
	}
	
	//*********************************9*************************************************************************
	
	if( prov1 == 9 )
	{ 
		updateChartGP(9,101);
	//updateChartEC();			
	}
	
	
	if( prov2 == 9 )
	{ 
		updateChartGP(9,102);
	//updateChartEC();			
	}
	
	
	if( prov3 == 9 )
	{ 
		updateChartGP(9,103);
	//updateChartEC();			
	}
	
	
	if( prov4 == 9 )
	{ 
		updateChartGP(9,104);
	//updateChartEC();			
	}
}

function placeProvinceInList(chosen_prov)
{
	choose_province_list.push(chosen_prov);
	//console.log(chosen_prov);
}

function updateChartGPLinks(val,loc,num_of_graphs)
{
 	chart.each(render);
    servicelist.each(render);
	drawBranchSentimentChartLinks(val,loc,num_of_graphs);
}

function clearTheList()
{
	//console.log("clearing the list");
	choose_province_list = [];
	// var pos_plot = "";
		    // var pos_cloud = "";
		   	// var neg_plot = "";
		    // var neg_cloud = "";
	// placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
}

function clearBox(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}


function updatingTheSentimentsLinks()
{
	number_to_display = choose_province_list.length;
	
	//console.log("in here");
	
	//console.log(number_to_display);
	
	// $("#sentiment_divOneGraph").html("");
	// $("#canvas_cloudOneGraph").html("");
	// $("#canvas_cloud2OneGraph").html("");
	// $("#sentiment_div2OneGraph").html("");
	
	
	if (number_to_display == 1 )
	{
		updateChartGPLinks(choose_province_list[0],101,number_to_display);
	}

		
	if (number_to_display == 2 )
	{
		updateChartGPLinks(choose_province_list[0],101,number_to_display);
		updateChartGPLinks(choose_province_list[1],102,number_to_display);
	}
	
	if (number_to_display == 3 )
	{
		updateChartGPLinks(choose_province_list[0],101,number_to_display);
		updateChartGPLinks(choose_province_list[1],102,number_to_display);
		updateChartGPLinks(choose_province_list[2],103,number_to_display);
	}
	
	if (number_to_display == 4 )
	{
		var prov1 = choose_province_list[0];
		var prov2 = choose_province_list[1];
		var prov3 = choose_province_list[2];
		var prov4 = choose_province_list[3];
		
		updatingTheSentiments(prov1, prov2, prov3, prov4);
		
		// document.addEventListener('DOMContentLoaded', function() {updateChartGPLinks(choose_province_list[0],101,number_to_display)}, false);
		// document.addEventListener('DOMContentLoaded', function() {updateChartGPLinks(choose_province_list[1],102,number_to_display)}, false);
		// document.addEventListener('DOMContentLoaded', function() {updateChartGPLinks(choose_province_list[2],103,number_to_display)}, false);
		// document.addEventListener('DOMContentLoaded', function() {updateChartGPLinks(choose_province_list[3],104,number_to_display)}, false);
	}
	
	//choose_province_list = [];
			
}

function drawBranchSentimentChartLinks(val,loc,num_of_graphs) {
   
    if( num_of_graphs == 1 )
    {
    		var pos_plot = "";
		    var pos_cloud = "";
		   	var neg_plot = "";
		    var neg_cloud = "";
		    
		    pos_plot = "sentiment_divOneGraph";
	    	pos_cloud = "canvas_cloudOneGraph";
	    	neg_plot = "sentiment_div2OneGraph";
	    	neg_cloud = "canvas_cloud2OneGraph";
	    	
	    	
	    	if( val == 1 ) 
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
			}
			
			else if( val == 2 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
			}
			
			else if( val == 3 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
			}
			
			else if( val == 4 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
			}
			
			else if( val == 5 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
			}
			
			else if( val == 6 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
			}
			
			else if( val == 7 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
			}
	
			else if( val == 8 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
			}
			
			
			else if( val == 9 )
			{
				placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
			}
		    
    }
    
    
    if( num_of_graphs ==  2)
    {
    		var pos_plot = "";
		    var pos_cloud = "";
		   	var neg_plot = "";
		    var neg_cloud = "";
	
	    	
	    	if (loc == 101 )
	    	{
	    		
	    			    	pos_plot = "sentiment_divTwoGraphs";
					pos_cloud = "canvas_cloudTwoGraphs";
					neg_plot = "sentiment_div2TwoGraphs";
					neg_cloud = "canvas_cloud2TwoGraphs";
	    		if( val == 1 ) 
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
				}
			
				else if( val == 2 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
				}
				
				else if( val == 3 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
				}
				
				else if( val == 4 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
				}
				
				else if( val == 5 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
				}
				
				else if( val == 6 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
				}
				
				else if( val == 7 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
				}
		
				else if( val == 8 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
				}
				
				
				else if( val == 9 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
				}
	    	}
	    	
	    	if( loc == 102 )
	    	{
	    		
	    			pos_plot = "sentiment_divBTwoGraphs";
			pos_cloud = "canvas_cloudBTwoGraphs";						
			neg_plot = "sentiment_div2BTwoGraphs";
			neg_cloud = "canvas_cloud2BTwoGraphs";
	    		if( val == 1 ) 
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
				}
			
				else if( val == 2 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
				}
				
				else if( val == 3 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
				}
				
				else if( val == 4 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
				}
				
				else if( val == 5 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
				}
				
				else if( val == 6 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
				}
				
				else if( val == 7 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
				}
		
				else if( val == 8 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
				}
				
				
				else if( val == 9 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
				}
	    	}
    
    }
    
    if( num_of_graphs == 4 )
    {
    	
		    	//dictData: dictSorted
		    var pos_plot = "";
		    var pos_cloud = "";
		   	var neg_plot = "";
		    var neg_cloud = "";
		    
		    if(loc == 101)
		    {
		    	pos_plot = "sentiment_div";
		    	pos_cloud = "canvas_cloud";
		    	neg_plot = "sentiment_div2";
		    	neg_cloud = "canvas_cloud2";
		    	
		    	if( val == 1 ) 
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
				}
				
				else if( val == 2 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
				}
				
				else if( val == 3 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
				}
				
				else if( val == 4 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
				}
				
				else if( val == 5 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
				}
				
				else if( val == 6 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
				}
				
				else if( val == 7 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
				}
		
				else if( val == 8 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
				}
				
				
				else if( val == 9 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
				}
			
		    }
			
			
			
			if(loc == 102)
		    {
		    	pos_plot = "sentiment_divKZ";
		    	pos_cloud = "canvas_cloudKZ";
		    	neg_plot = "sentiment_div2KZ";
		    	neg_cloud = "canvas_cloud2KZ";
		    	
		    	if( val == 1 ) 
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
				}
				
				else if( val == 2 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
				}
				
				else if( val == 3 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
				}
				
				else if( val == 4 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
				}
				
				else if( val == 5 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
				}
				
				else if( val == 6 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
				}
				
				else if( val == 7 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
				}
		
				else if( val == 8 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
				}
				
				
				else if( val == 9 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
				}
			
		    }
		    
		    
		    if(loc == 103)
		    {
		    	pos_plot = "sentiment_divEC";
		    	pos_cloud = "canvas_cloudEC";
		    	neg_plot = "sentiment_div2EC";
		    	neg_cloud = "canvas_cloud2EC";
		    	
		    	if( val == 1 ) 
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
				}
				
				else if( val == 2 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
				}
				
				else if( val == 3 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
				}
				
				else if( val == 4 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
				}
				
				else if( val == 5 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
				}
				
				else if( val == 6 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
				}
				
				else if( val == 7 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
				}
		
				else if( val == 8 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
				}
				
				
				else if( val == 9 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
				}
			
		    }
		    
		    
		    if(loc == 104)
		    {
		    	pos_plot = "sentiment_divCT";
		    	pos_cloud = "canvas_cloudCT";
		    	neg_plot = "sentiment_div2CT";
		    	neg_cloud = "canvas_cloud2CT";
		    	
		    	if( val == 1 ) 
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, gp_branches_dict_pos, gp_branches_pos_words_dict, gp_branches_dict_neg, gp_branches_neg_words_dict)
				}
				
				else if( val == 2 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, wc_branches_dict_pos, wc_branches_pos_words_dict, wc_branches_dict_neg, wc_branches_neg_words_dict)
				}
				
				else if( val == 3 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, ec_branches_dict_pos, ec_branches_pos_words_dict, ec_branches_dict_neg, ec_branches_neg_words_dict)
				}
				
				else if( val == 4 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nc_branches_dict_pos, nc_branches_pos_words_dict, nc_branches_dict_neg, nc_branches_neg_words_dict)
				}
				
				else if( val == 5 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, fs_branches_dict_pos, fs_branches_pos_words_dict, fs_branches_dict_neg, fs_branches_neg_words_dict)
				}
				
				else if( val == 6 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, kz_branches_dict_pos, kz_branches_pos_words_dict, kz_branches_dict_neg, kz_branches_neg_words_dict)
				}
				
				else if( val == 7 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, lp_branches_dict_pos, lp_branches_pos_words_dict, lp_branches_dict_neg, lp_branches_neg_words_dict)
				}
		
				else if( val == 8 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, mp_branches_dict_pos, mp_branches_pos_words_dict, mp_branches_dict_neg, mp_branches_neg_words_dict)
				}
				
				
				else if( val == 9 )
				{
					placeGraphInDiv(pos_plot, pos_cloud, neg_plot, neg_cloud, nw_branches_dict_pos, nw_branches_pos_words_dict, nw_branches_dict_neg, nw_branches_neg_words_dict)
				}
			
		    }
    	
    }
 		       	        
} 



function createPieChartProvData()
{
	
	province_arr = [ "Gauteng", "Western Cape", "Eastern Cape", "Northern Cape", "Free State", "KZN", "Limpopo", "Mpumalanga", "North West"];
	
	pos_sent_prov_arr = [gp_pos_sentcount,wc_pos_sentcount,ec_pos_sentcount,nc_pos_sentcount,fs_pos_sentcount,kzn_pos_sentcount,lp_pos_sentcount,mp_pos_sentcount,nw_pos_sentcount];
	neg_sent_prov_arr = [gp_neg_sentcount,wc_neg_sentcount,ec_neg_sentcount,nc_neg_sentcount,fs_neg_sentcount,kzn_neg_sentcount,lp_neg_sentcount,mp_neg_sentcount,nw_neg_sentcount];
	

	var pos_pie_data = [  	["province", "sent_count"],
					          ["Gauteng", gp_pos_sentcount],
					          ["Western Cape", wc_pos_sentcount],
					          ["Eastern Cape", ec_pos_sentcount],
					          ["Northern Cape",nc_pos_sentcount],
					          ["Free State",fs_pos_sentcount],
					          ["KZN", kzn_pos_sentcount],
					          ["Limpopo",lp_pos_sentcount],
					          ["Mpumalanga", mp_pos_sentcount],
					          ["North West",  nw_pos_sentcount]
					];
					
					
	var neg_pie_data = [  	["province", "sent_count"],
							[ "Gauteng", gp_neg_sentcount], 
							[ "Western Cape", wc_neg_sentcount],  
							[ "Eastern Cape", ec_neg_sentcount], 
							[ "Northern Cape", nc_neg_sentcount], 
							[ "Free State", fs_neg_sentcount], 
							[ "KZN",  kzn_neg_sentcount],  
							[ "Limpopo",  lp_neg_sentcount], 
							[ "Mpumalanga",  mp_neg_sentcount], 
							[ "North West",  nw_neg_sentcount]
					];
	
	//google.setOnLoadCallback(drawPie3dChart(pos_pie_data,"pos_pie_chrt","Positive Sentiment By Province"));	
	google.setOnLoadCallback(drawPie3dChart(neg_pie_data,"neg_pie_chrt", "Negative Sentiment By Province"));	

	
}


function createPieChartIndData()
{
	
	sentimentByIndustry();
	
	var pos_pie_data = [];
	var neg_pie_data = [];
	
	pos_pie_data.push(["industry", "sent_count"]);
	neg_pie_data.push(["industry", "sent_count"]);

	
	for( var k = 0; k < industry_arr.length; k++ )
	{
		curr_pos = [ industry_arr[k],  the_pos_sent_arr[k] ];
		curr_neg = [ industry_arr[k], the_neg_sent_arr[k] ];
		
		pos_pie_data.push(curr_pos);
		neg_pie_data.push(curr_neg);
	}
	

	google.setOnLoadCallback(drawPie3dChart(pos_pie_data,"pos_pie_chrt_ind","Positive Sentiment By Industry"));
	google.setOnLoadCallback(drawPie3dChart(neg_pie_data,"neg_pie_chrt_ind","Negative Sentiment By Industry"));	
}


// google.load("visualization", "1", {packages:["corechart"]});
// google.setOnLoadCallback(drawPie3dChart);
      function drawPie3dChart(data_arr,div_id,titular) {
        var data = google.visualization.arrayToDataTable(data_arr);

        var options = {
        	title: titular,
          is3D: true,
          backgroundColor: '#1BBC9B',
        };

        var chart = new google.visualization.PieChart(document.getElementById(div_id));
        chart.draw(data, options);
      }


							

