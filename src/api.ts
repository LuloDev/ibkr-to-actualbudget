import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { Config } from './config';
import logger from './logger';

const IBKR_FLEX_API_BASE_URL = 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService';

import { delay } from './utils';

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 30000; // 30 seconds

export async function getAccountBalance(config: Config): Promise<{ balance: number; currency: string }> {
  const { token, queryId } = config.ibkr;

  try {
    logger.info('Sending Flex Query request to generate report...');
    const sendRequestUrl = `${IBKR_FLEX_API_BASE_URL}/SendRequest?t=${token}&q=${queryId}&v=3`;
    const sendResponse = await axios.get(sendRequestUrl);
    const sendResult = await parseStringPromise(sendResponse.data);

    if (sendResult.FlexStatementResponse.Status[0] !== 'Success') {
      const errorCode = sendResult.FlexStatementResponse.ErrorCode ? ` (Code: ${sendResult.FlexStatementResponse.ErrorCode[0]})` : '';
      const errorMessage = sendResult.FlexStatementResponse.ErrorMessage ? `: ${sendResult.FlexStatementResponse.ErrorMessage[0]}` : '';
      throw new Error(`Flex Query SendRequest failed${errorMessage}${errorCode}`);
    }

    const referenceCode = sendResult.FlexStatementResponse.ReferenceCode[0];
    logger.info(`Flex Query report generation requested. ReferenceCode: ${referenceCode}`);

    let currentDelay = INITIAL_DELAY_MS;
    for (let i = 0; i < MAX_RETRIES; i++) {
      logger.info(`Attempt ${i + 1}/${MAX_RETRIES}: Fetching actual Flex Statement using ReferenceCode...`);
      const getStatementUrl = `${IBKR_FLEX_API_BASE_URL}/GetStatement?t=${token}&q=${referenceCode}&v=3`;

      try {
        const statementResponse = await axios.get(getStatementUrl);
        const statementResult = await parseStringPromise(statementResponse.data);

        if (statementResult.FlexStatementResponse && statementResult.FlexStatementResponse.Status && statementResult.FlexStatementResponse.Status[0] === 'Fail') {
          const errorCode = statementResult.FlexStatementResponse.ErrorCode ? ` (Code: ${statementResult.FlexStatementResponse.ErrorCode[0]})` : '';
          const errorMessage = statementResult.FlexStatementResponse.ErrorMessage ? `: ${statementResult.FlexStatementResponse.ErrorMessage[0]}` : '';
          logger.warn(`Flex Query GetStatement failed (attempt ${i + 1}): ${errorMessage}${errorCode}. Retrying in ${currentDelay / 1000} seconds...`);
          await delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, MAX_DELAY_MS);
          continue; // Retry
        }

        const equitySummary = statementResult.FlexQueryResponse.FlexStatements[0].FlexStatement[0].EquitySummaryInBase[0].EquitySummaryByReportDateInBase;

        const latestEntry = equitySummary[equitySummary.length - 1];
        const currency = latestEntry.$.currency;

        const totalBalance = parseFloat(latestEntry.$.total);
        logger.info(`Successfully fetched account balance: ${totalBalance} ${currency}`);
        return { balance: totalBalance, currency: currency };

      } catch (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 404 || error.code === 'ERR_NETWORK')) {
          logger.warn(`Flex Query GetStatement network error (attempt ${i + 1}): ${error.message}. Retrying in ${currentDelay / 1000} seconds...`);
          await delay(currentDelay);
          currentDelay = Math.min(currentDelay * 2, MAX_DELAY_MS);
          continue; // Retry
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to retrieve Flex Statement after ${MAX_RETRIES} attempts.`);

  } catch (error) {
    logger.error('Error fetching or parsing data from Interactive Brokers:', error);
    throw error;
  }
}
