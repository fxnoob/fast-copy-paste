import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import constants from "../../constants";
const mountId = constants.contentScript.mountId;
console.log(mountId);
const Element = document.createElement("div");
Element.setAttribute("id", mountId);
document.body.appendChild(Element);
ReactDOM.render(<App />, document.getElementById(mountId));
