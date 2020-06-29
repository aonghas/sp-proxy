import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';
// import { Headers } from 'node-fetch';

import { BasicRouter } from '../BasicRouter';
import { getHeaders } from '../../utils/headers';
import { IProxyContext, IProxySettings } from '../interfaces';

export class GetRouter extends BasicRouter {

  constructor(context: IProxyContext, settings: IProxySettings) {
    super(context, settings);
  }

  public router = (req: Request, res: Response): void => {
    // Route local proxy resources (web app)
    if (this.serveLocalResources(req, res)) {
      return;
    }
    let endpointUrl = this.url.apiEndpoint(req);
    this.logger.info('\nGET (generic): ' + endpointUrl);
    const headers = getHeaders(req.headers);

    // Static resources from SharePoint >>
    if (endpointUrl.indexOf('/ScriptResource.axd') !== -1) {
      const axdUrlArr = endpointUrl.split('/ScriptResource.axd');
      endpointUrl = `${axdUrlArr[0].split('/').splice(0, 3).join('/')}/ScriptResource.axd${axdUrlArr[1]}`;
      this.sp.fetch(endpointUrl, { headers })
        .then(this.handlers.isOK)
        .then((d) => this.handlers.response(res)(d, (r) => r.text()))
        .catch(this.handlers.error(res));
      return;
    }
    // Static resources from SharePoint <<

    this.sp.fetch(endpointUrl, { headers })
      .then(this.handlers.isOK)
      .then((r) => {
        // if (endpointUrl.toLowerCase().indexOf('/_vti_bin') !== -1) {
        //   return this.handlers.response(res)(r);
        // }
        // return this.handlers.responsePipe(res)(r);
        return this.handlers.response(res)(r, (r) => r.buffer());
      })
      .catch(this.handlers.error(res));
  }

  private serveLocalResources(req: Request, res: Response): boolean {
    let staticIndexUrl = '/index.html';
    if (req.url !== '/') {
      staticIndexUrl = req.url.split('?')[0];
    } else {
      let pageContent = String(fs.readFileSync(path.join(this.settings.staticRoot, staticIndexUrl)));
      pageContent = pageContent.replace('##proxyVersion#', (this.settings.metadata as { version: string }).version);
      res.send(pageContent);
      return true;
    }
    if (req.url === '/config') {
      const response = {
        siteUrl: this.ctx.siteUrl,
        username: (this.ctx.authOptions as unknown as { username?: string }).username || 'Add-In'
      };
      res.json(response);
      return true;
    }
    if (fs.existsSync(path.join(this.settings.staticRoot, staticIndexUrl))) {
      res.sendFile(path.join(this.settings.staticRoot, staticIndexUrl));
      return true;
    }
    return false;
  }

}
