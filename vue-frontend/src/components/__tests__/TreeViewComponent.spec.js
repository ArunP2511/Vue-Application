import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import TreeViewComponent from "../TreeViewComponent.vue";
import * as d3 from "d3";

// Disable transitions in test
d3.selection.prototype.transition = function () {
  return this;
};

vi.mock("axios");

describe("TreeViewComponent", () => {
  let vuewrapper;
  beforeEach(async () => {
    vuewrapper = mount(TreeViewComponent);

    await flushPromises();
    await vuewrapper.vm.$nextTick();
  });
  it("renders the svg element properly", () => {
    expect(vuewrapper.find("svg").exists()).toBe(true);
  });

  it("renders the card information properly", async () => {
    const node = vuewrapper.find(".node");
    expect(node.exists()).toBe(true);
    await node.trigger("click");
    expect(vuewrapper.find("#cardInformation").exists()).toBe(true);
  });
  it("gets the data on mounted and populated the getGraphData properly", async () => {
    axios.get.mockResolvedValue({
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
      ],
    });

    await vuewrapper.vm.getGraphData();
    expect(vuewrapper.vm.getGraphData.length).toBe(7);
    expect(vuewrapper.vm.getGraphData[0].name.toBe("A"));
    expect(vuewrapper.vm.graphicalData).toEqual([
      { name: "A", description: "This is a description of A", parent: "" },
      { name: "B", description: "This is a description of B", parent: "A" },
      { name: "C", description: "This is a description of C", parent: "A" },
      { name: "D", description: "This is a description of D", parent: "A" },
      { name: "B-1", description: "This is a description of B-1", parent: "B" },
      { name: "B-2", description: "This is a description of B-2", parent: "B" },
      { name: "B-3", description: "This is a description of B-3", parent: "B" },
    ]);
  });
  it("select a node and then display the information card", async () => {
    vuewrapper.setData({
      getGraphData: [
        { name: "A", description: "This is a description of A", parent: "" },
        { name: "B", description: "This is a description of B", parent: "A" },
      ],
    });
    await vuewrapper.vm.intializeTreeStructure();

    const node = vuewrapper.find(".node");
    await node.trigger("click");

    expect(vuewrapper.vm.selectedNode.name).toBe("A");
    expect(vuewrapper.vm.showMyCard).toBe(true);
    expect(vuewrapper.find("#cardInformation").exists()).toBe(true);
  });

  it("clicks on the close button to close the card", async () => {
    VueWrapper.setData({
      showMyCard: true,
      selectedNode: {
        name: "A",
        description: "This is a description of A",
        parent: "",
      },
    });

    const closeButton = vuewrapper.find(".close");
    await closeButton.trigger("click");
  });
});
