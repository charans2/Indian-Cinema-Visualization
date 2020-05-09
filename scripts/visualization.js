
var width = 700,
    height = 500,
    nodes,
    links,
    visible_nodes = [],
    visible_links = [],
    start_year,
    end_year,
    cur_year,
    simuulation,
    node,
    link,
    selected_node,
    last_clicked_node,
    selected_link,
    last_clicked_link,
    play = false;

function init() {
  d3.csv("./data/nodes.csv").then(data => {
    data.forEach((node) => {
      node.entry = parseInt(node.entry);
      node.size = parseInt(node.size);
    });
    nodes = data;
    d3.csv("./data/edges.csv").then(data => {
      links = data;
      start_year = d3.min(nodes, function(d) { return d.entry; });
      end_year = d3.max(nodes, function(d) { return d.entry; });
      cur_year = start_year;
      setupGraph();
      update();
      setupSlider();
    });
  });
}

function update() {
  visible_nodes = nodes.filter(node => node.entry <= cur_year);
  visible_links = [];
  for (var i = 0; i < links.length; i++) {
    var source = findNodeByID(links[i].source_id, visible_nodes);
    var target = findNodeByID(links[i].target_id, visible_nodes);
    if (source && target) {
      visible_links.push({
        "source": source,
        "target": target,
        "relation": links[i].relation
      });
    }
  }

  node = node.data(visible_nodes, function(d) { return d.id; });
  node.exit().remove();
  node = node .enter().append("circle")
              .attr("fill", colorNodes)
              .attr("r", 5)
              .merge(node);
  link = link.data(visible_links);
  link.exit().remove();
  link = link .enter().append("line")
              .attr("stroke", colorEdges)
              .attr("stroke-width", "2px")
              .merge(link);
  simulation.nodes(visible_nodes);
  simulation.force("link").links(visible_links);
  simulation.alpha(1).restart();
  node.call(
    d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );
  node.on("click", clickNode);
  node.on("mouseover", hoverNode).on("mouseout", unhoverNode);
  link.on("click", clickEdge);
  link.on("mouseover", hoverEdge).on("mouseout", unhoverEdge);
}

function clickNode(d) {
  if (last_clicked_node != d) {
    selected_node = d;
    last_clicked_node = d;
    node.attr("r", function(o) {
      return (selected_node.id === o.id) ? 10: 5;
    });
    displaySelected();
  } else {
    last_clicked_node = null;
  }
}

function hoverNode(d) {
  selected_node = d;
  node.attr("r", function(o) {
    return (selected_node.id === o.id) ? 10: 5;
  });
  displaySelected();
}

function unhoverNode(d) {
  if (last_clicked_node != d) {
    selected_node = null;
    node.attr("r", function(o) {
      return 5;
    });
    displaySelected();
  }
}

function clickEdge(d) {
  if (last_clicked_link != d) {
    selected_link = d;
    last_clicked_link = d;
    link.attr("stroke-width", function(o) {
      return (selected_link === o) ? "4px": "2px";
    });
    displaySelected();
  } else {
    last_clicked_link = null;
  }
}

function hoverEdge(d) {
  selected_link = d;
  link.attr("stroke-width", function(o) {
    return (selected_link === o) ? "4px": "2px";
  });
  displaySelected();
}

function unhoverEdge(d) {
  if (last_clicked_link != d) {
    selected_link = null;
    link.attr("stroke-width", function(o) {
      return "2px";
    });
    displaySelected();
  }
}

function ticked() {
    node.call(updateNode);
    link.call(updateLink);
}

function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
}

function updateLink(link) {
    link.attr("x1", function(d) { return fixna(d.source.x); })
        .attr("y1", function(d) { return fixna(d.source.y); })
        .attr("x2", function(d) { return fixna(d.target.x); })
        .attr("y2", function(d) { return fixna(d.target.y); });
}

function updateNode(node) {
    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
}

function findNodeByID(id, list) {
  var final;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      final = list[i];
      break;
    }
  }
  return final;
}

function setupSlider() {
  d3.select("#slider")
    .attr("min", "0")
    .attr("max", (end_year-start_year).toString())
    .attr("value", (cur_year-start_year).toString());
  d3.select("#slider-label").text("Year: " + cur_year);
  d3.select("#slider").on("change", function(d){
    cur_year = start_year + parseInt(this.value);
    d3.select("#slider-label").text("Year: " + cur_year);
    update();
  });
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function setupGraph() {
  simulation = d3.forceSimulation(visible_nodes)
    .force("link", d3.forceLink(visible_links).distance(50).strength(1))
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width/2, height/2))
    .force("x", d3.forceX(width / 2).strength(1))
    .force("y", d3.forceY(height / 2).strength(1))
    .on("tick", ticked);
  svg = d3.select("#graph").attr("width", width).attr("height", height);
  container = svg.append("g");
  svg.call(
    d3.zoom()
        .scaleExtent([.1, 4])
        .on("zoom", function() { container.attr("transform", d3.event.transform); })
  );
  link = container.append("g").attr("class", "links")
    .selectAll("line")
    .data(visible_links)
    .enter()
    .append("line")
    .attr("stroke", colorEdges)
    .attr("stroke-width", "2px");
  node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(visible_nodes)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", colorNodes)
}

function buttonClick() {
  if (play) {
    play = false;
    d3.select("#button").text("Play");
  } else {
    play = true;
    d3.select("#button").text("Pause");
    sliderTick();
  }
}

function sliderTick() {
  setTimeout(function() {
    if (cur_year === end_year) {
      play = false;
      d3.select("#button").text("Play");
    } else if (play) {
      cur_year += 1;
      document.getElementById("slider").stepUp();
      d3.select("#slider-label").text("Year: " + cur_year);
      update();
      sliderTick();
    }
  }, 500);
}

function displaySelected() {
  if (selected_node) {
    d3.select("#display-first").text("First Name: " + selected_node.first_name);
    d3.select("#display-last").text("Last Name: " + selected_node.last_name);
    d3.select("#display-prof").text("Profession: " + selected_node.prof);
    d3.select("#display-entry").text("Entry Year: "  + selected_node.entry);
  } else {
    d3.select("#display-first").text("First Name: ");
    d3.select("#display-last").text("Last Name: ");
    d3.select("#display-prof").text("Profession: ");
    d3.select("#display-entry").text("Entry Year: ");
  }
  if (selected_link) {
    d3.select("#display-relation").text("Relation: " + selected_link.relation);
  } else {
    d3.select("#display-relation").text("Relation: ");
  }
}

function colorNodes(d) {
  var res1 = d.prof.split('/');
  var res2 = d.prof.split(',');
  if (res1[0] == "actor" || res2[0] == "actor") {
    return "#3C91E6";
  } else if (res1[0] == "director" || res2[0] == "director") {
    return "#A2D729";
  } else if (res1[0] == "producer" || res2[0] == "producer") {
    return "#FA824C";
  } else if (res1[0] == "music" || res2[0] == "music") {
    return "#9969C7";
  } else if (res1[0] == "relative" || res2[0] == "relative") {
    return "#F8AC59";
  } else {
    return "#AA4465";
  }
}

function colorEdges(d) {
  var res = d.relation;
  if (res == "sibling") {
    return "#ECA400";
  } else if (res == "marriage") {
    return "#CA61C3";
  } else if (res == "parent-child") {
    return "#DA2647";
  } else {
    return "#000000";
  }
}

function searchClick() {
  if (selected_node) {
    var search = selected_node.name.replace(/ /g, "+");
    window.open('http://www.google.com/search?q=' + search, "_blank");
  }
}
