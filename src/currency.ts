import axios from 'axios';
import logger from './logger';
import { getConfig } from './config';

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    logger.info(`Currencies are the same (${fromCurrency}). No conversion needed.`);
    return amount;
  }

  const config = getConfig();
  const apiKey = config.currencyApi.exchangeRateApiKey;

  if (!apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY is required for currency conversion.');
  }

  const EXCHANGE_RATE_API_URL = `https://v6.exchangerate-api.com/v6/${apiKey}/pair`;

  try {
    logger.info(`Attempting to convert ${amount} ${fromCurrency} to ${toCurrency} using ExchangeRate-API...`);
    const response = await axios.get(`${EXCHANGE_RATE_API_URL}/${fromCurrency}/${toCurrency}`);

    if (response.data.result === 'error') {
      throw new Error(`ExchangeRate-API error: ${response.data['error-type']}`);
    }

    const rate = response.data.conversion_rate;

    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}.`);
    }

    const convertedAmount = amount * rate;
    logger.info(`Converted ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency} (Rate: ${rate}).`);
    return convertedAmount;
  } catch (error) {
    logger.error(`Error converting currency from ${fromCurrency} to ${toCurrency}:`, error);
    throw error;
  }
}
