
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
    selected,
    last_clicked,
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
              .attr("fill", "blue")
              .attr("r", 5)
              .merge(node);
  link = link.data(visible_links);
  link.exit().remove();
  link = link .enter().append("line")
              .attr("stroke", "#000")
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
  node.on("click", click);
  node.on("mouseover", hover).on("mouseout", unhover);
}

function click(d) {
  if (last_clicked != d) {
    selected = d;
    last_clicked = d;
    node.attr("r", function(o) {
      return (selected.id === o.id) ? 10: 5;
    });
    displaySelected();
  } else {
    last_clicked = null;
  }
}

function hover(d) {
  selected = d;
  node.attr("r", function(o) {
    return (selected.id === o.id) ? 10: 5;
  });
  displaySelected();
}

function unhover(d) {
  if (last_clicked != d) {
    selected = null;
    node.attr("r", function(o) {
      return 5;
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
    .attr("stroke", "#000")
    .attr("stroke-width", "2px");
  node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(visible_nodes)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", "blue")
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
  if (selected) {
    d3.select("#display-id").text("ID: " + selected.id);
    d3.select("#display-first").text("First Name: " + selected.first_name);
    d3.select("#display-last").text("Last Name: " + selected.last_name);
    d3.select("#display-prof").text("Profession: " + selected.prof);
    d3.select("#display-entry").text("Entry Year: "  + selected.entry);
  } else {
    d3.select("#display-id").text("ID: ");
    d3.select("#display-first").text("First Name: ");
    d3.select("#display-last").text("Last Name: ");
    d3.select("#display-prof").text("Profession: ");
    d3.select("#display-entry").text("Entry Year: ");
  }
}
