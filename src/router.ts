// src : https://github.com/phobon/fragments-boilerplate-vanilla/blob/main/src/router.js

export type RouteHandler = (path: string) => void;

export default class Router {
  private routeHandler: RouteHandler;
  private currentRoute: string | null = null;

  constructor(routeHandler: RouteHandler) {
    this.routeHandler = routeHandler;
    this.init();
  }

  /** Initialize router and listen for hash changes */
  private init(): void {
    this.handleRoute();

    window.addEventListener("hashchange", () => {
      this.handleRoute();
    });
  }

  /** Parse current hash and execute route handler */
  private handleRoute(): void {
    const hash = window.location.hash.slice(1); // Remove #
    const path = hash || "/";

    this.currentRoute = path;

    this.routeHandler(path);
  }

  /** Navigate to a route */
  public navigate(path: string): void {
    window.location.hash = path;
  }

  /** Get the current route */
  public getCurrentRoute(): string | null {
    return this.currentRoute;
  }
}
