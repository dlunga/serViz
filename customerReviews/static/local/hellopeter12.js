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
var provinceSelected;


var chart_sentiment, data;

var date_width;
var time_width; 




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

  // dimension and group for looking up currently selected markers
  idDimension = services.dimension(function(p, i) { return i; });
  idGrouping = idDimension.group(function(id) { return id; });
  

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
  //console.log(serviceComments.length);

  for (var i = 0; i < serviceComments.length; i++) {
    var comment = serviceComments[i];
      markers[i] = new google.maps.Marker({
      'position': new google.maps.LatLng(comment.latitude, comment.longitude),
      map: map,
      title: 'marker ' + comment.consumer_comment,
      
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
  service_date = services.dimension(function(d) { return d.comment_datetime; }),
  service_dates = service_date.group(d3.time.day),
  service_hour = services.dimension(function(d) { return d.comment_datetime.getHours() + d.comment_datetime.getMinutes() / 60; }),
  service_hours = service_hour.group(Math.floor);
  
  serviceBySupplier = services.dimension(function(d){return d.supplier_name;});  
  
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
 
 //takes user input and updates all filters according to user query! re-renders all the views
 function handleSubmit(){
	var myArray;
	myArray = document.getElementById("supplierInput").value.toUpperCase().split(",");
	//console.log(myArray);
	
	if (myArray.length >= 1 && myArray[0].length > 1){	
			serviceBySupplier.filter(function(d){return myArray.indexOf(d) > -1;});  
		}
	
	else{
	   serviceBySupplier.filterAll();
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
    //drawSentimentChart();
    drawBranchSentimentChart();
      
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
		markerCluster = new MarkerClusterer(map, markers);
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
  
  function serviceTable(div) {
    serviceBySuppliers = serviceNestBySupplier.entries(serviceBySupplier.top(Infinity));
    sentimentByProvinces = sentimentNestBySupplierByProvince.entries(serviceBySupplier.top(Infinity));
    sentimentByBranchByHours = sentimentNestByBranchByHour.entries(serviceBySupplier.top(Infinity));
    

    provinceSentimentCount();
    sentimentByBranches();
    
    //console.log(sentimentByBranchByHours);
    //alertobjectKeys(sentimentByBranchByHours);
    
      div.each(function() {
      	 
       var tr = d3.select(this)
  				.selectAll("tr")
  				.data(serviceBySuppliers,function(d) { return d.key; });
    	tr.enter().append("tr")
    	            .append("th")
    				.text(function(d){return d.key;}) // print supplier name
    				.attr("style","fill: #999999; stroke: #000000; font-weight:bold");			
    	tr.exit().remove();
    	
    	var tc_svg = tr.order().selectAll("tr")
      					.data(function(d) { return d.values; })
      					.enter().append("tr")
      					.text(function(d2){return d2.key;}) //print date
    					.attr("style","background-color:white; color: steelblue")
        				.append("td")
        				.append("svg")
        				.attr("height", 16)
        				.attr("width", "100%")
        				.attr('transform', 'translate(-5,-2)')
        				.style("background-color","white");			
        				
		var rects =	 tc_svg.selectAll("td")
						.data(function(d2){ return  d2.values;});
                 		rects.enter().append("svg:rect") // create the rectangle
                 		.attr("y", 0)
                 		.attr("x", function(d, i) {
            				return (i * 15) + 5;
        						})
					    .attr("height",15)
					    .attr("width",11)
					    .attr("rx","15")
					    .attr("ry", "2")
					    .attr("style", function(d, i) { return d.comment_score == "1" ? "stroke:#2ca02c; fill:#2ca02c" : "stroke:#d62728;fill:#d62728"; }) // color code rectangles
					    .append("svg:title")
					    .html(function(d) { return d.consumer_comment; });
    });
       
    
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
        		//console.log(provincesentiments[k].key);
        		//console.log(provincesentiments[k].key);
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
    dictSorted = {};
    // Now process that object with it:
	
	if (arr.length >10){
		limit = 10;
	}
	else {limit = arr.length;}
	
	//for (var i=0;i<arr.length;i++) {
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
	        			//console.log(sent_count);	.keys(obj).length
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
  console.log(gp_branches_dict_pos.sortedKeys);
  //console.log(kz_branches_dict_neg);	
  }


 
function drawSentimentChart() {
		      var  data = google.visualization.arrayToDataTable([
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
		          titlePosition: 'none',
		          //title: 'Service Sentiment',
		          //vAxis: {title: 'Province',  titleTextStyle: {color: 'red'}},
		          //vAxis: {title: 'Province',  titleTextStyle: {color: 'steelblue'}},
		          vAxis:{ textStyle:{color: "steelblue"}},
		          hAxis: { gridlines: {color: "steelblue"},
    						baselineColor: "steelblue",
    						textStyle:{color: "steelblue"}
						 },
		          series: [{color: '#2ca02c', visibleInLegend: true}, 
           				   {color: '#d62728', visibleInLegend:true}
           				  ],
           		  legendTextStyle: {color:"steelblue"}
		        };
		        chart_sentiment = new google.visualization.BarChart(document.getElementById('sentiment_div'));
		        chart_sentiment.draw(data, options);
		        
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
		       	        
}

function drawBranchSentimentChart() {
	var temp_limit = 0;
	var data = new google.visualization.DataTable();
	  data.addColumn('string', 'Branch');
	  data.addColumn('number', 'positive');
	  //data.addColumn('number', 'negative');

	/*	 	 
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
    */
   
    //dictData: dictSorted
  	//console.log(gp_branches_dict_pos.sortedKeys);
  
   //if (provinceSelected == "GP"){
   		keypos = gp_branches_dict_pos.sortedKeys;
   		keyneg = gp_branches_dict_neg.sortedKeys;
   		for (var i=0;i<keypos.length;i++){
   			data.addRow([keypos[i], gp_branches_dict_pos.dictData[keypos[i]]]);
   		}
   //} 
   /*
      function drawVisualization() {
		  // Create and populate the data table.
		  var years = ['2001', '2002', '2003', '2004', '2005'];
		  var sales = [1, 2, 3, 4, 5];
		
		  var data = new google.visualization.DataTable();
		  data.addColumn('string', 'years');
		  data.addColumn('number', 'sales');
		
		  for(i = 0; i < years.length; i++)
		    data.addRow([years[i], sales[i]]);
		
		  // Create and draw the visualization.
		  new google.visualization.LineChart(document.getElementById('visualization')).
		    draw(data, {});
	}
   */
  
  
		       
		       var options = {
		          titlePosition: 'none',
		          //title: 'Service Sentiment',
		          //vAxis: {title: 'Province',  titleTextStyle: {color: 'red'}},
		          //vAxis: {title: 'Province',  titleTextStyle: {color: 'steelblue'}},
		          vAxis:{ textStyle:{color: "steelblue"}},
		          hAxis: { gridlines: {color: "steelblue"},
    						baselineColor: "steelblue",
    						textStyle:{color: "steelblue"}
						 },
		          series: [{color: '#2ca02c', visibleInLegend: true} 
           				   //{color: '#d62728', visibleInLegend:true}
           				  ],
           		  legendTextStyle: {color:"steelblue"}
		        };
		        chart_sentiment = new google.visualization.BarChart(document.getElementById('sentiment_div'));
		        chart_sentiment.draw(data, options);
		        
			  function selectHandler() {
		          var selectedItem = chart_sentiment.getSelection()[0];
		          	if (selectedItem) {
		            		var province = data.getValue(selectedItem.row, 0);
		            		alert('The user selected ' + province);
		          	}
		      }
		
		      google.visualization.events.addListener(chart_sentiment, 'select', selectHandler);  
		       	        
}   

// Load the latest version of the Google Data JavaScript Client
google.load("visualization", "1.x", {packages:["corechart"]});
//google.setOnLoadCallback(drawSentimentChart());
google.setOnLoadCallback(drawBranchSentimentChart());
		   

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