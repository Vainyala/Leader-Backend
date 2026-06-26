// utils/extractRoutes.js

/**
 * Extracts all routes and their HTTP methods from an Express router.
 * Optionally filters by a specific HTTP method and executes a callback.
 *
 * @param {Object} router - The Express router instance
 * @param {String} [filterMethod] - Optional method to filter (e.g. 'GET', 'POST')
 * @param {Function} [callback] - Optional callback executed for each matching route
 * @returns {Array} - Array of route objects with path and methods
 *
 * Example usage:
 * extractRoutes(router, 'GET', (route) => {
 *   console.log('Found GET route:', route.path);
 * });
 */
function extractRoutes(router, filterMethod = null, callback = null) {
  const routes = [];

  router.stack.forEach(layer => {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());

      const routeInfo = { path, methods };

      if (filterMethod) {
        if (methods.includes(filterMethod.toUpperCase())) {
          routes.push(routeInfo);
          if (callback) callback(routeInfo);
        }
      } else {
        routes.push(routeInfo);
        if (callback) callback(routeInfo);
      }
    }
  });

  return routes;
}

module.exports = { extractRoutes };
