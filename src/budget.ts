import * as actualApi from '@actual-app/api';
import { Config } from './config';
import logger from './logger';
import { convertCurrency } from './currency';

export async function updateBudget(ibkrData: { balance: number; currency: string }, config: Config) {
  const { budgetId, syncAccountId, serverUrl, serverPassword, currency: actualBudgetCurrency } = config.actual;
  let ibkrBalance = ibkrData.balance;
  const ibkrCurrency = ibkrData.currency;

  try {
    await actualApi.init({
      serverURL: serverUrl,
      password: serverPassword,
      dataDir: './data'
    });

    await actualApi.downloadBudget(budgetId);

    if (ibkrCurrency !== actualBudgetCurrency) {
      logger.info(`IBKR currency (${ibkrCurrency}) does not match Actual Budget currency (${actualBudgetCurrency}). Attempting conversion.`);
      ibkrBalance = await convertCurrency(ibkrBalance, ibkrCurrency, actualBudgetCurrency);
    } else {
      logger.info(`Currencies match (${ibkrCurrency}). No conversion needed.`);
    }

    const currentActualBalanceInteger = await actualApi.getAccountBalance(syncAccountId);
    const currentActualBalance = actualApi.utils.integerToAmount(currentActualBalanceInteger);

    logger.info(`IBKR Balance (converted to ${actualBudgetCurrency}): ${ibkrBalance}`);
    logger.info(`Current Actual Budget Balance: ${currentActualBalance}`);

    const difference = ibkrBalance - currentActualBalance;

    if (Math.abs(difference) < 0.01) { // Check if difference is negligible
      logger.info('Actual Budget balance is already in sync with IBKR. No adjustment needed.');
      return;
    }

    const transactionType = difference > 0 ? 'Deposit' : 'Withdrawal';
    const newTransaction = {
      account: syncAccountId,
      amount: actualApi.utils.amountToInteger(difference),
      date: new Date().toISOString().split('T')[0],
      payee_name: 'IBKR Balance Adjustment',
      notes: `Balance adjustment from Interactive Brokers (${transactionType})`,
    };

    logger.info(`Calculated difference: ${difference}. Creating a ${transactionType} transaction for this amount.`);
    await actualApi.addTransactions(syncAccountId, [newTransaction]);
    logger.info(`Successfully added a balance adjustment transaction of ${difference} to Actual Budget.`);

  } catch (error) {
    logger.error('Error updating Actual Budget:', error);
    throw error;
  } finally {
    await actualApi.shutdown();
  }
}
