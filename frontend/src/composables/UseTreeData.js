import axios from "axios";

//  Axios is used for HTTP requests
export async function getGraphData() {
  let graphicalData = null;
  try {
    const myresponse = await axios.get("http://localhost:3100/data");
    graphicalData = myresponse.data;
  } catch (error) {
    console.error(error);
  }

  return graphicalData;
}
