const GOOGLE_FORM_URL =
  process.env.GOOGLE_FORM_URL ||
  'https://docs.google.com/forms/d/e/1FAIpQLScP6eIywl_XpNrRqfR-COSpCWuPfaAzJfabTvEfmoKJ24jpDA/formResponse';

const fields = {
  customerName: 'entry.1288345478',
  customerPhone: 'entry.1716100066',
  governorate: 'entry.811487362',
  address: 'entry.974318607',
  products: 'entry.198297316',
  productQuantities: 'entry.2017881486',
  promoCode: 'entry.2036815179',
};

function buildGoogleFormBody(order) {
  const body = new URLSearchParams();

  body.set(fields.customerName, order.customer_name);
  body.set(fields.customerPhone, order.customer_phone);
  body.set(fields.governorate, order.governorate);
  body.set(fields.address, order.address);

  order.products.forEach((product) => {

    body.append(fields.products, `${product.code} ${product.name}`);
  });

  body.set(
    fields.productQuantities,
    order.products
      .map((product) => `${product.code}: ${product.quantity}`
      )
      .join('\n')
  );

  body.set(fields.promoCode, order.promo_code || '');
  console.log([...body.entries()]);
  return body;
}

async function submitOrderToGoogleForm(order) {
  const response = await fetch(GOOGLE_FORM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: buildGoogleFormBody(order),
    redirect: 'follow',
    signal: AbortSignal.timeout(
      Number(process.env.GOOGLE_FORM_TIMEOUT_MS) || 10000
    ),
  });

  console.log({
  status: response.status,
  finalUrl: response.url,
  redirected: response.redirected,
});

if (!response.ok) {
  const errorPage = await response.text();
  console.error(errorPage.slice(0, 1000));
  throw new Error(`Google Form responded with status ${response.status}`);
}

  return response;
}

module.exports = { buildGoogleFormBody, submitOrderToGoogleForm };