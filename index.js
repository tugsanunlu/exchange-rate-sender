const sgMail = require('@sendgrid/mail');
const fetch = require('node-fetch');
const convert = require('xml-js');

const SETTINGS = {
  mail: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.MAIL_SENDER,
    receiver: process.env.MAIL_RECEIVER,
  },
  exchange: {
    apiUrl: 'https://www.tcmb.gov.tr/kurlar/today.xml',
    currencyReq: ['US DOLLAR', 'EURO', 'POUND STERLING']
  }
}

function handleExchangeRates(exchangeRates) {
  let parsed = JSON.parse(convert.xml2json(exchangeRates, { compact: true, spaces: 4 }));
  let filteredExchangeRates = parsed.Tarih_Date.Currency.filter(curr => SETTINGS.exchange.currencyReq.find(reqCurr => reqCurr === curr.CurrencyName._text));
  var message = `
    <table>
      <tr style="font-weight: bold;">
        <td>Currencies</td>
        <td>Buying</td>
        <td>Selling</td>
      </tr>`;
  filteredExchangeRates.map(curr => {
    message += `
      <tr>
        <td style="font-weight: bold;">${curr._attributes.CurrencyCode}</td>
        <td>${curr.ForexBuying._text}</td>
        <td>${curr.ForexSelling._text}</td>
      </tr>`;
  });
  message += '</table>';
  sendMail(message, SETTINGS.mail);
}

function sendMail(message, settings) {
  sgMail.setApiKey(settings.apiKey);
  let today = new Date();
  let mail = {
    to: settings.receiver,
    from: settings.sender,
    subject: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
    html: message
  };
  sgMail.send(mail).then(() => {
    console.log('Exchange rates were sent by e-mail.');
  }).catch(error => console.error(error));
}

(function () {
  fetch(SETTINGS.exchange.apiUrl).then(response => {
    return response.text();
  }).then(response => {
    handleExchangeRates(response);
  });
})();

