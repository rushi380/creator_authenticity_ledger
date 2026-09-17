/**
 * Browser stand-in for the `isomorphic-ws` package.
 *
 * The indexer's public-data provider does `import { WebSocket } from
 * 'isomorphic-ws'`, but that package's browser build only has a default
 * export, which Rollup resolves to `undefined` at runtime. Browsers always
 * provide a global WebSocket, so re-export it directly.
 */

export const WebSocket = globalThis.WebSocket;
export default WebSocket;
