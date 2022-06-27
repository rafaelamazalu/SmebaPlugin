import { toJSON } from "dom-to-json";
const WARNING_OBSERVATION_TYPE = "warning";
const ERROR_OBSERVATION_TYPE = "error";
const iFrame = document.createElement("iframe"),
  defaultFrameHeight = "62px";
const getXPath = require("get-xpath");

/**
 * Set the height of our iFrame housing our BEX
 * @param height
 */
const setIFrameHeight = (height) => {
  iFrame.height = height;
};

/**
 * Reset the iFrame to its default height e.g The height of the top bar.
 */
const resetIFrameHeight = () => {
  setIFrameHeight(defaultFrameHeight);
};

const getElementByXpath = (path) => {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
};

/* Add a new element for error and warning messages
 */
const addObservationElement = (
  referenceElement,
  observationType,
  observationTitle,
  observationText
) => {
  const el = document.createElement("div");
  const title = document.createElement("strong");
  title.append(observationTitle + " - ");
  el.appendChild(title);
  if (observationType == WARNING_OBSERVATION_TYPE) {
    el.classList.add("warning-observation-element");
  } else {
    el.classList.add("error-observation-element");
  }
  el.append(observationText);
  referenceElement.parentElement.insertBefore(el, referenceElement);
  return el;
};

/**
 * Content hooks which listen for messages from the BEX in the iFrame
 * @param bridge
 */
export default function attachContentHooks(bridge) {
  /**
   * When the drawer is toggled set the iFrame height to take the whole page.
   * Reset when the drawer is closed.
   */
  bridge.on("wb.drawer.toggle", (event) => {
    const payload = event.data;
    if (payload.open) {
      setIFrameHeight("100%");
    } else {
      resetIFrameHeight();
    }
    bridge.send(event.eventResponseKey);
  });
  /**
   * When asking for elements
   */
  bridge.on("wamas.query.elements.by.tagname", (event) => {
    const payload = event.data;
    console.log("Datos del evento: ", event);
    if (payload.query) {
      const result = document.getElementsByTagName(payload.query);
      let serializedResult = [];
      for (let index = 0; index < result.length; index++) {
        let element = toJSON(result[index]);
        element.fullXPath = getXPath(result[index]);
        serializedResult.push(element);
      }
      bridge.send(event.eventResponseKey, { resultado: serializedResult });
    } else {
      bridge.send(event.eventResponseKey, []);
    }
  });
  bridge.on("wamas.query.elements.by.xpath", (event) => {
    const payload = event.data;
    if (payload.query) {
      const result = getElementByXpath(payload.query);
      bridge.send(event.eventResponseKey, { resultado: result });
    } else {
      bridge.send(event.eventResponseKey, []);
    }
  });
  bridge.on("wamas.set.observation.by.xpath", (event) => {
    const payload = event.data;
    if (
      payload.selector &&
      payload.observationType &&
      payload.observationText
    ) {
      const result = getElementByXpath(payload.selector);
      if (payload.observationType == WARNING_OBSERVATION_TYPE) {
        result.classList.add("warning-observation");
      } else {
        result.classList.add("error-observation");
      }

      addObservationElement(
        result,
        WARNING_OBSERVATION_TYPE,
        payload.observationTitle,
        payload.observationText
      );
      bridge.send(event.eventResponseKey, { resultado: result });
    } else {
      bridge.send(event.eventResponseKey, []);
    }
  });
}

/**
 * The code below will get everything going. Initialize the iFrame with defaults and add it to the page.
 * @type {string}
 */
iFrame.id = "bex-app-iframe";
iFrame.width = "100%";
resetIFrameHeight();

// Assign some styling so it looks seamless
Object.assign(iFrame.style, {
  position: "fixed",
  top: "0",
  right: "0",
  bottom: "0",
  left: "0",
  border: "0",
  zIndex: "9999999", // Make sure it's on top
  overflow: "visible",
});
(function () {
  // When the page loads, insert our browser extension app.
  iFrame.src = chrome.runtime.getURL(`www/index.html`);
  document.body.prepend(iFrame);
})();
