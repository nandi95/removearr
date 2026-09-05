import config from "../utils/config.ts";
import makeArrRequest from "../utils/arrRequest.ts";

export default makeArrRequest(config.sonarrUrl, config.sonarrApiKey);
