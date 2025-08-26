export const ROUTES = {
  private: ["/dashboard", "/data-sources", "/map", "/api", "/admin"],
  marketing: ["/", "/features", "/about", "/privacy"],
} as const;

export const isPrivateRoute = (pathname: string): boolean => {
  return ROUTES.private.some((route) => pathname.startsWith(route));
};

export const isMarketingRoute = (pathname: string): boolean => {
  return ROUTES.marketing.some((route) => pathname === route);
};
