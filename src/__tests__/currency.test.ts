import axios from 'axios';
import { convertCurrency } from '../currency';
import { getConfig } from '../config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}));

describe('convertCurrency', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    (getConfig as jest.Mock).mockReturnValue({
      currencyApi: {
        exchangeRateApiKey: 'test_api_key',
      },
    });
  });

  it('should return the same amount if fromCurrency and toCurrency are the same', async () => {
    const amount = 100;
    const fromCurrency = 'USD';
    const toCurrency = 'USD';

    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);

    expect(convertedAmount).toBe(amount);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('should convert the amount if currencies are different and API call is successful', async () => {
    const amount = 100;
    const fromCurrency = 'USD';
    const toCurrency = 'EUR';
    const rate = 0.85;

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        result: 'success',
        conversion_rate: rate,
      },
    });

    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);

    expect(convertedAmount).toBe(amount * rate);
    expect(mockedAxios.get).toHaveBeenCalledWith(`https://v6.exchangerate-api.com/v6/test_api_key/pair/USD/EUR`);
  });

  it('should throw an error if API key is missing when conversion is needed', async () => {
    (getConfig as jest.Mock).mockReturnValue({
      currencyApi: {
        exchangeRateApiKey: '',
      },
    });

    const amount = 100;
    const fromCurrency = 'USD';
    const toCurrency = 'EUR';

    await expect(convertCurrency(amount, fromCurrency, toCurrency)).rejects.toThrow('EXCHANGE_RATE_API_KEY is required for currency conversion.');
  });

  it('should throw an error if API call fails', async () => {
    const amount = 100;
    const fromCurrency = 'USD';
    const toCurrency = 'EUR';

    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(convertCurrency(amount, fromCurrency, toCurrency)).rejects.toThrow('Network Error');
  });

  it('should throw an error if API returns an error result', async () => {
    const amount = 100;
    const fromCurrency = 'USD';
    const toCurrency = 'EUR';

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        result: 'error',
        'error-type': 'unsupported-code',
      },
    });

    await expect(convertCurrency(amount, fromCurrency, toCurrency)).rejects.toThrow('ExchangeRate-API error: unsupported-code');
  });

  it('should throw an error if exchange rate is not found', async () => {
    const amount = 100;
    const fromCurrency = 'USD';
    const toCurrency = 'EUR';

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        result: 'success',
        // conversion_rate is missing
      },
    });

    await expect(convertCurrency(amount, fromCurrency, toCurrency)).rejects.toThrow('Exchange rate not found for USD to EUR.');
  });
});