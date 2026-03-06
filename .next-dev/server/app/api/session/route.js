/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/session/route";
exports.ids = ["app/api/session/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsession%2Froute&page=%2Fapi%2Fsession%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsession%2Froute.ts&appDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsession%2Froute&page=%2Fapi%2Fsession%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsession%2Froute.ts&appDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_bariq_bitbucket_butayta_seeassest_aicrm2_src_app_api_session_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/session/route.ts */ \"(rsc)/./src/app/api/session/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/session/route\",\n        pathname: \"/api/session\",\n        filename: \"route\",\n        bundlePath: \"app/api/session/route\"\n    },\n    resolvedPagePath: \"/Users/bariq/bitbucket/butayta/seeassest/aicrm2/src/app/api/session/route.ts\",\n    nextConfigOutput,\n    userland: _Users_bariq_bitbucket_butayta_seeassest_aicrm2_src_app_api_session_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzZXNzaW9uJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzZXNzaW9uJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGc2Vzc2lvbiUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmJhcmlxJTJGYml0YnVja2V0JTJGYnV0YXl0YSUyRnNlZWFzc2VzdCUyRmFpY3JtMiUyRnNyYyUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZiYXJpcSUyRmJpdGJ1Y2tldCUyRmJ1dGF5dGElMkZzZWVhc3Nlc3QlMkZhaWNybTImaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQzRCO0FBQ3pHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvYmFyaXEvYml0YnVja2V0L2J1dGF5dGEvc2VlYXNzZXN0L2FpY3JtMi9zcmMvYXBwL2FwaS9zZXNzaW9uL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9zZXNzaW9uL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvc2Vzc2lvblwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvc2Vzc2lvbi9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9iYXJpcS9iaXRidWNrZXQvYnV0YXl0YS9zZWVhc3Nlc3QvYWljcm0yL3NyYy9hcHAvYXBpL3Nlc3Npb24vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsession%2Froute&page=%2Fapi%2Fsession%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsession%2Froute.ts&appDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/api/session/route.ts":
/*!**************************************!*\
  !*** ./src/app/api/session/route.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE),\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n\n\nfunction isValidSessionUser(value) {\n    if (!value || typeof value !== \"object\" || Array.isArray(value)) return false;\n    const user = value;\n    return typeof user.id === \"string\" && typeof user.name === \"string\" && typeof user.email === \"string\";\n}\nasync function POST(request) {\n    const body = await request.json().catch(()=>null);\n    if (!body || typeof body.token !== \"string\" || !isValidSessionUser(body.user)) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Invalid session payload\"\n        }, {\n            status: 400\n        });\n    }\n    await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_1__.setSessionData)({\n        token: body.token,\n        user: body.user,\n        workspaceId: typeof body.workspaceId === \"string\" ? body.workspaceId : undefined\n    });\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        ok: true\n    });\n}\nasync function DELETE() {\n    await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_1__.clearSessionData)();\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        ok: true\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9zZXNzaW9uL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBMkM7QUFDbUI7QUFHOUQsU0FBU0csbUJBQW1CQyxLQUFjO0lBQ3hDLElBQUksQ0FBQ0EsU0FBUyxPQUFPQSxVQUFVLFlBQVlDLE1BQU1DLE9BQU8sQ0FBQ0YsUUFBUSxPQUFPO0lBQ3hFLE1BQU1HLE9BQU9IO0lBQ2IsT0FDRSxPQUFPRyxLQUFLQyxFQUFFLEtBQUssWUFDbkIsT0FBT0QsS0FBS0UsSUFBSSxLQUFLLFlBQ3JCLE9BQU9GLEtBQUtHLEtBQUssS0FBSztBQUUxQjtBQUVPLGVBQWVDLEtBQUtDLE9BQWdCO0lBQ3pDLE1BQU1DLE9BQVEsTUFBTUQsUUFBUUUsSUFBSSxHQUFHQyxLQUFLLENBQUMsSUFBTTtJQUUvQyxJQUFJLENBQUNGLFFBQVEsT0FBT0EsS0FBS0csS0FBSyxLQUFLLFlBQVksQ0FBQ2IsbUJBQW1CVSxLQUFLTixJQUFJLEdBQUc7UUFDN0UsT0FBT1AscURBQVlBLENBQUNjLElBQUksQ0FDdEI7WUFBRUcsT0FBTztRQUEwQixHQUNuQztZQUFFQyxRQUFRO1FBQUk7SUFFbEI7SUFFQSxNQUFNaEIseURBQWNBLENBQUM7UUFDbkJjLE9BQU9ILEtBQUtHLEtBQUs7UUFDakJULE1BQU1NLEtBQUtOLElBQUk7UUFDZlksYUFBYSxPQUFPTixLQUFLTSxXQUFXLEtBQUssV0FBV04sS0FBS00sV0FBVyxHQUFHQztJQUN6RTtJQUVBLE9BQU9wQixxREFBWUEsQ0FBQ2MsSUFBSSxDQUFDO1FBQUVPLElBQUk7SUFBSztBQUN0QztBQUVPLGVBQWVDO0lBQ3BCLE1BQU1yQiwyREFBZ0JBO0lBQ3RCLE9BQU9ELHFEQUFZQSxDQUFDYyxJQUFJLENBQUM7UUFBRU8sSUFBSTtJQUFLO0FBQ3RDIiwic291cmNlcyI6WyIvVXNlcnMvYmFyaXEvYml0YnVja2V0L2J1dGF5dGEvc2VlYXNzZXN0L2FpY3JtMi9zcmMvYXBwL2FwaS9zZXNzaW9uL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgY2xlYXJTZXNzaW9uRGF0YSwgc2V0U2Vzc2lvbkRhdGEgfSBmcm9tIFwiQC9saWIvYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSB9IGZyb20gXCJAL2xpYi9jcm0tdHlwZXNcIjtcblxuZnVuY3Rpb24gaXNWYWxpZFNlc3Npb25Vc2VyKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgTm9uTnVsbGFibGU8U2Vzc2lvbkRhdGFbXCJ1c2VyXCJdPiB7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHVzZXIgPSB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgdXNlci5pZCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIHR5cGVvZiB1c2VyLm5hbWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICB0eXBlb2YgdXNlci5lbWFpbCA9PT0gXCJzdHJpbmdcIlxuICApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVxdWVzdC5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIFBhcnRpYWw8U2Vzc2lvbkRhdGE+IHwgbnVsbDtcblxuICBpZiAoIWJvZHkgfHwgdHlwZW9mIGJvZHkudG9rZW4gIT09IFwic3RyaW5nXCIgfHwgIWlzVmFsaWRTZXNzaW9uVXNlcihib2R5LnVzZXIpKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgeyBlcnJvcjogXCJJbnZhbGlkIHNlc3Npb24gcGF5bG9hZFwiIH0sXG4gICAgICB7IHN0YXR1czogNDAwIH1cbiAgICApO1xuICB9XG5cbiAgYXdhaXQgc2V0U2Vzc2lvbkRhdGEoe1xuICAgIHRva2VuOiBib2R5LnRva2VuLFxuICAgIHVzZXI6IGJvZHkudXNlcixcbiAgICB3b3Jrc3BhY2VJZDogdHlwZW9mIGJvZHkud29ya3NwYWNlSWQgPT09IFwic3RyaW5nXCIgPyBib2R5LndvcmtzcGFjZUlkIDogdW5kZWZpbmVkXG4gIH0pO1xuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG9rOiB0cnVlIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gREVMRVRFKCkge1xuICBhd2FpdCBjbGVhclNlc3Npb25EYXRhKCk7XG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG9rOiB0cnVlIH0pO1xufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImNsZWFyU2Vzc2lvbkRhdGEiLCJzZXRTZXNzaW9uRGF0YSIsImlzVmFsaWRTZXNzaW9uVXNlciIsInZhbHVlIiwiQXJyYXkiLCJpc0FycmF5IiwidXNlciIsImlkIiwibmFtZSIsImVtYWlsIiwiUE9TVCIsInJlcXVlc3QiLCJib2R5IiwianNvbiIsImNhdGNoIiwidG9rZW4iLCJlcnJvciIsInN0YXR1cyIsIndvcmtzcGFjZUlkIiwidW5kZWZpbmVkIiwib2siLCJERUxFVEUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/session/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   clearSessionData: () => (/* binding */ clearSessionData),\n/* harmony export */   getSessionData: () => (/* binding */ getSessionData),\n/* harmony export */   requireSessionData: () => (/* binding */ requireSessionData),\n/* harmony export */   setSessionData: () => (/* binding */ setSessionData)\n/* harmony export */ });\n/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! crypto */ \"crypto\");\n/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(crypto__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n/* harmony import */ var _lib_session_constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/session-constants */ \"(rsc)/./src/lib/session-constants.ts\");\n\n\n\nconst SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;\nfunction getSessionSecret() {\n    return process.env.SESSION_PASSWORD ?? \"replace-with-long-random-string\";\n}\nfunction signPayload(payload) {\n    return (0,crypto__WEBPACK_IMPORTED_MODULE_0__.createHmac)(\"sha256\", getSessionSecret()).update(payload).digest(\"base64url\");\n}\nfunction encodeSession(data) {\n    const payload = Buffer.from(JSON.stringify(data), \"utf8\").toString(\"base64url\");\n    const signature = signPayload(payload);\n    return `${payload}.${signature}`;\n}\nfunction decodeSession(raw) {\n    const [payload, signature] = raw.split(\".\");\n    if (!payload || !signature) return null;\n    const expected = signPayload(payload);\n    if (expected !== signature) return null;\n    try {\n        const json = Buffer.from(payload, \"base64url\").toString(\"utf8\");\n        return JSON.parse(json);\n    } catch  {\n        return null;\n    }\n}\nasync function getSessionData() {\n    const jar = await (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    const raw = jar.get(_lib_session_constants__WEBPACK_IMPORTED_MODULE_2__.SESSION_COOKIE_NAME)?.value;\n    if (!raw) return {};\n    return decodeSession(raw) ?? {};\n}\nasync function setSessionData(data) {\n    const jar = await (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    jar.set(_lib_session_constants__WEBPACK_IMPORTED_MODULE_2__.SESSION_COOKIE_NAME, encodeSession(data), {\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"lax\",\n        path: \"/\",\n        maxAge: SESSION_MAX_AGE_SECONDS\n    });\n}\nasync function clearSessionData() {\n    const jar = await (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    jar.set(_lib_session_constants__WEBPACK_IMPORTED_MODULE_2__.SESSION_COOKIE_NAME, \"\", {\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"lax\",\n        path: \"/\",\n        expires: new Date(0)\n    });\n}\nasync function requireSessionData() {\n    const session = await getSessionData();\n    if (!session.token || !session.user) {\n        throw new Error(\"Unauthorized\");\n    }\n    return session;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGgudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBb0M7QUFDRztBQUV1QjtBQUU5RCxNQUFNRywwQkFBMEIsS0FBSyxLQUFLLEtBQUs7QUFFL0MsU0FBU0M7SUFDUCxPQUFPQyxRQUFRQyxHQUFHLENBQUNDLGdCQUFnQixJQUFJO0FBQ3pDO0FBRUEsU0FBU0MsWUFBWUMsT0FBZTtJQUNsQyxPQUFPVCxrREFBVUEsQ0FBQyxVQUFVSSxvQkFBb0JNLE1BQU0sQ0FBQ0QsU0FBU0UsTUFBTSxDQUFDO0FBQ3pFO0FBRUEsU0FBU0MsY0FBY0MsSUFBaUI7SUFDdEMsTUFBTUosVUFBVUssT0FBT0MsSUFBSSxDQUFDQyxLQUFLQyxTQUFTLENBQUNKLE9BQU8sUUFBUUssUUFBUSxDQUFDO0lBQ25FLE1BQU1DLFlBQVlYLFlBQVlDO0lBQzlCLE9BQU8sR0FBR0EsUUFBUSxDQUFDLEVBQUVVLFdBQVc7QUFDbEM7QUFFQSxTQUFTQyxjQUFjQyxHQUFXO0lBQ2hDLE1BQU0sQ0FBQ1osU0FBU1UsVUFBVSxHQUFHRSxJQUFJQyxLQUFLLENBQUM7SUFDdkMsSUFBSSxDQUFDYixXQUFXLENBQUNVLFdBQVcsT0FBTztJQUNuQyxNQUFNSSxXQUFXZixZQUFZQztJQUM3QixJQUFJYyxhQUFhSixXQUFXLE9BQU87SUFFbkMsSUFBSTtRQUNGLE1BQU1LLE9BQU9WLE9BQU9DLElBQUksQ0FBQ04sU0FBUyxhQUFhUyxRQUFRLENBQUM7UUFDeEQsT0FBT0YsS0FBS1MsS0FBSyxDQUFDRDtJQUNwQixFQUFFLE9BQU07UUFDTixPQUFPO0lBQ1Q7QUFDRjtBQUVPLGVBQWVFO0lBQ3BCLE1BQU1DLE1BQU0sTUFBTTFCLHFEQUFPQTtJQUN6QixNQUFNb0IsTUFBTU0sSUFBSUMsR0FBRyxDQUFDMUIsdUVBQW1CQSxHQUFHMkI7SUFDMUMsSUFBSSxDQUFDUixLQUFLLE9BQU8sQ0FBQztJQUNsQixPQUFPRCxjQUFjQyxRQUFRLENBQUM7QUFDaEM7QUFFTyxlQUFlUyxlQUFlakIsSUFBaUI7SUFDcEQsTUFBTWMsTUFBTSxNQUFNMUIscURBQU9BO0lBQ3pCMEIsSUFBSUksR0FBRyxDQUFDN0IsdUVBQW1CQSxFQUFFVSxjQUFjQyxPQUFPO1FBQ2hEbUIsVUFBVTtRQUNWQyxRQUFRNUIsa0JBQXlCO1FBQ2pDNkIsVUFBVTtRQUNWQyxNQUFNO1FBQ05DLFFBQVFqQztJQUNWO0FBQ0Y7QUFFTyxlQUFla0M7SUFDcEIsTUFBTVYsTUFBTSxNQUFNMUIscURBQU9BO0lBQ3pCMEIsSUFBSUksR0FBRyxDQUFDN0IsdUVBQW1CQSxFQUFFLElBQUk7UUFDL0I4QixVQUFVO1FBQ1ZDLFFBQVE1QixrQkFBeUI7UUFDakM2QixVQUFVO1FBQ1ZDLE1BQU07UUFDTkcsU0FBUyxJQUFJQyxLQUFLO0lBQ3BCO0FBQ0Y7QUFFTyxlQUFlQztJQUNwQixNQUFNQyxVQUFVLE1BQU1mO0lBQ3RCLElBQUksQ0FBQ2UsUUFBUUMsS0FBSyxJQUFJLENBQUNELFFBQVFFLElBQUksRUFBRTtRQUNuQyxNQUFNLElBQUlDLE1BQU07SUFDbEI7SUFDQSxPQUFPSDtBQUNUIiwic291cmNlcyI6WyIvVXNlcnMvYmFyaXEvYml0YnVja2V0L2J1dGF5dGEvc2VlYXNzZXN0L2FpY3JtMi9zcmMvbGliL2F1dGgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCB7IGNvb2tpZXMgfSBmcm9tIFwibmV4dC9oZWFkZXJzXCI7XG5pbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhIH0gZnJvbSBcIkAvbGliL2NybS10eXBlc1wiO1xuaW1wb3J0IHsgU0VTU0lPTl9DT09LSUVfTkFNRSB9IGZyb20gXCJAL2xpYi9zZXNzaW9uLWNvbnN0YW50c1wiO1xuXG5jb25zdCBTRVNTSU9OX01BWF9BR0VfU0VDT05EUyA9IDYwICogNjAgKiAyNCAqIDMwO1xuXG5mdW5jdGlvbiBnZXRTZXNzaW9uU2VjcmV0KCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLmVudi5TRVNTSU9OX1BBU1NXT1JEID8/IFwicmVwbGFjZS13aXRoLWxvbmctcmFuZG9tLXN0cmluZ1wiO1xufVxuXG5mdW5jdGlvbiBzaWduUGF5bG9hZChwYXlsb2FkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY3JlYXRlSG1hYyhcInNoYTI1NlwiLCBnZXRTZXNzaW9uU2VjcmV0KCkpLnVwZGF0ZShwYXlsb2FkKS5kaWdlc3QoXCJiYXNlNjR1cmxcIik7XG59XG5cbmZ1bmN0aW9uIGVuY29kZVNlc3Npb24oZGF0YTogU2Vzc2lvbkRhdGEpOiBzdHJpbmcge1xuICBjb25zdCBwYXlsb2FkID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoZGF0YSksIFwidXRmOFwiKS50b1N0cmluZyhcImJhc2U2NHVybFwiKTtcbiAgY29uc3Qgc2lnbmF0dXJlID0gc2lnblBheWxvYWQocGF5bG9hZCk7XG4gIHJldHVybiBgJHtwYXlsb2FkfS4ke3NpZ25hdHVyZX1gO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVTZXNzaW9uKHJhdzogc3RyaW5nKTogU2Vzc2lvbkRhdGEgfCBudWxsIHtcbiAgY29uc3QgW3BheWxvYWQsIHNpZ25hdHVyZV0gPSByYXcuc3BsaXQoXCIuXCIpO1xuICBpZiAoIXBheWxvYWQgfHwgIXNpZ25hdHVyZSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGV4cGVjdGVkID0gc2lnblBheWxvYWQocGF5bG9hZCk7XG4gIGlmIChleHBlY3RlZCAhPT0gc2lnbmF0dXJlKSByZXR1cm4gbnVsbDtcblxuICB0cnkge1xuICAgIGNvbnN0IGpzb24gPSBCdWZmZXIuZnJvbShwYXlsb2FkLCBcImJhc2U2NHVybFwiKS50b1N0cmluZyhcInV0ZjhcIik7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoanNvbikgYXMgU2Vzc2lvbkRhdGE7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTZXNzaW9uRGF0YSgpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gIGNvbnN0IGphciA9IGF3YWl0IGNvb2tpZXMoKTtcbiAgY29uc3QgcmF3ID0gamFyLmdldChTRVNTSU9OX0NPT0tJRV9OQU1FKT8udmFsdWU7XG4gIGlmICghcmF3KSByZXR1cm4ge307XG4gIHJldHVybiBkZWNvZGVTZXNzaW9uKHJhdykgPz8ge307XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRTZXNzaW9uRGF0YShkYXRhOiBTZXNzaW9uRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBqYXIgPSBhd2FpdCBjb29raWVzKCk7XG4gIGphci5zZXQoU0VTU0lPTl9DT09LSUVfTkFNRSwgZW5jb2RlU2Vzc2lvbihkYXRhKSwge1xuICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgIHNlY3VyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiLFxuICAgIHNhbWVTaXRlOiBcImxheFwiLFxuICAgIHBhdGg6IFwiL1wiLFxuICAgIG1heEFnZTogU0VTU0lPTl9NQVhfQUdFX1NFQ09ORFNcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhclNlc3Npb25EYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBqYXIgPSBhd2FpdCBjb29raWVzKCk7XG4gIGphci5zZXQoU0VTU0lPTl9DT09LSUVfTkFNRSwgXCJcIiwge1xuICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgIHNlY3VyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiLFxuICAgIHNhbWVTaXRlOiBcImxheFwiLFxuICAgIHBhdGg6IFwiL1wiLFxuICAgIGV4cGlyZXM6IG5ldyBEYXRlKDApXG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZVNlc3Npb25EYXRhKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IGdldFNlc3Npb25EYXRhKCk7XG4gIGlmICghc2Vzc2lvbi50b2tlbiB8fCAhc2Vzc2lvbi51c2VyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hdXRob3JpemVkXCIpO1xuICB9XG4gIHJldHVybiBzZXNzaW9uO1xufVxuIl0sIm5hbWVzIjpbImNyZWF0ZUhtYWMiLCJjb29raWVzIiwiU0VTU0lPTl9DT09LSUVfTkFNRSIsIlNFU1NJT05fTUFYX0FHRV9TRUNPTkRTIiwiZ2V0U2Vzc2lvblNlY3JldCIsInByb2Nlc3MiLCJlbnYiLCJTRVNTSU9OX1BBU1NXT1JEIiwic2lnblBheWxvYWQiLCJwYXlsb2FkIiwidXBkYXRlIiwiZGlnZXN0IiwiZW5jb2RlU2Vzc2lvbiIsImRhdGEiLCJCdWZmZXIiLCJmcm9tIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvU3RyaW5nIiwic2lnbmF0dXJlIiwiZGVjb2RlU2Vzc2lvbiIsInJhdyIsInNwbGl0IiwiZXhwZWN0ZWQiLCJqc29uIiwicGFyc2UiLCJnZXRTZXNzaW9uRGF0YSIsImphciIsImdldCIsInZhbHVlIiwic2V0U2Vzc2lvbkRhdGEiLCJzZXQiLCJodHRwT25seSIsInNlY3VyZSIsInNhbWVTaXRlIiwicGF0aCIsIm1heEFnZSIsImNsZWFyU2Vzc2lvbkRhdGEiLCJleHBpcmVzIiwiRGF0ZSIsInJlcXVpcmVTZXNzaW9uRGF0YSIsInNlc3Npb24iLCJ0b2tlbiIsInVzZXIiLCJFcnJvciJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/session-constants.ts":
/*!**************************************!*\
  !*** ./src/lib/session-constants.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   SESSION_COOKIE_NAME: () => (/* binding */ SESSION_COOKIE_NAME)\n/* harmony export */ });\nconst SESSION_COOKIE_NAME = \"aicrm_session\";\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3Nlc3Npb24tY29uc3RhbnRzLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxNQUFNQSxzQkFBc0IsZ0JBQWdCIiwic291cmNlcyI6WyIvVXNlcnMvYmFyaXEvYml0YnVja2V0L2J1dGF5dGEvc2VlYXNzZXN0L2FpY3JtMi9zcmMvbGliL3Nlc3Npb24tY29uc3RhbnRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBTRVNTSU9OX0NPT0tJRV9OQU1FID0gXCJhaWNybV9zZXNzaW9uXCI7XG4iXSwibmFtZXMiOlsiU0VTU0lPTl9DT09LSUVfTkFNRSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/session-constants.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsession%2Froute&page=%2Fapi%2Fsession%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsession%2Froute.ts&appDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbariq%2Fbitbucket%2Fbutayta%2Fseeassest%2Faicrm2&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();