import axios from 'axios';
import { getAccountBalance } from '../api';
import { Config } from '../config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../utils', () => ({
  delay: jest.fn(),
}));

describe('getAccountBalance', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });


  const config: Config = {
    ibkr: {
      token: 'test_token',
      queryId: 'test_query_id',
    },
    actual: {
      budgetId: 'test_budget_id',
      syncAccountId: 'test_sync_account_id',
      serverUrl: 'test_server_url',
      serverPassword: 'test_server_password',
      currency: 'USD',
    },
    currencyApi: {
      exchangeRateApiKey: 'test_api_key',
    },
  };

  it('should return the account balance when the API calls are successful', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse>
    `;

    const statementResponseXml = `
      <FlexQueryResponse queryName="Daily Account Balance" type="AF">
        <FlexStatements count="1">
          <FlexStatement accountId="U19485973" fromDate="25/07/2025" toDate="25/07/2025" period="LastBusinessDay" whenGenerated="27/07/2025 134031">
            <EquitySummaryInBase>
              <EquitySummaryByReportDateInBase accountId="U19485973" currency="USD" reportDate="25/07/2025" cash="23.40" stock="13616.61" total="13640.01"/>
            </EquitySummaryInBase>
          </FlexStatement>
        </FlexStatements>
      </FlexQueryResponse>
    `;

    mockedAxios.get
      .mockResolvedValueOnce({ data: sendResponseXml })
      .mockResolvedValueOnce({ data: statementResponseXml });

    const result = await getAccountBalance(config);

    expect(result.balance).toBe(13640.01);
    expect(result.currency).toBe('USD');
  });

  it('should throw an error when SendRequest API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed with status code 404'));

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow('Request failed with status code 404');
  });

  it('should throw an error when GetStatement API call fails', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse>
    `;

    mockedAxios.get
      .mockResolvedValueOnce({ data: sendResponseXml })
      .mockRejectedValueOnce(new Error('Request failed with status code 404'));

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow('Request failed with status code 404');
  });

  it('should throw an error when SendRequest returns a Fail status', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Fail</Status>
        <ErrorCode>1012</ErrorCode>
        <ErrorMessage>Token has expired.</ErrorMessage>
      </FlexStatementResponse>
    `;

    mockedAxios.get.mockResolvedValueOnce({ data: sendResponseXml });

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow('Flex Query SendRequest failed: Token has expired. (Code: 1012)');
  });

  it('should throw an error when SendRequest returns malformed XML', async () => {
    const malformedXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse
    `;

    mockedAxios.get.mockResolvedValueOnce({ data: malformedXml });

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow(/Unclosed root tag/);
  });

  it('should throw an error when GetStatement returns malformed XML', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse>
    `;
    const malformedXml = `
      <FlexQueryResponse queryName="Daily Account Balance" type="AF">
        <FlexStatements count="1">
          <FlexStatement accountId="U19485973" fromDate="25/07/2025" toDate="25/07/2025" period="LastBusinessDay" whenGenerated="27/07/2025 134031">
            <EquitySummaryInBase>
              <EquitySummaryByReportDateInBase accountId="U19485973" currency="USD" reportDate="25/07/2025" cash="23.40" stock="13616.61" total="13640.01"/>
            </EquitySummaryInBase>
          </FlexStatement>
        </FlexStatements>
      </FlexQueryResponse
    `;

    mockedAxios.get
      .mockResolvedValueOnce({ data: sendResponseXml })
      .mockResolvedValueOnce({ data: malformedXml });

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow(/Unclosed root tag/);
  });

  it('should throw an error if GetStatement XML is valid but missing balance data', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse>
    `;
    const statementResponseXmlMissingData = `
      <FlexQueryResponse queryName="Daily Account Balance" type="AF">
        <FlexStatements count="1">
          <FlexStatement accountId="U19485973" fromDate="25/07/2025" toDate="25/07/2025" period="LastBusinessDay" whenGenerated="27/07/2025 134031">
            <!-- Missing EquitySummaryInBase -->
          </FlexStatement>
        </FlexStatements>
      </FlexQueryResponse>
    `;

    mockedAxios.get
      .mockResolvedValueOnce({ data: sendResponseXml })
      .mockResolvedValueOnce({ data: statementResponseXmlMissingData });

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow(/Cannot read properties of undefined/);
  });

  it('should retry GetStatement on temporary failure and succeed', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse>
    `;
    const statementResponseXmlFail = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Fail</Status>
        <ErrorCode>101</ErrorCode>
        <ErrorMessage>Report is not ready yet.</ErrorMessage>
      </FlexStatementResponse>
    `;
    const statementResponseXmlSuccess = `
      <FlexQueryResponse queryName="Daily Account Balance" type="AF">
        <FlexStatements count="1">
          <FlexStatement accountId="U19485973" fromDate="25/07/2025" toDate="25/07/2025" period="LastBusinessDay" whenGenerated="27/07/2025 134031">
            <EquitySummaryInBase>
              <EquitySummaryByReportDateInBase accountId="U19485973" currency="USD" reportDate="25/07/2025" cash="23.40" stock="13616.61" total="13640.01"/>
            </EquitySummaryInBase>
          </FlexStatement>
        </FlexStatements>
      </FlexQueryResponse>
    `;

    mockedAxios.get
      .mockResolvedValueOnce({ data: sendResponseXml })
      .mockResolvedValueOnce({ data: statementResponseXmlFail })
      .mockResolvedValueOnce({ data: statementResponseXmlFail })
      .mockResolvedValueOnce({ data: statementResponseXmlSuccess });

    const result = await getAccountBalance(config);

    expect(result.balance).toBe(13640.01);
    expect(result.currency).toBe('USD');
    expect(mockedAxios.get).toHaveBeenCalledTimes(4);
  });

  it('should eventually throw an error if GetStatement retries all fail', async () => {
    const sendResponseXml = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Success</Status>
        <ReferenceCode>test_reference_code</ReferenceCode>
        <Url>https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement</Url>
      </FlexStatementResponse>
    `;
    const statementResponseXmlFail = `
      <FlexStatementResponse timestamp="27 July, 2025 01:31 PM EDT">
        <Status>Fail</Status>
        <ErrorCode>101</ErrorCode>
        <ErrorMessage>Report is not ready yet.</ErrorMessage>
      </FlexStatementResponse>
    `;

    mockedAxios.get
      .mockResolvedValueOnce({ data: sendResponseXml });

    for (let i = 0; i < 5; i++) {
      mockedAxios.get.mockResolvedValueOnce({ data: statementResponseXmlFail });
    }

    const promise = getAccountBalance(config);
    await expect(promise).rejects.toThrow('Failed to retrieve Flex Statement after 5 attempts.');
    expect(mockedAxios.get).toHaveBeenCalledTimes(6);
  });


});
