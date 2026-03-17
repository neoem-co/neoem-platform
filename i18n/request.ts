import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;
    console.log('getRequestConfig locale:', locale);

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        console.log('Fallback to default locale because:', !locale ? 'no locale found' : `invalid locale ${locale}`);
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
