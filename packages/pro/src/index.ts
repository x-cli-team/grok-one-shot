// Pro package exports
export { vision } from './vision';
export { mcp } from './mcp';
export { swarm } from './swarm';
export { syncHistory } from './history-sync';
export { share } from './share';

// Register pro commands
import { registerProCommands } from '../lib/register-commands';
registerProCommands();