import { getAccountBalance } from './api';
import { updateBudget } from './budget';
import { getConfig } from './config';
import logger from './logger';

(async () => {
  try {
    logger.info('Starting daily balance update...');
    const config = getConfig();
    const ibkrData = await getAccountBalance(config);
    await updateBudget(ibkrData, config);
    logger.info('Daily balance update completed successfully.');
  } catch (error) {
    logger.error('An error occurred during daily balance update:', error);
    process.exit(1);
  }
})();