/**
 * Allows you to choose which routes you want in the Express Router
 */
export default class ExpressRouterOptions {
    public handleErrors?: boolean = true;
    public routeCoreFiles?: boolean = true;
    public routeEditorCoreFiles?: boolean = true;
    public routeGetAjax?: boolean = true;
    public routeGetContentFile?: boolean = true;
    public routeGetDownload?: boolean = true;
    public routeGetLibraryFile?: boolean = true;
    public routeGetParameters?: boolean = true;
    public routeGetTemporaryContentFile?: boolean = true;
    public routePostAjax?: boolean = true;
}
