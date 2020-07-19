import RestProxy from "./core/RestProxy";
import { logger } from "./utils/logger";
import { IProxySettings } from "./core/interfaces";
import { proxy } from "./../config/proxy";

const settings: IProxySettings = {
  configPath: "./config/private.json",
  port: 3000,
};

process.env.https_proxy = proxy;
process.env.http_proxy = proxy;
process.env.HTTP_PROXY = proxy;
process.env.HTTPS_PROXY = proxy;

if (proxy.indexOf("[username]") > -1) {
  console.log(
    "\x1b[41m%s\x1b[0m",
    "Your proxy is not configured properly. Please provide username and password in config/proxy.ts"
  );

  process.exit(1);
}

console.log(`Starting Sharepoint Proxy Server on Port ${settings.port}...`);

if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  logger.error(
    "Your Node.js environment is configured to use a network proxy."
  );
}

const restProxy = new RestProxy(settings);
restProxy.serve();
