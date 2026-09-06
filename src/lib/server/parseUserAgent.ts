/**
 * Small regex-based User-Agent parser — deliberately not a dependency,
 * since this only needs to bucket visitors into a handful of common
 * browsers/OSes/device types for the analytics dashboard, not perfectly
 * identify every UA string in existence.
 *
 * One real limitation, stated plainly rather than silently approximated:
 * exact device MODEL (e.g. "iPhone 15") is not reliably exposed by
 * browsers anymore — most modern browsers send a frozen/generic UA string
 * for privacy (Chrome's User-Agent Reduction, Safari's long-standing
 * generic iPhone UA, etc.). Only the device TYPE (mobile/tablet/desktop)
 * is realistically derivable from a UA string today.
 */
export interface ParsedUserAgent {
	browser: string;
	os: string;
	deviceType: 'mobile' | 'tablet' | 'desktop';
}

export function parseUserAgent(ua: string): ParsedUserAgent {
	const s = ua || '';

	let browser = 'Unknown';
	if (/edg\//i.test(s)) browser = 'Edge';
	else if (/opr\/|opera/i.test(s)) browser = 'Opera';
	else if (/samsungbrowser/i.test(s)) browser = 'Samsung Internet';
	else if (/firefox\//i.test(s)) browser = 'Firefox';
	else if (/chrome\/|crios\//i.test(s)) browser = 'Chrome';
	else if (/safari\//i.test(s) && /version\//i.test(s)) browser = 'Safari';
	else if (/msie|trident/i.test(s)) browser = 'Internet Explorer';

	let os = 'Unknown';
	if (/windows/i.test(s)) os = 'Windows';
	else if (/android/i.test(s)) os = 'Android';
	else if (/iphone|ipad|ipod/i.test(s)) os = 'iOS';
	else if (/mac os x|macintosh/i.test(s)) os = 'macOS';
	else if (/linux/i.test(s)) os = 'Linux';

	let deviceType: ParsedUserAgent['deviceType'] = 'desktop';
	if (/ipad|tablet|(android(?!.*mobile))/i.test(s)) deviceType = 'tablet';
	else if (/mobi|iphone|ipod|android/i.test(s)) deviceType = 'mobile';

	return { browser, os, deviceType };
}
