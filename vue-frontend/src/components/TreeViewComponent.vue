<template>
  <div id="myapp">
    <div id="containter">
      <svg ref="svg" :height="svgHeight" :width="svgwidth"></svg>
      <div v-if="showMyCard" id="cardInformation">
        <span class="close" @click="closeCard">X</span>
        <h2>Node Information</h2>
        <span
          ><h3>Name:{{ selectedNode?.name }}</h3></span
        >
        <span
          ><h3>Description:{{ selectedNode?.description }}</h3></span
        >
      </div>
    </div>
  </div>
</template>
<script>
import * as d3 from "d3";
import { ref, onMounted } from "vue";
import axios from "axios";

export default {
  setup() {
    const svgHeight = ref(400);
    const svgWidth = ref(600);
    const graphicalData = ref([]);
    const selectedNode = ref(null);
    const showMyCard = ref(false);
    const svg = ref(null);
    const mainHierarchy = ref(null);

    onMounted(() => {
      getGraphData();
    });

    const getGraphData = async () => {
      const data = {
        data: [
          { name: "A", description: "This is a description of A", parent: "" },
          { name: "B", description: "This is a description of B", parent: "A" },
          { name: "C", description: "This is a description of C", parent: "A" },
          { name: "D", description: "This is a description of D", parent: "A" },
          {
            name: "B-1",
            description: "This is a description of B-1",
            parent: "B",
          },
          {
            name: "B-2",
            description: "This is a description of B-2",
            parent: "B",
          },
          {
            name: "B-3",
            description: "This is a description of B-3",
            parent: "B",
          },
          {
            name: "C-1",
            description: "This is a description of C-1",
            parent: "C",
          },
          {
            name: "C-2",
            description: "This is a description of C-2",
            parent: "C",
          },
          {
            name: "C-3",
            description: "This is a description of C-3",
            parent: "C",
          },
          {
            name: "D-1",
            description: "This is a description of D-1",
            parent: "D",
          },
          {
            name: "D-2",
            description: "This is a description of D-2",
            parent: "D",
          },
          {
            name: "D-3",
            description: "This is a description of D-3",
            parent: "D",
          },
        ],
      };
      // graphicalData.value = data.data;
      //  intializeTreeStructure();
      try {
        const myresponse = await axios.get("http://localhost:3100/data");
        graphicalData.value = await myresponse.data;
        intializeTreeStructure();
      } catch (error) {
        console.error(error);
      }
    };

    const intializeTreeStructure = () => {
      const rootElement = generateHierarchy(graphicalData.value);
      const treeviewLayout = d3
        .tree()
        .size([svgHeight.value - 100, svgWidth.value - 150]);
      const svgElement = d3.select(svg.value);
      const gSVG = svgElement
        .append("g")
        .attr("transform", "translate(50, 50)");
      mainHierarchy.value = d3.hierarchy(rootElement);
      mainHierarchy.value.x0 = svgHeight.value / 2;
      mainHierarchy.value.y0 = 0;

      mainHierarchy.value.children.forEach(collapseNode);
      update(mainHierarchy.value, treeviewLayout, svgElement, gSVG);
    };

    const generateHierarchy = (data) => {
      const map = {};
      const root = [];
      data.forEach((d) => {
        map[d.name] = { ...d, children: [] };
      });
      data.forEach((d) => {
        if (d.parent == "") {
          root.push(map[d.name]);
        } else {
          map[d.parent].children.push(map[d.name]);
        }
      });
      return root[0];
    };

    const collapseNode = (e) => {
      if (e.children) {
        e._children = e.children;
        e.children = null;
        e._children.forEach(collapseNode);
      }
    };

    const update = (nodeSource, treeviewLayout, svgElement, gSVG) => {
      let i = 0;
      const treeValue = treeviewLayout(mainHierarchy.value);
      const nodes = treeValue.descendants();
      const maxX = d3.max(nodes, (d) => d.x);
      const maxY = d3.max(nodes, (d) => d.y);
      svgHeight.value = Math.max(maxX + 150, svgHeight.value);
      svgWidth.value = Math.max(maxY + 200, svgWidth.value);
      svgElement.attr("height", svgHeight.value).attr("width", svgWidth.value);

      const link = gSVG
        .selectAll(".link")
        .data(treeValue.links(), (e) => e.target.id);
      link
        .enter()
        .append("path")
        .attr("class", "link")
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x)
        )
        .style("stroke", "#555")
        .style("stroke-width", "2px")
        .merge(link);

      link
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x)
        )
        .style("stroke-width", "2px");
      link.exit().remove();

      const node = gSVG
        .selectAll(".node")
        .data(nodes, (e) => e.id || (e.id = ++i));

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr(
          "transform",
          (d) => `translate(${nodeSource.y0},${nodeSource.x0})`
        )
        .on("click", (event, d) => {
          nodeClicked(event.currentTarget, d, treeviewLayout, svgElement, gSVG);
        });
      nodeEnter
        .append("rect")
        .attr("height", 40)
        .attr("width", 100)
        .attr("x", -20)
        .attr("y", -20)
        .style("fill", (e) => (e._children ? "#555" : "#69d049"));
      nodeEnter
        .append("text")
        .attr("dy", 3)
        .attr("x", (e) => (e._children || e.children ? -25 : 25))
        .style("text-anchor", (e) =>
          e._children || e.children ? "end" : "start"
        )
        .text((e) => e.data.name);

      const nodeUpdate = nodeEnter.merge(node);
      nodeUpdate
        .transition()
        .duration(250)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);
      nodeUpdate
        .select("rect")
        .style("fill", (e) => (e._children ? "#ff6666" : "#49d049"));
      node
        .exit()
        .transition()
        .duration(250)
        .attr("transform", (d) => `translate(${nodeSource.y},${nodeSource.x})`)
        .remove();

      treeValue.descendants().forEach((e) => {
        e.x0 = e.x;
        e.y0 = e.y;
      });
    };

    const nodeClicked = (ele, d, treeviewLayout, svgElement, gSVG) => {
      showMyCard.value = true;
      cardSelected(ele, d);

      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (!d.children && !d._children) {
        return;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d, treeviewLayout, svgElement, gSVG);
    };

    const cardSelected = (ele, d) => {
      d3.selectAll("node").classed("selected", false);
      d3.select(ele).classed("selected", true);
      selectedNode.value = d.data;
    };

    const closeCard = () => {
      showMyCard.value = false;
    };

    return {
      svgHeight,
      svgWidth,
      svg,
      showMyCard,
      selectedNode,
      closeCard,
    };
  },
};
</script>
<style scoped>
#container {
  display: flex;
  height: 100%;
  width: 100%;
}

.tree-svg {
  flex: 1;
  width: 100%;
  height: 100%;
}

#cardInformation {
  position: absolute;
  left: 0;
  top: 0;
  width: 200px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  display: block;
}

#cardInformation h2 {
  margin: 0;
}

#cardInformation span .close {
  font-size: 18px;
  cursor: pointer;
  position: absolute;
  right: 10px;
  top: 10px;
}

.node rect {
  fill: #69b3a2;
  stroke: #555;
  stroke-width: 2px;
}

.node text {
  font: 15px sans-serif;
  fill: #33333367;
}

.node .selected rect {
  stroke: #ff7f0e;
  stroke-width: 4px;
}

.link {
  fill: none;
  stroke: #555;
  stroke-width: 2px;
}
.close {
  float: right;
  color: red;
}
</style>
