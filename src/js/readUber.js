function getData() {
	var uberElement = document.getElementById('UberData');
	var data = [];
        if (uberElement) {
                var original =unescape( uberElement.value);

                if((original.trim()!= "Invalid") && (original.trim()!= "Zero") &&(original.trim()!= "Error")) {
	                var data = JSON.parse(original.replace(new RegExp("'", 'g'), "\""));
		}
	}
	return data;

}
function showData(canvas, chart) {
	var uberElement = document.getElementById('UberData');
	
	if (uberElement) {
		var original =unescape( uberElement.value);
		
		if(original.trim()== "Invalid") {
                        document.write('Invalid email or password. If you do not have an Uber account, get one <a href="https://www.uber.com/invite/uberSGFREE15/"> here </a>.');
                        document.write(' Use this code to get a $15 free ride - <b> <a href="https://www.uber.com/invite/uberSGFREE15/"> uberSGFREE15 </a>.</b>');

		}
		else if(original.trim()== "Zero") {
                        document.write('Looks like you do not have any rides yet.');
			document.write(' Use this code to get a $15 free ride - <b><a href="https://www.uber.com/invite/uberSGFREE15/">uberSGFREE15 </a>.</b>');
                }

		else if(original.trim()== "Error") {
                        document.write('Opps, something broke. I guess I have not caught an outlier.');
                        document.write(' Help me make this better, contact me!');
		}
		else {
		var data = JSON.parse(original.replace(new RegExp("'", 'g'), "\""));
		
		document.write("<h4> Segmenting your UBERing </h4>");
		drawPie(canvas, data);
		
		document.write("<h4> All your trips</h4>");
		drawBar(canvas, data);
		
		document.write("<h4> Your Uber pattern by address </h4>");
		showChord(canvas, data);
		//showTop(canvas, data);

		//document.write("<p>I am still working on few enhancements:");
		//document.write("<li> Google map of all you trip routes");
		//document.write("<li> Compare what you would have paid for the same trip in normal taxi");
		//drawMap(data);
		document.write("<h4> All your ride routes </h4>");
		}
	}

}
function showChord(canvas, data) {
	var pickup = [];
	var matrix = [];
	var matrixInner = [];
	for (i = 0; i< data.length; i++) {
		pickup.push(data[i][8]);
		pickup.push(data[i][10]);
	}
	var sortedpickup = pickup.sort();
	var results = [];
	results.push(sortedpickup[0]);
	for (var i = 1; i < pickup.length; i++) {
		if (sortedpickup[i - 1] != sortedpickup[i]) {
			results.push(sortedpickup[i]);
		}
	}
	//calculate total sum per start/end
	var markerTotal = d3.nest()
		.key(function (d) { return (d[8]+d[10]); })
		.rollup(function (v) { return d3.sum(v, function (d) { return d[4]; });
		})
		.entries(data);

	matrixInner =new Array(results.length).fill(0);
	for (i =0;i<results.length; i++) {matrixInner =new Array(results.length).fill(0); matrix.push(matrixInner);}
	for (var k =0; k<data.length; k++) {
		//get the total for start/end
		var foundKeys = Object.keys(markerTotal).filter(function(key) {
			return markerTotal[key].key == data[k][8]+data[k][10];
		});
		matrix[results.indexOf(data[k][8])][results.indexOf(data[k][10])] = markerTotal[foundKeys[0]].values;
	}
	//Draw the actual cord
	
	var width = parseInt(d3.select(canvas).style('width')),
	height = Math.min(width, 690),	
	outerRadius = Math.min(width, height) / 2,
	innerRadius = outerRadius - 54,
	r1 = height / 2,
	r0 = r1 - 100;
	var formatPercent = d3.format(".1%");
	var color = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'];
	
	var arc = d3.svg.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius);
	var layout = d3.layout.chord()
			.padding(0.01)
			.sortSubgroups(d3.descending)
			.sortChords(d3.ascending);

	var path = d3.svg.chord()
			.radius(innerRadius);
	var body = d3.select(canvas);
	var svg = body.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("id", "circle")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	svg.append("circle")
		.attr("r", outerRadius)
		.style("fill", "white");
	layout.matrix(matrix);
	// Add a group per neighborhood.
	var group = svg.selectAll(".group")
			.data(layout.groups)
			.enter().append("g")
			.attr("class", "group")
			.on("mouseover", mouseover);
	// Add a mouseover title.
	group.append("title").text(function (d, i) {
			return "Trips from " + results[i] + ": " + d.value;
		});
	// Add the group arc.
	var groupPath = group.append("path")
			.attr("id", function (d, i) {
				return "group" + i;
			})
			.attr("d", arc)
			.style("fill", function (d, i) {
				return color[i%12];
			});

	var groupText = group.append("text")
			.each(function (d) {
				d.angle = (d.startAngle + d.endAngle) / 2;
			})
			.attr("dy", 8)
			.style("font-family", "helvetica, arial, sans-serif")
			.style("font-size", "9px")
			.attr("text-anchor", function (d) {
				return d.angle > Math.PI ? "end" : null;
			})
			.attr("transform", function (d) {
				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
				 + "translate(" + (r0 + 46) + ")"
				 + (d.angle > Math.PI ? "rotate(180)" : "");
			})
			.text(function (d, i) {
				return results[i];
			});

	// Add the chords.
	var chord = svg.selectAll(".chord")
			.data(layout.chords)
			.enter().append("path")
			.attr("class", "chord")
			.style("fill", function (d) {
				return color[d.source.index%12];
			})
			.attr("d", path);
	// Add an elaborate mouseover title for each chord.
	chord.append("title").text(function (d) {
			return results[d.source.index]
			 + " to " + results[d.target.index]
			 + ": " + d.source.value
			 + "\n" + results[d.target.index]
			 + " to " + results[d.source.index]
			 + ": " +d.target.value;
		});
	function mouseover(d, i) {
			chord.classed("fadechord", function (p) {
				return p.source.index != i
				 && p.target.index != i;
			});
		}
	
	//resize based on window
	d3.select(window).on('resize', resize);

	function resize() {
		// adjust things when the window size changes
		width = parseInt(d3.select('body').style('width'));
		height = Math.min(width, 690);
		outerRadius = Math.min(width, height) / 2;
		innerRadius = outerRadius - 54;
		r1 = height / 2;
		r0 = r1 - 100;
		// resize the map container
		svg
			.style('width', width + 'px')
			.style('height', height + 'px');

		// resize the map
		svg.select('circle').attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		svg.selectAll(".group").selectAll("text").attr("transform", function (d) {
					return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
					 + "translate(" + (r0 + 46) + ")"
					 + (d.angle > Math.PI ? "rotate(180)" : "");
				});
	}
}
function showTop(canvas, data) {
	first = data.sort(function (a,b) { return (b[4] -a[4]);})[0];
	document.write("</br><p>Your Most expensive trip costed <b> "+first[3]+first[4]+"</b> on <b>"+first[1]+"</b>");
	document.write(" From <b> "+first[8]+"</b> to <b>"+first[10]+"</b>");

}
function drawBar(canvas, data) {

	var margin = {
		top : 20,
		right : 30,
		bottom : 130,
		left : 40
	},
	width = parseInt(d3.select(canvas).style('width')) - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
		.range([height, 0]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	var chart = d3.select(canvas).append("svg")
		.attr("class", "chart")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	x.domain(data.map(function (d) {
			return d[1];}));
	y.domain([0, d3.max(data, function (d) {
				return Math.floor(d[4]);
			})]);

	var barWidth = width / data.length;

	chart.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis)
	.selectAll("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 0)
	.attr("x", -5)
	.attr("dy", ".71em")
	.style("text-anchor", "end");

	chart.append("g")
	.attr("class", "y axis")
	.call(yAxis)
	.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Cost");

	var bar = chart.selectAll(".bar")
		.data(data)
		.enter().append("g")
		.attr("transform", function (d, i) {
			return "translate(" + i * barWidth + ",0)";
		});

	bar.append("rect")
		.attr("class", "bar")
		.attr("y", function (d) {
			return y(d[4]);
		})
		.attr("height", function (d) {
			return height - y(d[4]);
		})
		.attr("width", barWidth-1)
		.append("title").html(function (d, i) {
			return d[8] + " -->  " + d[10] + "<br/>" + d[5]+ "<br/>" +d[1]+" "+d[7]+ " to "+d[9]+ "<br/>" +d[3]+d[4];
		});

	//resize based on window
	d3.select(window).on('resize', resize);
	function resize() {
		// adjust things when the window size changes
		width = parseInt(d3.select(canvas).style('width'));
		width = width - margin.left - margin.right;
		barWidth = width / data.length;
		// resize the map container
		chart.style('width', width + 'px')
			.style('height', height + 'px');

		// resize the map
		chart.select('.bar').attr("transform", function (d, i) {
				return "translate(" + i * barWidth + ",0)";
		});
	}
}

function drawPie(canvas, data) {

	var TypeTotal = d3.nest()
		.key(function (d) { return d[5]; })
		.rollup(function (v) { return d3.sum(v, function (d) { return d[4]; });
		})
		.entries(data);
	var DateTotal = d3.nest()
		.key(function (d) { return Date.parse(d[1]).toString("MMM yy"); })
		.rollup(function (v) { return d3.sum(v, function (d) { return d[4]; });
		})
		.entries(data);
	var CityTotal = d3.nest()
		.key(function (d) { return d[6]; })
		.rollup(function (v) { return d3.sum(v, function (d) { return d[4]; });
		})
		.entries(data);
	var allSegment = [TypeTotal,CityTotal,DateTotal];
	var header = ["How?", "Where?", "When?"];
	var margin = { top : 10, right : 10, bottom : 60, left : 20 },
		width = 690,
		height = 300,
		rw = 690 - margin.left - margin.right,
		rh = 300 - margin.top - margin.bottom,
		pies = allSegment.length;

	radius = Math.min(rw, rh*2) / pies;

	var color = d3.scale.category20()
	var arc = d3.svg.arc()
		.outerRadius(radius - 42)
		.innerRadius(0);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function (d) { return d.values; });

	for (p = 0; p < pies; p++) {
		var svg = d3.select(canvas).append("svg")
			.attr("width", (width) / pies)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width/pies/2 + "," + height/2 + ")");

		var g = svg.selectAll(".arc")
			.data(pie(allSegment[p]))
			.enter().append("g")
			.attr("class", "arc");

		g.append("path")
		.attr("d", arc)
		.style("fill", function (d, i) { return color(i); })
		.append("title").text(function (d) { return d.data.key + " : "+d.value.toFixed(2); });

		g.append("text")
		.attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.text(function (d, i) { return d.data.key; });
		
		var svgText = svg.selectAll(".text").data(allSegment[p]).enter().append("text").attr("class", "text");
		svgText.attr("x", -20 ).attr("y", -120).text(header[p]);
		
	}
}

function drawMap(map) {
	//No need to create map again as it is init in post directly.
	//var map;
	//var mapOptions = { center: new google.maps.LatLng(data[0][11][0], data[0][11][1]), zoom: 8, mapTypeId: google.maps.MapTypeId.ROADMAP };

	//	map = new google.maps.Map(document.getElementById("map"), mapOptions);
	//	directionsService = new google.maps.DirectionsService();

 	var data = getData();
	if (data.length == 0) {
		document.getElementById('map').style.display = "none";
	}
	if (data.length > 0) {
		//show the map div
		document.getElementById('map').style.display = "block";

		function renderDirections(result) { 
        		var directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true }); 
        		directionsRenderer.setMap(map); 
        		directionsRenderer.setDirections(result); 
      		}     
		function requestDirections(start, end, contentStart, contentEnd) {
			var infowindowStart = new google.maps.InfoWindow({content: contentStart});
  			var markerStart = new google.maps.Marker({position: start, map: map});
  			markerStart.addListener('click', function() {  infowindowStart.open(map, markerStart);  });
  
			var infowindowEnd = new google.maps.InfoWindow({  content: contentEnd  });
  			var markerEnd = new google.maps.Marker({position: end, map: map});
  			markerEnd.addListener('click', function() { infowindowEnd.open(map, markerEnd);  });
      			
			directionsService.route({
        			origin: start,
        			destination: end,
        			travelMode: google.maps.DirectionsTravelMode.DRIVING
      			}, function(result) {
   				renderDirections(result);

				//if (status == google.maps.DirectionsStatus.OK) { 
        			//	renderDirections(result); 
				//}
				//else{
      				//	console.log('Directions request failed due to ' + status);
		
				//}
      			}); 
    		} 

		(function renderr(data, i){       
   			setTimeout(function () { 		
				var contentStart = "<br/>To : " + data[i][10] + "<br/>Departure:" + data[i][1]+" "+data[i][7]+ "<br/>Cost: " +data[i][3]+data[i][4];
				//console.log(contentStart);
				var contentEnd = "<br/>From : "+data[i][8]+ "<br/>Arrival:" + data[i][1]+" "+data[i][9]+ "<br/>Cost: " +data[i][3]+data[i][4];
				requestDirections(new google.maps.LatLng(data[i][11][0], data[i][11][1]), new google.maps.LatLng(data[i][12][0], data[i][12][1]), contentStart, contentEnd);             
      				if (i--) renderr(data, i);      
   			}, 1)
		})(data, data.length-1); 
	}
}
