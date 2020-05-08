// underscore means unhidden and no underscore means not hidden (Throughout the file)

// Initialise variables that are used in the functions
var width = 700,
    height = 650,
    year = 1910,
    begin_year = 1910,
    end_year = 2019,
    year_tick = true,
    click_while_tick = false,
    root,
    edges,
    force,
    svg,
    div,
    link,
    node,
    fisheye;

// Create the force layout and the svg item individually and append them to the div named chart in the html file
function init() {
    force = d3.layout.force()
        .size([width, height])
        .on("tick", tick);

    svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Define the div for the tooltip
    div = d3.select("#chart").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Store all the objects which have the link or node class associated with them
    link = svg.selectAll(".link");
    node = svg.selectAll(".node");

    // Read in edges
    d3.csv("./data/edges.csv", function(error, json) {
        if (error) throw error;
        edges = json;
        console.log(edges, "EDGES");
    });

    // Read in nodes
    d3.csv("./data/nodes.csv", function(error, json) {
      if (error) throw error;
      root = json;
      console.log(root, "nodes");
      update();
    });
}


// Render the graph for all visible nodes
function update() {
    // Check if the slider is ticking (updating each second)
    if (year_tick) {
        updateYear();
    }

    // Change the value of the slider and year in the html
    document.getElementById("myRange").value = year - begin_year;
    document.getElementById("yearbox").innerHTML = year;

    // Call visible nodes to set the correct list of nodes
    var nodes = visibleNodes(),
        links = [];

    // Add all edges
    for (var i = 0; i < edges.length; i++) {
        var s, t;

        // Look for source in nodes
        if (edges[i]["source"]) {
            s = root[edges[i]["source"]];
        }

        // Look for target in nodes
        if (edges[i]["target"]) {
            t = root[edges[i]["target"]];
        }

        // If the edge is a valid edge, add it to the list of edges in the required format
        if (s != null && t != null) {
            root[edges[i]["source"]].relation.push(edges[i]["target"]);
            root[edges[i]["target"]].relation.push(edges[i]["source"]);
            links.push({
                "source":s,
                "target":t,
                "relation": edges[i]["relation"]
            });
        }
        console.log(root);
    }

    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .linkDistance(30)
        .start();

    // Update the links…
    link = link.data(links, function(d) { return d.target.id; });

    // Exit any old links.
    link.exit().remove();

    // Enter any new links.
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })


    // Update the nodes…
    node = node.data(nodes, function(d) { return d.id; }).style("fill", color);

    // Exit any old nodes.
    node.exit().remove();

    // Enter any new nodes.
    node.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", function(d) {
            if (d.relation) {
                return (5 + d.relation.length * 1);
            } else {
                return 5;
            }
        })
        .style("fill", color)
        .style("stroke", "white")
        .on("click", click)
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.first_name + "<br>" + d.last_name + '<br>' + '<a href="google.com"><img src="https://en.wikipedia.org/wiki/Wikipedia_logo#/media/File:Wikipedia-logo-v2.svg></a>')
                .style("left", (d.x) + "px")
                .style("top", (d.y) + "px")
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .call(force.drag);

    // If we have reached the last year, stop ticking
    if (year >= end_year) {
        year_tick = false;
    }

    // After every 500 milliseconds, increase the year count by 1
    setTimeout(function() {
        if (year_tick && click_while_tick) {
            click_while_tick = false;
        } else if (year_tick) {
            year++;
            update();
        }
    }, 500);
}

// Check if any new nodes need to be added to our current list or if any nodes need to be removed
function updateYear() {
    for (var i = 0; i < root.length ; i++) {
        if  (root[i]) {
            if (root[i].year_entry >= year) {
                //hide node
                root["_" + root.id_list[i]] = root[root.id_list[i]];
                root[root.id_list[i]] = null;
            }
        } else {
            if (root["_" + root.id_list[i]].year_entry < year) {
                //Unhide node
                root[root.id_list[i]] = root["_" + root.id_list[i]];
                root["_" + root.id_list[i]] = null;
            }
        }
    }
}

function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}


// Color leaf nodes based on primary profession
function color(d) {

    var res = d.profession.split('/')

    if (res[0] == "actor") {
        return "#3C91E6";
    } else if (res[0] == "director") {
        return "#A2D729";
    } else if (res[0] == "producer") {
        return "#FA824C";
    } else if (res[0] == "music") {
        return "#CCCCCC";
    } else if (res[0] == "relative") {
        return "#F8AC59";
    } else {
        return "#AA4465";
    }
}

// Returns a list of all visible nodes under the root node
function visibleNodes() {
    var temp = [];
    for (var i = 0; i < root.length ; i++) {
        if(root[i]){
            temp.push(root[i]);
        }
    }
    return temp;
}


// Toggle children on click.
function click(d) {
    var search = d.first_name + " " + d.last_name;
    getWiki(search);
    if (!d3.event.defaultPrevented) {
        if (d._relations && d._relations.length > 0) {
            recursiveUnhide(d);
        } else {
            recursiveHide(d);
        }
        if (year_tick) {
            click_while_tick = true;
        }
        update();
    }
}

function slidePress() {
    year_tick = false;
    year = Number(document.getElementById("myRange").value) + begin_year;
}

// Update the current slider value (each time you drag the slider handle)
function slideRelease() {
    year = Number(document.getElementById("myRange").value) + begin_year;
    updateYear();
    update();
}

// Create a web request and send it to wikipedias api and obtain response
async function getWiki(search) {

    //Create an HTTP Request
    const Http = new XMLHttpRequest();

    //Base request url.
    var url='https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&section=0&page=';

    //Concatenates search term to the url
    url = url + search;

    //Set the HTTP request and send it to the URL
    Http.open("GET", url);
    Http.send();

    //Wait for the request to be successful
    Http.onreadystatechange=(e)=>{
        if (Http.readyState === 4 && Http.status === 200) {

            //On success call the modifyPage function with the parameter of the response as a string
            var text = Http.responseText;
            modifyPage(text);
        }
    }
}

// Replace all links with thier appropriate counterparts
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};


// Take the response from the wikipedia api and display it on the screen
function modifyPage(search) {

	//Parse the response text into a JSON
	var data = JSON.parse(search);

	//Edit the wiki paragraph in the wikibox on the webpage
	if (data.parse) {
	    var text = data.parse.text["*"];
	    text = text.replaceAll('a href=\"', 'a href=\"http://www.wikipedia.org');
	    document.getElementById("wikiPara").innerHTML = text;
	} else {
	    document.getElementById("wikiPara").innerHTML = "Sorry, the person doesn't have a page on wikipedia...";
	}
}
