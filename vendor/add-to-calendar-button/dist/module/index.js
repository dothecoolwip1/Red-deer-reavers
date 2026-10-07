import { tzlib_get_ical_block, tzlib_get_offset, tzlib_get_timezones } from "timezones-ical-library";
import { LitElement, html, nothing, render } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
//#region src/core/globals.ts
/*!
*  @preserve
*
*  ++++++++++++++++++++++
*  Add to Calendar Button
*  ++++++++++++++++++++++
*
*  Creator: Jens Kuerschner (https://jekuer.com)
*  Publisher: Calendarverse GmbH (https://add-to-calendar-pro.com)
*  Project: https://github.com/add2cal/add-to-calendar-button
*  License: Elastic License 2.0 (ELv2) (https://github.com/add2cal/add-to-calendar-button/blob/main/LICENSE.txt)
*  Version: 3.1.1
*  Note: DO NOT REMOVE THE COPYRIGHT NOTICE ABOVE!
*
*/
var atcbVersion = "3.1.1";
var isBrowser = () => {
	if (typeof window === "undefined") return false;
	else return true;
};
var isIOS = isBrowser() ? () => {
	const userAgent = navigator.userAgent;
	if ((/iPad|iPhone|iPod/i.test(userAgent) || /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) && !/MSStream/i.test(userAgent)) return true;
	else return false;
} : () => {
	return false;
};
var isAndroid = isBrowser() ? () => {
	if (/android/i.test(navigator.userAgent) && !/MSStream/i.test(navigator.userAgent)) return true;
	else return false;
} : () => {
	return false;
};
var isSafari = isBrowser() ? () => {
	if (/^(?:(?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)) return true;
	else return false;
} : () => {
	return false;
};
var isMobile = () => {
	if (isAndroid() || isIOS()) return true;
	else return false;
};
var isWebView = isBrowser() ? () => {
	if (/; ?wv|(?:iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent)) return true;
	else return false;
} : () => {
	return false;
};
var isProblematicWebView = isBrowser() ? () => {
	if (/Instagram/i.test(navigator.userAgent)) return true;
	else return false;
} : () => {
	return false;
};
var defaultTarget = isWebView() ? "_system" : "_blank";
var atcbTimeZonesToUtc = /^(?:GMT[+-]\d{1,2}|UTC|Zulu|Etc\/.*)$/i;
var options = [
	"apple",
	"google",
	"ical",
	"ms365",
	"outlookcom",
	"msteams",
	"yahoo"
];
var validRecurrenceOptions = [
	"apple",
	"google",
	"ical"
];
var invalidSubscribeOptions = ["msteams", "yahoo"];
var iosInvalidOptions = ["ical"];
var androidInvalidOptions = ["apple"];
var wcParams = [
	"debug",
	"groupOverview",
	"groupOverviewConfig",
	"proOverride",
	"cspnonce",
	"identifier",
	"name",
	"dates",
	"description",
	"startDate",
	"startTime",
	"endDate",
	"endTime",
	"timeZone",
	"useUserTZ",
	"location",
	"status",
	"uid",
	"organizer",
	"attendee",
	"icsFile",
	"images",
	"recurrence",
	"recurrence_until",
	"recurrence_byDay",
	"recurrence_byMonth",
	"recurrence_byMonthDay",
	"recurrence_weekstart",
	"sequence",
	"recurrence_interval",
	"recurrence_count",
	"availability",
	"subscribe",
	"options",
	"optionsMobile",
	"optionsIOS",
	"iCalFileName",
	"listStyle",
	"buttonStyle",
	"trigger",
	"hideIconButton",
	"hideIconList",
	"hideIconModal",
	"hideTextLabelButton",
	"hideTextLabelList",
	"buttonsList",
	"hideBackground",
	"hideCheckmark",
	"hideBranding",
	"size",
	"label",
	"inline",
	"inlineRsvp",
	"customLabels",
	"customCss",
	"lightMode",
	"language",
	"hideRichData",
	"bypassWebViewCheck",
	"blockInteraction",
	"styleLight",
	"styleDark",
	"styleSource",
	"loadAllStyles",
	"icsReminder",
	"icsUrl",
	"icsCategories",
	"icsClass",
	"icsPriority",
	"icsGeo",
	"icsAttach",
	"icsExdate",
	"icsCreated",
	"icsUpdated",
	"disabled",
	"hidden",
	"hideButton",
	"pastDateHandling",
	"proxy",
	"fakeMobile",
	"fakeIOS",
	"fakeAndroid",
	"forceOverlay",
	"rsvp",
	"ty",
	"customVar",
	"domain",
	"dev"
];
var wcProParams = [
	"debug",
	"proOverride",
	"cspnonce",
	"attendee",
	"images",
	"size",
	"inline",
	"inlineRsvp",
	"customLabels",
	"customCss",
	"lightMode",
	"language",
	"bypassWebViewCheck",
	"blockInteraction",
	"styleLight",
	"styleDark",
	"styleSource",
	"loadAllStyles",
	"icsReminder",
	"icsUrl",
	"icsCategories",
	"icsClass",
	"icsPriority",
	"icsGeo",
	"icsAttach",
	"icsExdate",
	"disabled",
	"hidden",
	"fakeMobile",
	"fakeIOS",
	"fakeAndroid",
	"forceOverlay",
	"customVar",
	"proxy",
	"domain",
	"dev"
];
var wcBooleanParams = [
	"debug",
	"groupOverview",
	"proOverride",
	"useUserTZ",
	"hideIconButton",
	"hideIconList",
	"hideIconModal",
	"hideTextLabelButton",
	"hideTextLabelList",
	"subscribe",
	"hideBackground",
	"hideCheckmark",
	"hideBranding",
	"inlineRsvp",
	"hideRichData",
	"buttonsList",
	"inline",
	"bypassWebViewCheck",
	"blockInteraction",
	"loadAllStyles",
	"disabled",
	"hidden",
	"hideButton",
	"proxy",
	"fakeMobile",
	"fakeIOS",
	"fakeAndroid",
	"forceOverlay",
	"dev"
];
var wcObjectParams = [
	"customLabels",
	"ty",
	"rsvp",
	"customVar",
	"groupOverviewConfig"
];
var wcObjectArrayParams = ["dates"];
var wcArrayParams = [
	"recurrence_byDay",
	"recurrence_byMonth",
	"recurrence_byMonthDay",
	"images",
	"options",
	"optionsMobile",
	"optionsIOS",
	"icsCategories",
	"icsAttach",
	"icsExdate"
];
var wcNumberParams = [
	"sequence",
	"recurrence_interval",
	"recurrence_count",
	"icsPriority"
];
var icons = {
	trigger: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4.5\" width=\"18\" height=\"17\" rx=\"3.5\"/><path d=\"M8 2.5v4M16 2.5v4M3 10.5h18M12 13.5v5M9.5 16h5\"/></svg>",
	plus: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\"><path d=\"M12 5.5v13M5.5 12h13\"/></svg>",
	chevron: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 9.5l6 6 6-6\"/></svg>",
	clock: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V12l3 2\"/></svg>",
	pin: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21.5s7-5.6 7-11.3A7 7 0 1 0 5 10.2c0 5.7 7 11.3 7 11.3Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.6\"/></svg>",
	apple: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 245.657\"><path d=\"M167.084 130.514c-.308-31.099 25.364-46.022 26.511-46.761-14.429-21.107-36.91-24.008-44.921-24.335-19.13-1.931-37.323 11.27-47.042 11.27-9.692 0-24.67-10.98-40.532-10.689-20.849.308-40.07 12.126-50.818 30.799-21.661 37.581-5.54 93.281 15.572 123.754 10.313 14.923 22.612 31.688 38.764 31.089 15.549-.612 21.433-10.073 40.242-10.073s24.086 10.073 40.546 9.751c16.737-.308 27.34-15.214 37.585-30.187 11.855-17.318 16.714-34.064 17.009-34.925-.372-.168-32.635-12.525-32.962-49.68l.045-.013zm-30.917-91.287C144.735 28.832 150.524 14.402 148.942 0c-12.344.503-27.313 8.228-36.176 18.609-7.956 9.216-14.906 23.904-13.047 38.011 13.786 1.075 27.862-7.004 36.434-17.376z\"/></svg>",
	google: "<svg fill=\"none\" version=\"1.1\" viewBox=\"0 0 800 859.1\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m64.743 150.87c0-83.322 67.544-150.87 150.87-150.87h368.78c83.322 0 150.87 67.544 150.87 150.87v159.25c0 83.322-67.544 150.87-150.87 150.87h-368.78c-83.322 0-150.87-67.544-150.87-150.87z\" fill=\"#bbe2ff\" stroke-width=\"5.2384\"/><path d=\"m1.1859 216.83c-10.733-81.572 52.766-153.97 135.04-153.97h527.56c82.274 0 145.77 72.394 135.04 153.97l-32.127 244.15 32.127 244.15c10.733 81.572-52.761 153.97-135.04 153.97h-527.56c-82.274 0-145.77-72.394-135.04-153.97l32.127-244.15z\" fill=\"#3c90ff\" stroke-width=\"5.2384\"/><mask id=\"atcb-gcal-a\" x=\"19\" y=\"20\" width=\"154\" height=\"152\" maskUnits=\"userSpaceOnUse\"><path d=\"M 19.867,49.392 C 17.818,33.82 29.94,20 45.645,20 h 100.71 c 15.706,0 27.827,13.82 25.778,29.392 L 166,96 l 6.133,46.608 C 174.182,158.18 162.061,172 146.355,172 H 45.645 C 29.939,172 17.818,158.18 19.867,142.608 L 26,96 Z\" fill=\"#3c90ff\"/></mask><g transform=\"matrix(5.2384 0 0 5.2384 -102.89 -41.907)\" mask=\"url(#atcb-gcal-a)\"><path transform=\"matrix(1,0,0,-1,13,172)\" d=\"m0 0h166v76h-166z\" fill=\"url(#atcb-gcal-b)\"/></g><mask id=\"atcb-gcal-c\" x=\"19\" y=\"20\" width=\"154\" height=\"152\" maskUnits=\"userSpaceOnUse\"><path d=\"M 19.867,49.392 C 17.818,33.82 29.94,20 45.645,20 h 100.71 c 15.706,0 27.827,13.82 25.778,29.392 L 166,96 l 6.133,46.608 C 174.182,158.18 162.061,172 146.355,172 H 45.645 C 29.939,172 17.818,158.18 19.867,142.608 L 26,96 Z\" fill=\"#3186ff\"/></mask><g transform=\"matrix(5.2384 0 0 5.2384 -102.89 -41.907)\" mask=\"url(#atcb-gcal-c)\"><path d=\"m32 27.2c0-10.604 8.596-19.2 19.2-19.2h89.6c10.604 0 19.2 8.596 19.2 19.2v68.8h-128z\" fill=\"url(#atcb-gcal-d)\" filter=\"url(#atcb-gcal-e)\"/></g><path d=\"m291.84 656.56q-32.908 0-56.454-10.702-23.547-10.702-39.864-28.628-16.056-18.198-22.745-35.584-6.6894-17.386-5.3484-21.137a10.843 10.843 0 0 1 5.3484-5.8879l29.702-11.771q3.7402-1.8701 7.4909-0.53431 3.7402 1.0686 8.8267 12.305 5.3536 11.236 14.982 23.814a74.909 74.909 0 0 0 23.547 19.529q13.651 6.9566 33.709 6.9566 32.373 0 51.373-18.727 19.262-18.727 19.262-47.622 0-31.305-20.335-48.162-20.33-17.124-53.777-17.124h-28.088a9.9529 9.9529 0 0 1-6.9566-2.6716q-2.6716-2.944-2.6768-6.6894v-28.628q0-4.0178 2.6716-6.6894a9.5339 9.5339 0 0 1 6.9618-2.944h24.343q29.969 0 48.162-16.323 18.193-16.323 18.193-42.274 0-25.679-16.323-41.467-16.323-15.788-44.945-15.788-16.056 0-27.826 5.3536a60.241 60.241 0 0 0-20.335 14.982 118.91 118.91 0 0 0-14.715 19.801q-6.1499 10.168-9.9006 11.236-3.7402 0.80148-7.2237-1.3358l-28.093-13.646q-3.4783-1.8754-4.5469-5.888t6.4223-18.727q7.758-14.982 23.541-30.503a110.01 110.01 0 0 1 36.925-24.081q21.137-8.5648 49.23-8.5595 52.174 0 82.672 27.554 30.503 27.292 30.503 72.243 0 31.037-14.982 53.777-14.72 22.735-41.739 32.111v1.0686q32.64 9.6282 51.368 35.312 19 25.422 18.994 60.734 0 50.571-35.317 82.945-35.307 32.373-92.038 32.373zm268.47-6.1551q-4.5469 0-8.0304-3.4783a11.786 11.786 0 0 1-3.2059-8.2924v-297.52l-60.2 43.342q-3.2164 2.4097-7.4961 1.6082a10.267 10.267 0 0 1-6.417-4.0126l-17.391-24.62a10.372 10.372 0 0 1-1.8753-7.4909q0.80147-4.2745 4.2798-6.6842l106.75-76.255q1.341-1.0686 2.944-1.603 1.6082-0.80147 3.7454-0.80147h22.478q4.5469 0 7.2237 3.2111 2.944 2.9335 2.944 7.4909v363.33q0 4.8193-3.4783 8.2924a10.477 10.477 0 0 1-8.0304 3.4783z\" fill=\"#fff\" stroke-width=\"5.2384\"/><defs><linearGradient id=\"atcb-gcal-b\" x1=\"83\" x2=\"83\" y1=\"76\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#4fa0ff\" offset=\"0\"/><stop stop-color=\"#3186ff\" offset=\"1\"/></linearGradient><linearGradient id=\"atcb-gcal-d\" x1=\"89.06\" x2=\"89.06\" y1=\"21.75\" y2=\"96.39\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#a9a8ff\" offset=\"0\"/><stop stop-color=\"#3c90ff\" offset=\".8\"/></linearGradient><filter id=\"atcb-gcal-e\" x=\"20\" y=\"-4\" width=\"152\" height=\"112\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feGaussianBlur result=\"effect1_foregroundBlur_37330_7673\" stdDeviation=\"6\"/></filter></defs></svg>",
	ical: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4.5\" width=\"18\" height=\"17\" rx=\"3.5\" fill=\"none\"/><path fill=\"none\" d=\"M8 2.5v4M16 2.5v4M3 10.5h18M7.5 15h.008v.008H7.5V15Zm2.25 0h.008v.008H9.75V15ZM12 15h.008v.008H12V15Zm2.25 0h.008v.008h-.008V15Zm2.25 0h.008v.008H16.5V15ZM7.5 17.25h.008v.008H7.5v-.008Zm2.25 0h.008v.008H9.75v-.008Zm2.25 0h.008v.008H12v-.008Zm2.25 0h.008v.008h-.008v-.008Z\"/></svg>",
	msteams: "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 200 186.047\"><path d=\"M195.349 39.535a20.93 20.93 0 1 1-41.86 0 20.93 20.93 0 1 1 41.86 0zm-55.847 30.233h51.66A8.84 8.84 0 0 1 200 78.605v47.056c0 17.938-14.541 32.479-32.479 32.479h0-.154c-17.938.003-32.481-14.537-32.484-32.474v-.005-51.274a4.62 4.62 0 0 1 4.619-4.619z\" fill=\"#5059c9\"/><path d=\"M149.614 69.767H64.34c-4.823.119-8.637 4.122-8.526 8.944v53.67c-.673 28.941 22.223 52.957 51.163 53.665 28.94-.708 51.836-24.725 51.163-53.665v-53.67c.112-4.823-3.703-8.825-8.526-8.944zm-10.079-39.535a30.233 30.233 0 0 1-60.465 0 30.233 30.233 0 0 1 60.465 0z\" fill=\"#7b83eb\"/><path opacity=\".1\" d=\"M111.628 69.767v75.209c-.023 3.449-2.113 6.547-5.302 7.86-1.015.43-2.107.651-3.209.651H59.907l-1.628-4.651c-1.628-5.337-2.459-10.885-2.465-16.465V78.698c-.112-4.815 3.697-8.811 8.512-8.93z\"/><path opacity=\".2\" d=\"M106.977 69.767v79.86a8.241 8.241 0 0 1-.651 3.209c-1.313 3.189-4.412 5.279-7.86 5.302H62.093l-2.186-4.651a46.13 46.13 0 0 1-1.628-4.651 56.647 56.647 0 0 1-2.465-16.465V78.698c-.112-4.815 3.697-8.811 8.512-8.93z\"/><path opacity=\".2\" d=\"M102.326 69.767v70.558a8.58 8.58 0 0 1-8.512 8.512H58.279a56.647 56.647 0 0 1-2.465-16.465V78.698c-.112-4.815 3.697-8.811 8.512-8.93z\"/><path opacity=\".1\" d=\"M111.628 45.721v14.651l-2.326.093c-.791 0-1.535-.046-2.326-.093-1.57-.104-3.127-.353-4.651-.744a30.233 30.233 0 0 1-20.93-17.767 25.845 25.845 0 0 1-1.488-4.651h23.209c4.693.018 8.494 3.818 8.512 8.512z\"/><use xlink:href=\"#B\" opacity=\".2\" transform=\"scale(.08973306)\"/><path d=\"M106.977 50.372v10c-1.57-.104-3.127-.353-4.651-.744a30.233 30.233 0 0 1-20.93-17.767h17.07c4.693.018 8.494 3.818 8.512 8.512zm0 19.395v70.558a8.58 8.58 0 0 1-8.512 8.512H58.279a56.647 56.647 0 0 1-2.465-16.465V78.698c-.112-4.815 3.697-8.811 8.512-8.93z\" opacity=\".2\"/><path opacity=\".2\" d=\"M102.326 50.372v9.256a30.233 30.233 0 0 1-20.93-17.767h12.419c4.693.018 8.494 3.818 8.512 8.512z\"/><linearGradient id=\"A\" gradientUnits=\"userSpaceOnUse\" x1=\"17.776\" y1=\"35.199\" x2=\"84.55\" y2=\"150.848\"><stop offset=\"0\" stop-color=\"#5a62c3\"/><stop offset=\".5\" stop-color=\"#4d55bd\"/><stop offset=\"1\" stop-color=\"#3940ab\"/></linearGradient><path fill=\"url(#A)\" d=\"M8.526 41.86H93.8a8.53 8.53 0 0 1 8.526 8.526v85.274a8.53 8.53 0 0 1-8.526 8.526H8.526A8.53 8.53 0 0 1 0 135.66V50.386a8.53 8.53 0 0 1 8.526-8.526z\"/><path fill=\"#fff\" d=\"M73.6 74.316H56.553v46.419h-10.86V74.316H28.726v-9.005H73.6z\"/><defs><path id=\"B\" d=\"M1192.167 561.355v111.442c-17.496-1.161-34.848-3.937-51.833-8.293a336.92 336.92 0 0 1-233.25-198.003h190.228c52.304.198 94.656 42.55 94.855 94.854z\"/></defs></svg>",
	ms365: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 239.766\"><path d=\"M200 219.785l-.021-.012V20.591L128.615 0 .322 48.172 0 48.234.016 192.257l43.78-17.134V57.943l84.819-20.279-.012 172.285L.088 192.257l128.515 47.456v.053l71.376-19.753v-.227z\"/></svg>",
	outlookcom: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 175\"><path d=\"M178.725 0H71.275A8.775 8.775 0 0 0 62.5 8.775v9.975l60.563 18.75L187.5 18.75V8.775A8.775 8.775 0 0 0 178.725 0z\" fill=\"#0364b8\"/><path d=\"M197.813 96.281c.915-2.878 2.187-5.855 2.187-8.781-.002-1.485-.795-2.857-1.491-3.26l-68.434-38.99a9.37 9.37 0 0 0-9.244-.519c-.312.154-.614.325-.906.512l-67.737 38.6-.025.013-.075.044a4.16 4.16 0 0 0-2.088 3.6c.541 2.971 1.272 5.904 2.188 8.781l71.825 52.532z\" fill=\"#0a2767\"/><path d=\"M150 18.75h-43.75L93.619 37.5l12.631 18.75L150 93.75h37.5v-37.5z\" fill=\"#28a8ea\"/><path d=\"M150 18.75h37.5v37.5H150z\" fill=\"#50d9ff\"/><path d=\"M150 93.75l-43.75-37.5H62.5v37.5l43.75 37.5 67.7 11.05z\" fill=\"#0364b8\"/><path d=\"M106.25 56.25v37.5H150v-37.5zM150 93.75v37.5h37.5v-37.5zm-87.5-75h43.75v37.5H62.5z\" fill=\"#0078d4\"/><path d=\"M62.5 93.75h43.75v37.5H62.5z\" fill=\"#064a8c\"/><path d=\"M126.188 145.113l-73.706-53.75 3.094-5.438 68.181 38.825a3.3 3.3 0 0 0 2.625-.075l68.331-38.937 3.1 5.431z\" fill=\"#0a2767\" opacity=\".5\"/><path d=\"M197.919 91.106l-.088.05-.019.013-67.738 38.588c-2.736 1.764-6.192 1.979-9.125.569l23.588 31.631 51.588 11.257v-.001c2.434-1.761 3.876-4.583 3.875-7.587V87.5c.001 1.488-.793 2.862-2.081 3.606z\" fill=\"#1490df\"/><path d=\"M200 165.625v-4.613l-62.394-35.55-7.531 4.294a9.356 9.356 0 0 1-9.125.569l23.588 31.631 51.588 11.231v.025a9.362 9.362 0 0 0 3.875-7.588z\" opacity=\".05\"/><path d=\"M199.688 168.019l-68.394-38.956-1.219.688c-2.734 1.766-6.19 1.984-9.125.575l23.588 31.631 51.587 11.256v.001a9.38 9.38 0 0 0 3.562-5.187z\" opacity=\".1\"/><path d=\"M51.455 90.721c-.733-.467-1.468-1.795-1.455-3.221v78.125c-.007 5.181 4.194 9.382 9.375 9.375h131.25c1.395-.015 2.614-.366 3.813-.813.638-.258 1.252-.652 1.687-.974z\" fill=\"#28a8ea\"/><path d=\"M112.5 141.669V39.581a8.356 8.356 0 0 0-8.331-8.331H62.687v46.6l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031V150h54.169a8.356 8.356 0 0 0 8.331-8.331z\" opacity=\".1\"/><path d=\"M106.25 147.919V45.831a8.356 8.356 0 0 0-8.331-8.331H62.687v40.35l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031 68.75h47.919a8.356 8.356 0 0 0 8.331-8.331z\" opacity=\".2\"/><path d=\"M106.25 135.419V45.831a8.356 8.356 0 0 0-8.331-8.331H62.687v40.35l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031 56.25h47.919a8.356 8.356 0 0 0 8.331-8.331z\" opacity=\".2\"/><path d=\"M100 135.419V45.831a8.356 8.356 0 0 0-8.331-8.331H62.687v40.35l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031 56.25h41.669a8.356 8.356 0 0 0 8.331-8.331z\" opacity=\".2\"/><path d=\"M8.331 37.5h83.337A8.331 8.331 0 0 1 100 45.831v83.338a8.331 8.331 0 0 1-8.331 8.331H8.331A8.331 8.331 0 0 1 0 129.169V45.831A8.331 8.331 0 0 1 8.331 37.5z\" fill=\"#0078d4\"/><path d=\"M24.169 71.675a26.131 26.131 0 0 1 10.263-11.337 31.031 31.031 0 0 1 16.313-4.087 28.856 28.856 0 0 1 15.081 3.875 25.875 25.875 0 0 1 9.988 10.831 34.981 34.981 0 0 1 3.5 15.938 36.881 36.881 0 0 1-3.606 16.662 26.494 26.494 0 0 1-10.281 11.213 30 30 0 0 1-15.656 3.981 29.556 29.556 0 0 1-15.425-3.919 26.275 26.275 0 0 1-10.112-10.85 34.119 34.119 0 0 1-3.544-15.744 37.844 37.844 0 0 1 3.481-16.563zm10.938 26.613a16.975 16.975 0 0 0 5.769 7.463 15.069 15.069 0 0 0 9.019 2.719 15.831 15.831 0 0 0 9.631-2.806 16.269 16.269 0 0 0 5.606-7.481 28.913 28.913 0 0 0 1.787-10.406 31.644 31.644 0 0 0-1.687-10.538 16.681 16.681 0 0 0-5.413-7.75 14.919 14.919 0 0 0-9.544-2.956 15.581 15.581 0 0 0-9.231 2.744 17.131 17.131 0 0 0-5.9 7.519 29.85 29.85 0 0 0-.044 21.5z\" fill=\"#fff\"/></svg>",
	yahoo: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 177.803\"><path d=\"M0 43.284h38.144l22.211 56.822 22.5-56.822h37.135L64.071 177.803H26.694l15.308-35.645L.001 43.284zm163.235 45.403H121.64L158.558 0 200 .002zm-30.699 8.488c12.762 0 23.108 10.346 23.108 23.106s-10.345 23.106-23.108 23.106a23.11 23.11 0 0 1-23.104-23.106 23.11 23.11 0 0 1 23.104-23.106z\"/></svg>",
	close: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><path d=\"M2.321 13.529a7.927 7.927 0 0 1 0-11.208 7.927 7.927 0 0 1 11.208 0l86.471 86.471L186.47 2.321a7.927 7.927 0 0 1 11.209 0 7.927 7.927 0 0 1 0 11.208l-86.474 86.469 86.472 86.473a7.927 7.927 0 0 1-11.209 11.208l-86.471-86.471-86.469 86.471a7.927 7.927 0 0 1-11.208-11.208l86.471-86.473z\"/></svg>",
	warning: "<svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m100 0c27.613 0 52.613 11.195 70.711 29.293 18.094 18.094 29.289 43.098 29.289 70.707 0 27.613-11.195 52.613-29.289 70.711-18.098 18.094-43.098 29.289-70.711 29.289-27.609 0-52.613-11.195-70.707-29.289-18.098-18.098-29.293-43.098-29.293-70.711 0-27.609 11.195-52.613 29.293-70.707 18.094-18.098 43.098-29.293 70.707-29.293zm57.66 42.34c-14.758-14.754-35.145-23.883-57.66-23.883-22.516 0-42.902 9.1289-57.66 23.883-14.754 14.758-23.883 35.145-23.883 57.66 0 22.516 9.1289 42.902 23.883 57.66 14.758 14.754 35.145 23.883 57.66 23.883 22.516 0 42.902-9.1289 57.66-23.883 14.754-14.758 23.883-35.145 23.883-57.66 0-22.516-9.1289-42.902-23.883-57.66z\" fill=\"#f44336\" fill-rule=\"nonzero\" stroke-width=\".39062\"/><g transform=\"matrix(3.8384 0 0 3.8384 2277.8 -576.85)\" style=\"shape-inside:url(#rect7396);white-space:pre\" aria-label=\"!\"><path d=\"m-563.8 161.59-0.65341 20.185h-5.8381l-0.65341-20.185zm-3.5796 29.503q-1.5199 0-2.6136-1.0795-1.0796-1.0796-1.0796-2.6136 0-1.5057 1.0796-2.571 1.0938-1.0796 2.6136-1.0796 1.4631 0 2.571 1.0796 1.1222 1.0653 1.1222 2.571 0 1.0227-0.52557 1.8608-0.51137 0.83807-1.3494 1.3352-0.82387 0.49715-1.8182 0.49715z\"/></g></svg>",
	checkmark: "<svg version=\"1.1\" viewBox=\"0 0 87.41 79.72\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m2.076 33.666s6.0748-0.59297 17.413 4.2983c9.3883 4.5751 11.891 8.3955 11.891 8.3955 5.38-8.65 11.11-16.6 17.16-23.9 10.412-12.578 24.613-22.448 24.613-22.448l14.257-0.012228s-19.308 19.294-32.483 38.51-22.877 41.21-22.877 41.21-9.3948-18.164-14.53-24.53-10.77-11.59-17.52-16.22z\" fill=\"#45b555\"/></svg>",
	rsvp: "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 104.31 122.88\"><g><path d=\"M25.85,63.15c-0.04-0.12-0.08-0.28-0.1-0.42c-0.22-1.89-0.43-3.98-0.62-5.78c-0.26-2.64-0.55-5.69-0.76-7.83 c-0.14-1.45-0.6-2.83-1.27-3.86c-0.45-0.66-0.95-1.15-1.51-1.39c-0.45-0.18-1-0.2-1.57,0.02c-0.78,0.3-1.65,0.93-2.62,2.03 c-0.86,0.98-1.53,2.29-2.09,3.68c-0.79,2.03-1.26,4.19-1.45,5.67c-0.02,0.1-0.02,0.18-0.06,0.26L8.42,86.07 c-0.08,0.4-0.24,0.76-0.48,1.04c-1.81,2.33-2.95,4.33-3.28,5.95c-0.24,1.19,0,2.15,0.79,2.9l19.8,19.8 c1.26,1.21,2.72,1.97,4.47,2.29c1.91,0.36,4.14,0.16,6.7-0.54c0.04,0,0.1-0.02,0.14-0.02c0.97-0.26,2.24-0.57,3.46-0.88 c5.31-1.29,9.94-2.43,14.23-6.33l5.52-5.76c0.05-0.1,0.14-0.18,0.22-0.26s0.62-0.62,1.35-1.31c3.78-3.69,8.45-8.25,5.61-12.24 l-2.21-2.21c-1.07,1.04-2.21,2.05-3.3,3.02c-1,0.88-1.93,1.69-2.78,2.55c-0.91,0.91-2.38,0.91-3.3,0c-0.91-0.92-0.91-2.38,0-3.3 c0.86-0.86,1.91-1.79,3-2.76c3.74-3.3,8.03-7.07,5.73-10.38l-2.19-2.19c-0.12-0.12-0.22-0.26-0.31-0.4c-1.26,1.29-2.64,2.52-4,3.72 c-1,0.88-1.93,1.69-2.78,2.55c-0.91,0.91-2.38,0.91-3.3,0s-0.91-2.38,0-3.3c0.86-0.86,1.91-1.79,3-2.76 c3.74-3.3,8.03-7.07,5.73-10.38l-2.19-2.19c-0.16-0.16-0.28-0.31-0.38-0.5l-6.42,6.42c-0.91,0.91-2.38,0.91-3.3,0s-0.91-2.38,0-3.3 l17.22-17.25c2.88-2.88,3.54-5.88,2.78-8.15c-0.28-0.83-0.74-1.57-1.31-2.14s-1.31-1.03-2.14-1.31c-2.24-0.74-5.23-0.06-8.19,2.9 l-30.2,30.2c-0.91,0.91-2.38,0.91-3.3,0s-0.91-2.38,0-3.3l3.07-3.07L25.85,63.15L25.85,63.15L25.85,63.15z M83.23,24.31 c-1.22,1.3-3.24,1.34-4.52,0.14c-1.3-1.22-1.34-3.24-0.14-4.52l8.82-9.39c1.22-1.3,3.25-1.34,4.52-0.14 c1.3,1.22,1.34,3.24,0.14,4.52L83.23,24.31L83.23,24.31L83.23,24.31L83.23,24.31z M43.96,23.65c1.3,1.22,1.34,3.25,0.14,4.52 c-1.22,1.3-3.25,1.34-4.52,0.14l-9.4-8.82c-1.29-1.23-1.33-3.25-0.14-4.52c1.22-1.3,3.25-1.34,4.52-0.14L43.96,23.65L43.96,23.65 L43.96,23.65z M63.69,15.96c0.05,1.76-1.34,3.24-3.09,3.3s-3.24-1.34-3.3-3.09L56.91,3.3c-0.06-1.75,1.34-3.24,3.09-3.3 c1.76-0.05,3.24,1.34,3.29,3.09L63.69,15.96L63.69,15.96L63.69,15.96z M76.88,63.31c-1.3-1.22-1.34-3.25-0.14-4.52 c1.22-1.3,3.24-1.34,4.52-0.14l9.39,8.82c1.3,1.22,1.34,3.24,0.14,4.52c-1.22,1.3-3.24,1.34-4.52,0.14L76.88,63.31L76.88,63.31 L76.88,63.31z M88.36,44.35c-1.75,0.06-3.24-1.34-3.3-3.09c-0.05-1.75,1.34-3.24,3.09-3.3l12.86-0.43c1.75-0.06,3.24,1.34,3.3,3.09 s-1.34,3.24-3.09,3.3L88.36,44.35L88.36,44.35L88.36,44.35z M60.88,58.97c0.17,0.1,0.34,0.22,0.5,0.38l2.29,2.29 c0.12,0.12,0.24,0.28,0.34,0.42c2.57,3.52,2.17,6.66,0.42,9.52c0.31,0.12,0.62,0.29,0.86,0.54l2.29,2.29 c0.12,0.12,0.24,0.28,0.34,0.42c2.76,3.8,2.07,7.12,0,10.14c0.1,0.05,0.17,0.14,0.28,0.24l2.29,2.29c0.12,0.12,0.24,0.28,0.34,0.42 c5.31,7.26-1.02,13.42-6.1,18.39l-1.31,1.31l-5.67,5.95l-0.18,0.17c-5.19,4.71-10.33,5.97-16.28,7.42c-1,0.24-2,0.5-3.4,0.86 c-0.04,0-0.06,0.02-0.1,0.02c-3.22,0.88-6.14,1.09-8.76,0.62c-2.66-0.48-4.97-1.67-6.9-3.56L2.31,99.29 c-2-1.93-2.69-4.31-2.12-7.14c0.43-2.26,1.75-4.77,3.81-7.47L9.3,54.74v-0.12c0.24-1.71,0.78-4.24,1.71-6.68 c0.71-1.83,1.67-3.62,2.92-5.07c1.51-1.71,3-2.76,4.47-3.32c1.81-0.69,3.54-0.6,5.07,0.06c1.43,0.6,2.64,1.69,3.56,3.08 c1.12,1.67,1.85,3.8,2.05,6.02c0.16,1.83,0.48,4.85,0.78,7.81l0.24,2.47L53,36.07c4.4-4.4,9.16-5.27,12.97-4.02 c1.53,0.5,2.88,1.33,4,2.45s1.95,2.47,2.45,4c1.26,3.8,0.4,8.63-3.92,12.95l-7.59,7.59L60.88,58.97L60.88,58.97L60.88,58.97z\"/></g></svg>"
};
var resultStore = null;
var resultChannel = {
	open() {
		resultStore = { value: "" };
	},
	active() {
		return resultStore !== null;
	},
	push(value) {
		if (resultStore) resultStore.value = value;
	},
	close() {
		const value = resultStore ? resultStore.value : "";
		resultStore = null;
		return value;
	}
};
//#endregion
//#region src/core/store.ts
var instances = /* @__PURE__ */ new Map();
var activeId = "";
function setActiveButton(id) {
	activeId = id;
}
function getActiveButton() {
	return activeId;
}
function createButtonInstance(id, config, optionStates) {
	instances.set(id, {
		config,
		optionStates
	});
}
function getButtonInstance(id) {
	return instances.get(id);
}
function getOptionStates(id) {
	return instances.get(id).optionStates;
}
function deleteButtonInstance(id) {
	instances.delete(id);
}
//#endregion
//#region src/core/decorate-options.ts
function decorate_data_options(data) {
	const { options, source } = determine_options_source(data);
	const processedOptions = process_options(options, data);
	let newOptions = processedOptions.newOptions;
	let iCalGiven = processedOptions.iCalGiven;
	const appleGiven = processedOptions.appleGiven;
	newOptions = handle_special_google_calendar_case(data, newOptions);
	({newOptions, iCalGiven} = ensure_fallback_options(newOptions, iCalGiven));
	const normalizedSourceOptions = options.map((option) => normalize_option_name(option));
	const mobileOptionsUsedWithIcs = source !== "general" && (normalizedSourceOptions.includes("ical") || normalizedSourceOptions.includes("apple"));
	newOptions = adjust_platform_specific_options(newOptions, data, iCalGiven, appleGiven, mobileOptionsUsedWithIcs);
	newOptions.sort();
	data.options = newOptions;
	return data;
}
function determine_options_source(data) {
	let source = "general";
	let options = data.options || ["ical"];
	if (isIOS() || data.fakeIOS) {
		if (data.optionsIOS && data.optionsIOS.length > 0) {
			source = "ios";
			options = data.optionsIOS;
		} else if (data.optionsMobile && data.optionsMobile.length > 0) {
			source = "mobile";
			options = data.optionsMobile;
		}
	} else if ((isAndroid() || data.fakeMobile || data.fakeAndroid) && data.optionsMobile && data.optionsMobile.length > 0) {
		source = "mobile";
		options = data.optionsMobile;
	}
	return {
		options,
		source
	};
}
function process_options(theOptions, data) {
	const newOptions = [];
	let iCalGiven = false;
	let appleGiven = false;
	for (let i = 0; i < theOptions.length; i++) {
		const optionName = normalize_option_name(theOptions[`${i}`]);
		if (optionName === "apple") appleGiven = true;
		if (optionName === "ical") iCalGiven = true;
		if (should_skip_option(optionName, data)) continue;
		newOptions.push(optionName);
	}
	return {
		newOptions,
		iCalGiven,
		appleGiven
	};
}
function normalize_option_name(option) {
	return option.split("|")[0].toLowerCase().replace("microsoft", "ms").replace(/\./, "");
}
function should_skip_option(optionName, data) {
	return is_platform_invalid_option(optionName, data) || is_recurrence_invalid_option(optionName, data) || is_subscription_invalid_option(optionName, data) || is_microsoft_mobile_subscription_case(optionName, data);
}
function is_platform_invalid_option(optionName, data) {
	const isIOSWithInvalidOption = !!((isIOS() || data.fakeIOS) && iosInvalidOptions.includes(optionName) && (!data.optionsIOS || data.optionsIOS.length === 0) && (!data.optionsMobile || data.optionsMobile.length === 0));
	const isAndroidWithInvalidOption = !!((isAndroid() || data.fakeMobile || data.fakeAndroid) && androidInvalidOptions.includes(optionName) && (!data.optionsMobile || data.optionsMobile.length === 0));
	return isIOSWithInvalidOption || isAndroidWithInvalidOption;
}
function is_recurrence_invalid_option(optionName, data) {
	if (!data.recurrence || data.recurrence === "") return false;
	const isInvalidForRecurrence = !validRecurrenceOptions.includes(optionName);
	const isGoogleOnIOS = !!((isIOS() || data.fakeIOS) && optionName === "google");
	return isInvalidForRecurrence || isGoogleOnIOS;
}
function is_subscription_invalid_option(optionName, data) {
	return !!(data.subscribe && invalidSubscribeOptions.includes(optionName));
}
function is_microsoft_mobile_subscription_case(optionName, data) {
	return !!((isMobile() || data.fakeMobile) && data.subscribe && (optionName === "ms365" || optionName === "outlookcom"));
}
function handle_special_google_calendar_case(data, newOptions) {
	if (data.subscribe && data.icsFile && data.icsFile.startsWith("https://calendar.google.com/calendar/") && !data.icsFile.endsWith(".ics")) return ["google"];
	return newOptions;
}
function ensure_fallback_options(newOptions, iCalGiven) {
	if (newOptions.length === 0) {
		newOptions.push("ical");
		iCalGiven = true;
	}
	return {
		newOptions,
		iCalGiven
	};
}
function adjust_platform_specific_options(options, data, iCalGiven, appleGiven, mobileOptionsUsed = false) {
	if (!mobileOptionsUsed) {
		if ((isIOS() || data.fakeIOS) && iCalGiven && !appleGiven) {
			options.push("apple");
			options = options.filter((option) => option !== "ical");
		} else if ((isAndroid() || data.fakeMobile || data.fakeAndroid) && appleGiven && !iCalGiven) {
			options.push("ical");
			options = options.filter((option) => option !== "apple");
		}
	}
	return options;
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/objectSpread2.js
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
//#endregion
//#region src/core/dates.ts
function generate_time(data, style = "delimiters", targetCal = "general", addTimeZoneOffset = false) {
	if (data.startTime && data.startTime !== "" && data.endTime && data.endTime !== "") {
		const newStartDate = /* @__PURE__ */ new Date(data.startDate + "T" + data.startTime + ":00.000+00:00");
		if (!data.endDate) data.endDate = data.startDate;
		const newEndDate = /* @__PURE__ */ new Date(data.endDate + "T" + data.endTime + ":00.000+00:00");
		const durationMS = newEndDate - newStartDate;
		const durationHours = Math.floor(durationMS / 1e3 / 60 / 60);
		const durationMinutes = Math.floor((durationMS - durationHours * 60 * 60 * 1e3) / 1e3 / 60 % 60);
		const durationString = (function() {
			if (durationHours < 10) return "0" + durationHours + ":" + ("0" + durationMinutes).slice(-2);
			return durationHours + ":" + ("0" + durationMinutes).slice(-2);
		})();
		if ((targetCal == "ical" || targetCal == "google") && !atcbTimeZonesToUtc.test(data.timeZone)) return {
			start: format_datetime(newStartDate, "clean", true, true),
			end: format_datetime(newEndDate, "clean", true, true),
			duration: durationString,
			allday: false
		};
		const offsetStart = tzlib_get_offset(data.timeZone, data.startDate, data.startTime);
		const offsetEnd = tzlib_get_offset(data.timeZone, data.endDate, data.endTime);
		if (addTimeZoneOffset) {
			const formattedOffsetStart = offsetStart.slice(0, 3) + ":" + offsetStart.slice(3);
			const formattedOffsetEnd = offsetEnd.slice(0, 3) + ":" + offsetEnd.slice(3);
			return {
				start: newStartDate.toISOString().replace(".000Z", formattedOffsetStart),
				end: newEndDate.toISOString().replace(".000Z", formattedOffsetEnd),
				duration: durationString,
				allday: false
			};
		}
		const calcOffsetStart = parseInt(offsetStart[0] + 1) * -1 * ((parseInt(offsetStart.substring(1, 3)) * 60 + parseInt(offsetStart.substring(3, 5))) * 60 * 1e3);
		const calcOffsetEnd = parseInt(offsetEnd[0] + 1) * -1 * ((parseInt(offsetEnd.substring(1, 3)) * 60 + parseInt(offsetEnd.substring(3, 5))) * 60 * 1e3);
		newStartDate.setTime(newStartDate.getTime() + calcOffsetStart);
		newEndDate.setTime(newEndDate.getTime() + calcOffsetEnd);
		return {
			start: format_datetime(newStartDate, style),
			end: format_datetime(newEndDate, style),
			duration: durationString,
			allday: false
		};
	} else {
		const startDate = data.startDate.split("-");
		const endDate = data.endDate ? data.endDate.split("-") : startDate;
		const newStartDate = new Date(Date.UTC(startDate[0], startDate[1] - 1, startDate[2], 12, 0, 0));
		const newEndDate = new Date(Date.UTC(endDate[0], endDate[1] - 1, endDate[2], 12, 0, 0));
		if (targetCal === "google" || targetCal === "microsoft" && !isMobile() || targetCal === "msteams" || targetCal === "ical") newEndDate.setDate(newEndDate.getDate() + 1);
		if (targetCal === "msteams") {
			if (isMobile()) {
				const offset = newStartDate.getTimezoneOffset();
				const formattedOffset = (function() {
					if (offset < 0) return "+" + ("0" + Math.abs(offset / 60)).slice(-2) + ":" + ("0" + Math.abs(offset % 60)).slice(-2);
					else return "-" + ("0" + Math.abs(offset / 60)).slice(-2) + ":" + ("0" + Math.abs(offset % 60)).slice(-2);
				})();
				return {
					start: format_datetime(newStartDate, style, false, true) + "T00:00:00" + formattedOffset,
					end: format_datetime(newEndDate, style, false, true) + "T00:00:00" + formattedOffset,
					allday: true
				};
			}
			return {
				start: format_datetime(newStartDate, style, false, true) + "+00:00",
				end: format_datetime(newEndDate, style, false, true) + "+00:00",
				allday: true
			};
		}
		return {
			start: format_datetime(newStartDate, style, false),
			end: format_datetime(newEndDate, style, false),
			allday: true
		};
	}
}
function format_datetime(datetime, style = "delimiters", includeTime = true, removeZ = false) {
	const regex = (function() {
		if (includeTime) {
			if (style == "clean") return /(-|:|(\.\d{3}))/g;
			return /(\.\d{3})/g;
		}
		if (style == "clean") return /(-|T(\d{2}:\d{2}:\d{2}\.\d{3})Z)/g;
		return /T(\d{2}:\d{2}:\d{2}\.\d{3})Z/g;
	})();
	return removeZ ? datetime.toISOString().replace(regex, "").replace("Z", "") : datetime.toISOString().replace(regex, "");
}
function offsetToMilliseconds(offset) {
	const sign = offset[0] === "+" ? 1 : -1;
	const hours = parseInt(offset.substring(1, 3), 10);
	const minutes = parseInt(offset.substring(3, 5), 10);
	return (hours * 60 + minutes) * sign * 6e4;
}
function translate_via_time_zone(date, time, baseTimeZone, targetTimeZone) {
	if (baseTimeZone === "currentBrowser") baseTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const dateTime = /* @__PURE__ */ new Date(`${date}T${time}:00Z`);
	const offset = tzlib_get_offset(baseTimeZone, date, time);
	const dateTimeUTC = new Date(dateTime.getTime() - offsetToMilliseconds(offset));
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: targetTimeZone,
		hourCycle: "h23"
	}).format(dateTimeUTC).split(", ");
}
function generate_timestring(dates, language = "en", subEvent = "all", decorate = false, browserTimeOverride = false, enforceYear = false, hideTimeZone = false) {
	if (decorate) dates = decorate_data_dates({ dates }).dates;
	let timeZoneInfoStart, timeZoneInfoEnd;
	let timeZoneDisplayStart, timeZoneDisplayEnd;
	let formattedTimeStart;
	let formattedTimeEnd;
	const timeBlocks = [];
	let timeZoneInfoStringStart = "";
	let timeZoneInfoStringEnd = "";
	const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (subEvent === "all") {
		formattedTimeStart = generate_time(dates[0]);
		formattedTimeEnd = generate_time(dates[dates.length - 1]);
		timeZoneInfoStart = browserTimeOverride ? browserTimezone : dates[0].timeZone;
		timeZoneInfoEnd = browserTimeOverride ? browserTimezone : dates[dates.length - 1].timeZone;
		timeZoneDisplayStart = browserTimeOverride ? browserTimezone : dates[0].timeZoneDisplay || timeZoneInfoStart;
		timeZoneDisplayEnd = browserTimeOverride ? browserTimezone : dates[dates.length - 1].timeZoneDisplay || timeZoneInfoEnd;
	} else {
		formattedTimeStart = generate_time(dates[`${subEvent}`]);
		formattedTimeEnd = formattedTimeStart;
		timeZoneInfoStart = browserTimeOverride ? browserTimezone : dates[`${subEvent}`].timeZone;
		timeZoneInfoEnd = timeZoneInfoStart;
		timeZoneDisplayStart = browserTimeOverride ? browserTimezone : dates[`${subEvent}`].timeZoneDisplay || timeZoneInfoStart;
		timeZoneDisplayEnd = timeZoneDisplayStart;
	}
	const startDateInfo = new Date(formattedTimeStart.start);
	const endDateInfo = new Date(formattedTimeEnd.end);
	if (formattedTimeStart.allday) timeZoneInfoStart = "GMT";
	if (formattedTimeEnd.allday) timeZoneInfoEnd = "GMT";
	const magicLocationPhrases = [
		"global",
		"world-wide",
		"worldwide",
		"online"
	];
	if ((function() {
		let i = 0;
		let j = dates.length - 1;
		if (subEvent != "all") i = j = subEvent;
		for (; i <= j; i++) if (!(function() {
			if (dates[`${i}`].location && dates[`${i}`].location !== "") {
				if (magicLocationPhrases.includes(dates[`${i}`].location.toLowerCase().trim())) return true;
			}
			return false;
		})() && !dates[`${i}`].onlineEvent) return false;
		return true;
	})()) timeZoneInfoStart = timeZoneInfoEnd = browserTimezone;
	else {
		if (!formattedTimeStart.allday && browserTimezone !== timeZoneInfoStart && timeZoneInfoStart !== timeZoneInfoEnd) timeZoneInfoStringStart = "(" + timeZoneDisplayStart + ")";
		if (!formattedTimeEnd.allday && browserTimezone !== timeZoneInfoEnd || timeZoneInfoStart !== timeZoneInfoEnd) timeZoneInfoStringEnd = "(" + timeZoneDisplayEnd + ")";
	}
	const now = /* @__PURE__ */ new Date();
	const dropYearStart = (function() {
		if (!enforceYear && startDateInfo.getFullYear() === now.getFullYear()) return true;
		return false;
	})();
	const dropYearEnd = (function() {
		if (!enforceYear && endDateInfo.getFullYear() === now.getFullYear()) return true;
		return false;
	})();
	const formatOptionsStart = get_format_options(timeZoneInfoStart, dropYearStart, language);
	const formatOptionsEnd = get_format_options(timeZoneInfoEnd, dropYearEnd, language);
	if (startDateInfo.toLocaleDateString(language, formatOptionsEnd.DateLong) === endDateInfo.toLocaleDateString(language, formatOptionsEnd.DateLong)) {
		if (formattedTimeStart.allday) {
			if (!dropYearStart) timeBlocks.push(startDateInfo.toLocaleDateString(language, formatOptionsStart.DateLong));
		} else {
			let timeString;
			if (dropYearStart) timeString = startDateInfo.toLocaleString(language, formatOptionsStart.Time);
			else timeString = startDateInfo.toLocaleString(language, formatOptionsStart.DateTimeLong);
			if (language === "en") timeString = timeString.replace(/:00/, "");
			timeBlocks.push(timeString);
			if (timeZoneInfoStringStart !== "" && !hideTimeZone) timeBlocks.push(timeZoneInfoStringStart);
			timeBlocks.push("-");
			timeString = endDateInfo.toLocaleTimeString(language, formatOptionsEnd.Time);
			if (language === "en") timeString = timeString.replace(/:00/, "");
			timeBlocks.push(timeString);
			if (timeZoneInfoStringEnd !== "" && !hideTimeZone) timeBlocks.push(timeZoneInfoStringEnd);
		}
	} else {
		if (formattedTimeStart.allday) timeBlocks.push(startDateInfo.toLocaleDateString(language, formatOptionsStart.DateLong));
		else {
			let timeString;
			if (dropYearStart) timeString = startDateInfo.toLocaleString(language, formatOptionsStart.Time);
			else timeString = startDateInfo.toLocaleString(language, formatOptionsStart.DateTimeLong);
			if (language === "en") timeString = timeString.replace(/:00/, "");
			timeBlocks.push(timeString);
		}
		if (timeZoneInfoStringStart !== "" && !hideTimeZone) timeBlocks.push(timeZoneInfoStringStart);
		timeBlocks.push("-");
		if (formattedTimeEnd.allday) timeBlocks.push(endDateInfo.toLocaleDateString(language, formatOptionsEnd.DateLong));
		else {
			let timeString = endDateInfo.toLocaleString(language, formatOptionsEnd.DateTimeLong);
			if (language === "en") timeString = timeString.replace(/:00/, "");
			timeBlocks.push(timeString);
		}
		if (timeZoneInfoStringEnd !== "" && !hideTimeZone) timeBlocks.push(timeZoneInfoStringEnd);
	}
	return timeBlocks;
}
function get_format_options(timeZoneInfo, dropYear = false, language = "en") {
	timeZoneInfo = map_special_time_zones(timeZoneInfo);
	const hoursFormat = (function() {
		if (language === "en") return "h12";
		return "h23";
	})();
	if (dropYear) return {
		DateLong: {
			timeZone: timeZoneInfo,
			month: "short",
			day: "numeric"
		},
		DateTimeLong: {
			timeZone: timeZoneInfo,
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hourCycle: hoursFormat
		},
		Time: {
			timeZone: timeZoneInfo,
			hour: "numeric",
			minute: "2-digit",
			hourCycle: hoursFormat
		}
	};
	return {
		DateLong: {
			timeZone: timeZoneInfo,
			year: "numeric",
			month: "numeric",
			day: "numeric"
		},
		DateTimeLong: {
			timeZone: timeZoneInfo,
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hourCycle: hoursFormat
		},
		Time: {
			timeZone: timeZoneInfo,
			hour: "numeric",
			minute: "2-digit",
			hourCycle: hoursFormat
		}
	};
}
function parseByWeekdayTokens(rawByDay) {
	const tokens = rawByDay ? rawByDay.toString().split(",") : [];
	const mapWeekdayCode = (wd) => {
		switch (wd) {
			case "SU": return 0;
			case "MO": return 1;
			case "TU": return 2;
			case "WE": return 3;
			case "TH": return 4;
			case "FR": return 5;
			case "SA": return 6;
			default: return;
		}
	};
	const plainWeekdays = [];
	const ordinals = [];
	for (const tok of tokens) {
		const t = tok.trim().toUpperCase();
		if (t.length < 2) continue;
		const day = mapWeekdayCode(t.slice(-2));
		if (day === void 0) continue;
		const prefix = t.slice(0, t.length - 2);
		if (prefix) {
			let sign = 1;
			let digits = prefix;
			if (digits[0] === "+") digits = digits.slice(1);
			else if (digits[0] === "-") {
				sign = -1;
				digits = digits.slice(1);
			}
			if (!digits || digits.length > 2) continue;
			if (!(typeof digits === "string" && /^\d+$/.test(digits))) continue;
			const abs = parseInt(digits, 10);
			if (abs < 1 || abs > 53) continue;
			ordinals.push({
				n: sign * abs,
				day
			});
		} else plainWeekdays.push(day);
	}
	return {
		plainWeekdays,
		ordinals
	};
}
function parseRRule(rruleStr, deep = true) {
	const parts = rruleStr.replace("RRULE:", "").split(";").reduce((acc, part) => {
		const [key, value] = part.split("=");
		acc[`${key}`] = value;
		return acc;
	}, {});
	if (!parts.FREQ) throw new Error("RRULE must have FREQ");
	parts.FREQ = parts.FREQ.toUpperCase();
	parts.INTERVAL = parts.INTERVAL ? parseInt(parts.INTERVAL.toString(), 10) : 1;
	parts.COUNT = parts.COUNT ? parseInt(parts.COUNT.toString(), 10) : null;
	if (parts.UNTIL) {
		const untilStr = parts.UNTIL.toString();
		parts.UNTIL = deep ? new Date(Date.UTC(parseInt(untilStr.slice(0, 4), 10), parseInt(untilStr.slice(4, 6), 10) - 1, parseInt(untilStr.slice(6, 8), 10), parseInt(untilStr.slice(9, 11) || "0", 10), parseInt(untilStr.slice(11, 13) || "0", 10))) : untilStr;
	}
	if (parts.BYWEEKDAY || parts.BYDAY) {
		var _ref;
		const rawByDay = (_ref = parts.BYWEEKDAY || parts.BYDAY) === null || _ref === void 0 ? void 0 : _ref.toString();
		if (deep) {
			const { plainWeekdays, ordinals } = parseByWeekdayTokens(rawByDay);
			parts.BYWEEKDAY = plainWeekdays.length ? plainWeekdays : null;
			parts.BYDAY_ORDINALS = ordinals.length ? ordinals : null;
		} else parts.BYWEEKDAY = parts.BYWEEKDAY || parts.BYDAY;
	}
	parts.BYMONTH = deep && parts.BYMONTH ? parts.BYMONTH.toString().split(",").map((n) => parseInt(n, 10)) : parts.BYMONTH;
	parts.BYYEARDAY = deep && parts.BYYEARDAY ? parts.BYYEARDAY.toString().split(",").map((n) => parseInt(n, 10)) : parts.BYYEARDAY;
	parts.BYMONTHDAY = deep && parts.BYMONTHDAY ? parts.BYMONTHDAY.toString().split(",").map((n) => parseInt(n, 10)) : parts.BYMONTHDAY;
	parts.BYWEEKNO = deep && parts.BYWEEKNO ? parts.BYWEEKNO.toString().split(",").map((n) => parseInt(n, 10)) : parts.BYWEEKNO;
	if (parts.BYHOUR) delete parts.BYHOUR;
	return parts;
}
function pad2(n) {
	return String(n).padStart(2, "0");
}
function toIsoOffset(off) {
	if (!off || off === "Z" || off === "+0000" || off === "-0000" || off === "+00:00" || off === "-00:00") return "Z";
	const raw = String(off).replace(/^GMT/i, "");
	if (/^[+-]\d{2}:\d{2}$/.test(raw)) return raw;
	if (/^[+-]\d{4}$/.test(raw)) return `${raw.slice(0, 3)}:${raw.slice(3)}`;
	const sign = raw.startsWith("-") ? "-" : "+";
	const digits = raw.replace(/\D/g, "").padStart(4, "0").slice(0, 4);
	return `${sign}${digits.slice(0, 2)}:${digits.slice(2)}`;
}
var tzPartsFormatterCache = /* @__PURE__ */ new Map();
function getTzPartsFormatter(timeZone) {
	const key = map_special_time_zones(timeZone || "UTC");
	const cached = tzPartsFormatterCache.get(key);
	if (cached) return cached;
	const fmt = new Intl.DateTimeFormat("en-US", {
		timeZone: key,
		hour12: false,
		hourCycle: "h23",
		weekday: "short",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	tzPartsFormatterCache.set(key, fmt);
	return fmt;
}
function getTzParts(dateObj, timeZone) {
	if (!(dateObj instanceof Date) || !isFinite(dateObj.getTime())) return null;
	try {
		const parts = getTzPartsFormatter(timeZone).formatToParts(dateObj);
		const get = (t) => {
			var _parts$find;
			return ((_parts$find = parts.find((p) => p.type === t)) === null || _parts$find === void 0 ? void 0 : _parts$find.value) || "";
		};
		const weekdayShort = get("weekday");
		let weekday = null;
		switch (weekdayShort) {
			case "Sun":
				weekday = 0;
				break;
			case "Mon":
				weekday = 1;
				break;
			case "Tue":
				weekday = 2;
				break;
			case "Wed":
				weekday = 3;
				break;
			case "Thu":
				weekday = 4;
				break;
			case "Fri":
				weekday = 5;
				break;
			case "Sat": weekday = 6;
		}
		const year = parseInt(get("year"), 10);
		const month = parseInt(get("month"), 10);
		const day = parseInt(get("day"), 10);
		const hour = parseInt(get("hour"), 10);
		const minute = parseInt(get("minute"), 10);
		const second = parseInt(get("second"), 10);
		if (![
			year,
			month,
			day,
			hour,
			minute,
			second
		].every((n) => Number.isFinite(n))) return null;
		if (weekday === null) weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
		return {
			year,
			month,
			day,
			hour,
			minute,
			second,
			weekday
		};
	} catch (_unused) {
		return null;
	}
}
function getUtcParts(dateObj) {
	return {
		year: dateObj.getUTCFullYear(),
		month: dateObj.getUTCMonth() + 1,
		day: dateObj.getUTCDate(),
		hour: dateObj.getUTCHours(),
		minute: dateObj.getUTCMinutes(),
		second: dateObj.getUTCSeconds(),
		weekday: dateObj.getUTCDay()
	};
}
function getDayOfYearFromYmd(year, month0, day) {
	const start = Date.UTC(year, 0, 1);
	return Math.floor((Date.UTC(year, month0, day) - start) / 864e5) + 1;
}
function getWeekNumberFromYmd(year, month0, day) {
	const d = new Date(Date.UTC(year, month0, day));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
}
function enrichParts(parts) {
	const month0 = parts.month - 1;
	return _objectSpread2(_objectSpread2({}, parts), {}, {
		month0,
		dayOfYear: getDayOfYearFromYmd(parts.year, month0, parts.day),
		weekNumber: getWeekNumberFromYmd(parts.year, month0, parts.day)
	});
}
function getPartsForTimeZone(dateObj, timeZone) {
	return enrichParts((timeZone ? getTzParts(dateObj, timeZone) : null) || getUtcParts(dateObj));
}
function addLocalDays(dateObj, days, timeZone, hhmm, dateParts = null) {
	const p = dateParts || getPartsForTimeZone(dateObj, timeZone);
	const month0 = Number.isFinite(p.month0) ? p.month0 : Number.isFinite(p.month) ? p.month - 1 : 0;
	const baseUtc = Date.UTC(p.year, month0, p.day) + days * 864e5;
	const d = new Date(baseUtc);
	const dateStr = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
	const safeTimeZone = timeZone || "UTC";
	try {
		const off = tzlib_get_offset(safeTimeZone, dateStr, hhmm);
		return /* @__PURE__ */ new Date(`${dateStr}T${hhmm}:00${toIsoOffset(off)}`);
	} catch (_unused2) {
		return new Date(dateObj.getTime() + days * 864e5);
	}
}
function matchesFreq(date, rrule, startDate, timeZone, dateParts, startParts) {
	const interval = parseInt(rrule.INTERVAL.toString(), 10) || 1;
	const dp = dateParts || getPartsForTimeZone(date, timeZone);
	const sp = startParts || getPartsForTimeZone(startDate, timeZone);
	switch (rrule.FREQ) {
		case "YEARLY": return (dp.year - sp.year) % interval === 0;
		case "MONTHLY": return ((dp.year - sp.year) * 12 + (dp.month0 - sp.month0)) % interval === 0;
		case "WEEKLY": {
			const daysW = Math.floor((Date.UTC(dp.year, dp.month0, dp.day) - Date.UTC(sp.year, sp.month0, sp.day)) / 864e5);
			return Math.floor(daysW / 7) % interval === 0;
		}
		case "DAILY": return Math.floor((Date.UTC(dp.year, dp.month0, dp.day) - Date.UTC(sp.year, sp.month0, sp.day)) / 864e5) % interval === 0;
		default: return true;
	}
}
function matchesRRule(date, rrule, startDate, timeZone, dateParts, startParts) {
	if (!matchesBYRules(date, rrule, timeZone, dateParts)) return false;
	if (!matchesImplicitRules(date, rrule, startDate, timeZone, dateParts, startParts)) return false;
	return true;
}
function matchesBYRules(date, rrule, timeZone, dateParts) {
	const dp = dateParts || getPartsForTimeZone(date, timeZone);
	if (rrule.BYMONTH && !rrule.BYMONTH.includes(dp.month)) return false;
	if (rrule.BYYEARDAY && !rrule.BYYEARDAY.includes(dp.dayOfYear)) return false;
	if (rrule.BYMONTHDAY && !rrule.BYMONTHDAY.includes(dp.day)) return false;
	if (rrule.BYWEEKNO && !rrule.BYWEEKNO.includes(dp.weekNumber)) return false;
	const plainWeekdayOk = !!(rrule.BYWEEKDAY && rrule.BYWEEKDAY.length) ? rrule.BYWEEKDAY.includes(dp.weekday) : null;
	let ordinalOk = null;
	if (rrule.BYDAY_ORDINALS && Array.isArray(rrule.BYDAY_ORDINALS) && rrule.BYDAY_ORDINALS.length > 0) {
		const dow = dp.weekday;
		const year = dp.year;
		const month0 = dp.month0;
		const dayOfYear = dp.dayOfYear;
		const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
		const daysInYear = getDayOfYearFromYmd(year, 11, 31);
		const isNthWeekdayOfMonth = (n, weekday) => {
			if (n === 0) return false;
			if (n > 0) {
				const targetDay = 1 + (weekday - new Date(Date.UTC(year, month0, 1)).getUTCDay() + 7) % 7 + (n - 1) * 7;
				return targetDay >= 1 && targetDay <= daysInMonth && dp.day === targetDay;
			} else {
				const lastOfMonth = new Date(Date.UTC(year, month0 + 1, 0));
				const backOffset = (lastOfMonth.getUTCDay() - weekday + 7) % 7;
				const targetDay = lastOfMonth.getUTCDate() - backOffset + (n + 1) * 7;
				return targetDay >= 1 && targetDay <= daysInMonth && dp.day === targetDay;
			}
		};
		const isNthWeekdayOfYear = (n, weekday) => {
			if (n === 0) return false;
			if (n > 0) {
				const targetDoy = 1 + (weekday - new Date(Date.UTC(year, 0, 1)).getUTCDay() + 7) % 7 + (n - 1) * 7;
				return targetDoy >= 1 && targetDoy <= daysInYear && dayOfYear === targetDoy;
			} else {
				const backOffset = (new Date(Date.UTC(year, 11, 31)).getUTCDay() - weekday + 7) % 7;
				const targetDoy = daysInYear - backOffset + (n + 1) * 7;
				return targetDoy >= 1 && targetDoy <= daysInYear && dayOfYear === targetDoy;
			}
		};
		ordinalOk = rrule.BYDAY_ORDINALS.some(({ n, day }) => {
			if (day !== dow) return false;
			if (rrule.FREQ === "MONTHLY") return isNthWeekdayOfMonth(n, day);
			if (rrule.FREQ === "YEARLY") {
				if (rrule.BYMONTH && rrule.BYMONTH.length > 0) return isNthWeekdayOfMonth(n, day);
				if (!rrule.BYWEEKNO) return isNthWeekdayOfYear(n, day);
				return false;
			}
			return false;
		});
	}
	if (plainWeekdayOk === false && ordinalOk === false) return false;
	if (plainWeekdayOk === false && ordinalOk === null) return false;
	if (ordinalOk === false && plainWeekdayOk === null) return false;
	return true;
}
function matchesImplicitRules(date, rrule, startDate, timeZone, dateParts, startParts) {
	const dp = dateParts || getPartsForTimeZone(date, timeZone);
	const sp = startParts || getPartsForTimeZone(startDate, timeZone);
	if (dp.hour !== sp.hour) return false;
	const hasByWeekdayAny = !!(rrule.BYWEEKDAY && rrule.BYWEEKDAY.length) || !!(rrule.BYDAY_ORDINALS && rrule.BYDAY_ORDINALS.length);
	if (rrule.FREQ === "WEEKLY" && !hasByWeekdayAny && dp.weekday !== sp.weekday) return false;
	if (rrule.FREQ === "MONTHLY" && !rrule.BYMONTHDAY && !hasByWeekdayAny && dp.day !== sp.day) return false;
	if (rrule.FREQ === "YEARLY" && !rrule.BYMONTH && dp.month0 !== sp.month0) return false;
	if (rrule.FREQ === "YEARLY" && !rrule.BYMONTHDAY && !hasByWeekdayAny && !rrule.BYYEARDAY && !rrule.BYWEEKNO && dp.day !== sp.day) return false;
	return true;
}
function getNextOccurrence(rruleStr, startDateTime, diff, allday, tzid = "UTC") {
	const rrule = parseRRule(rruleStr);
	const startParts = getPartsForTimeZone(startDateTime, tzid);
	const baseHhmm = `${pad2(startParts.hour)}:${pad2(startParts.minute)}`;
	if (allday && rrule.UNTIL instanceof Date) {
		const untilEod = new Date(rrule.UNTIL);
		untilEod.setUTCHours(23, 59, 59, 999);
		rrule.UNTIL = untilEod;
	}
	const upperEnd = new Date((/* @__PURE__ */ new Date()).getTime() - diff);
	let currentDate = startDateTime;
	const occurrences = [];
	let count = 0;
	let maxIterations = 1e4;
	let skippedOccurrences = 0;
	{
		var _rrule$INTERVAL;
		const ffInterval = parseInt(((_rrule$INTERVAL = rrule.INTERVAL) === null || _rrule$INTERVAL === void 0 ? void 0 : _rrule$INTERVAL.toString()) || "1", 10) || 1;
		const freq = rrule.FREQ;
		const bounded = Boolean(rrule.COUNT) || Boolean(rrule.UNTIL);
		const plainCountable = !Boolean(rrule.BYDAY || rrule.BYMONTH || rrule.BYMONTHDAY || rrule.BYYEARDAY || rrule.BYWEEKNO || rrule.BYSETPOS) && (freq === "DAILY" || freq === "WEEKLY" || freq === "MONTHLY" && startParts.day <= 28 || freq === "YEARLY" && !(startParts.month0 === 1 && startParts.day === 29));
		if ((freq === "DAILY" || freq === "WEEKLY" || freq === "MONTHLY" || freq === "YEARLY") && (!bounded || plainCountable)) {
			const targetParts = getPartsForTimeZone(rrule.UNTIL instanceof Date && rrule.UNTIL < upperEnd ? rrule.UNTIL : upperEnd, tzid);
			const startUtcDay = Date.UTC(startParts.year, startParts.month0, startParts.day);
			const targetUtcDay = Date.UTC(targetParts.year, targetParts.month0, targetParts.day);
			const periodsToSkip = (function() {
				if (freq === "DAILY" || freq === "WEEKLY") {
					const periodDays = (freq === "WEEKLY" ? 7 : 1) * ffInterval;
					return Math.floor((targetUtcDay - startUtcDay) / 864e5 / periodDays) - 2;
				}
				if (freq === "MONTHLY") {
					const months = (targetParts.year - startParts.year) * 12 + (targetParts.month0 - startParts.month0);
					return Math.floor(months / ffInterval) - 2;
				}
				return Math.floor((targetParts.year - startParts.year) / ffInterval) - 2;
			})();
			const cappedPeriods = rrule.COUNT ? Math.min(periodsToSkip, Math.max(0, rrule.COUNT - 2)) : periodsToSkip;
			if (cappedPeriods > 0) {
				const jumped = (function() {
					if (freq === "DAILY" || freq === "WEEKLY") return addLocalDays(startDateTime, cappedPeriods * (freq === "WEEKLY" ? 7 : 1) * ffInterval, tzid, baseHhmm);
					const monthsTotal = startParts.month0 + (freq === "MONTHLY" ? cappedPeriods * ffInterval : 0);
					const dateStr = `${startParts.year + (freq === "YEARLY" ? cappedPeriods * ffInterval : 0) + Math.floor(monthsTotal / 12)}-${pad2((monthsTotal % 12 + 12) % 12 + 1)}-${pad2(startParts.day)}`;
					try {
						return /* @__PURE__ */ new Date(`${dateStr}T${baseHhmm}:00${toIsoOffset(tzlib_get_offset(tzid, dateStr, baseHhmm))}`);
					} catch (_unused3) {
						return null;
					}
				})();
				if (jumped && isFinite(jumped.getTime()) && jumped > startDateTime) {
					currentDate = jumped;
					skippedOccurrences = bounded ? cappedPeriods : 0;
					count = skippedOccurrences;
				}
			}
		}
	}
	while (true) {
		if (rrule.UNTIL && currentDate > rrule.UNTIL) break;
		const currentParts = getPartsForTimeZone(currentDate, tzid);
		if (matchesFreq(currentDate, rrule, startDateTime, tzid, currentParts, startParts) && matchesRRule(currentDate, rrule, startDateTime, tzid, currentParts, startParts)) {
			occurrences.push(currentDate);
			count++;
			if (rrule.COUNT && count >= rrule.COUNT) break;
			if (!rrule.COUNT && !rrule.UNTIL && (allday ? currentDate >= upperEnd : currentDate > upperEnd)) break;
		}
		if (--maxIterations <= 0) break;
		currentDate = addLocalDays(currentDate, 1, tzid, baseHhmm, currentParts);
	}
	let nextDate = null;
	let countDate = 0;
	for (const d of occurrences) {
		if (allday ? d >= upperEnd : d > upperEnd) {
			nextDate = d;
			break;
		}
		countDate++;
	}
	if (!nextDate) {
		if (occurrences.length > 1) {
			nextDate = occurrences[occurrences.length - 1];
			countDate = countDate - 1;
		} else if (occurrences.length === 1) nextDate = occurrences[0];
		else {
			nextDate = startDateTime;
			countDate = 1;
		}
	}
	return {
		nextOccurrence: nextDate,
		adjustedCount: rrule.COUNT ? rrule.COUNT - (countDate + skippedOccurrences) : count - (countDate + skippedOccurrences)
	};
}
function map_special_time_zones(timeZone) {
	if (!timeZone) return "GMT";
	return {
		PT: "America/Los_Angeles",
		MT: "America/Denver",
		CT: "America/Chicago",
		ET: "America/New_York",
		CET: "Europe/Brussels",
		CST6CDT: "America/Chicago",
		EET: "Europe/Athens",
		EST: "America/Panama",
		EST5EDT: "America/New_York",
		HST: "Pacific/Honolulu",
		MET: "Europe/Brussels",
		MST: "America/Phoenix",
		MST7MDT: "America/Denver",
		PST8PDT: "America/Los_Angeles",
		WET: "Europe/Lisbon"
	}[`${timeZone.toUpperCase()}`] || timeZone;
}
//#endregion
//#region src/core/text.ts
function escape_html_text(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escape_html(value) {
	return escape_html_text(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safe_html(content) {
	return rewrite_html_elements(content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&lt;br\s*\/?&gt;/gi, "<br>"));
}
function secure_content(data, isJSON = true) {
	const cleanedUp = (isJSON ? JSON.stringify(data) : data.toString()).replace(/(<(?!br)([^>]+)>)/gi, "");
	if (isJSON) {
		const parsed = JSON.parse(cleanedUp);
		strip_unsafe_keys(parsed);
		return parsed;
	} else return cleanedUp;
}
function strip_unsafe_keys(node) {
	if (!node || typeof node !== "object") return node;
	for (const key of [
		"__proto__",
		"constructor",
		"prototype"
	]) if (Object.prototype.hasOwnProperty.call(node, key)) delete node[`${key}`];
	for (const value of Object.values(node)) strip_unsafe_keys(value);
	return node;
}
function secure_url(url, throwError = true) {
	if (url && url.match(/((\.\.\/)|(\.\.\\)|(%2e%2e%2f)|(%252e%252e%252f)|(%2e%2e\/)|(%252e%252e\/)|(\.\.%2f)|(\.\.%252f)|(%2e%2e%5c)|(%252e%252e%255c)|(%2e%2e\\)|(%252e%252e\\)|(\.\.%5c)|(\.\.%255c)|(\.\.%c0%af)|(\.\.%25c0%25af)|(\.\.%c1%9c)|(\.\.%25c1%259c))/gi)) {
		if (throwError) console.error("Seems like the generated URL includes at least one security issue and got blocked. Please check the calendar button parameters!");
		return false;
	}
	const scheme = url ? url.replace(/[\u0000-\u0020\u007f-\u009f]/g, "").match(/^([a-z][a-z0-9+.-]*):/i) : null;
	if (scheme) {
		const schemeName = scheme[1].toLowerCase();
		if (!([
			"http",
			"https",
			"webcal",
			"webcals",
			"mailto",
			"intent"
		].includes(schemeName) || schemeName === "data" && /^data:text\/calendar[;,]/i.test(url.trim()))) {
			if (throwError) console.error("Seems like the generated URL includes at least one security issue and got blocked. Please check the calendar button parameters!");
			return false;
		}
	}
	return true;
}
function rewrite_html_elements(content, clear = false, iCalBreaks = false) {
	content = content.replace(/\[p\]\s*\[\/p\]/gi, "[br]");
	content = content.replace(/\{p\}\s*\{\/p\}/gi, "{br}");
	if (clear) {
		if (iCalBreaks) content = content.replace(/(\[br\s?\/?\]|\{br\s?\/?\}|(\[\/p\](?=.))|(\{\/p\}(?=.)))/gi, "\\n");
		else content = content.replace(/(\[br\s?\/?\]|\{br\s?\/?\}|(\[\/p\](?=.))|(\{\/p\}(?=.)))/gi, " ");
		content = content.replace(/\[url\](.+?)\[\/url\]/gi, (match, p1) => {
			return p1.split("|")[0];
		});
		content = content.replace(/\{url\}(.+?)\{\/url\}/gi, (match, p1) => {
			return p1.split("|")[0];
		});
		content = content.replace(/\[\/?(hr|[pbui]|strong|em|li|ul|ol|h\d)\]/gi, "");
		content = content.replace(/\{\/?(hr|[pbui]|strong|em|li|ul|ol|h\d)\}/gi, "");
		content = content.replace(/&(?:nbsp|#160|#xa0);/gi, "\xA0");
		content = content.replace(/&[#a-z0-9]{1,9};/gi, "");
	} else {
		content = content.replace(/\[url\]((?:(?!\[\/url\]).)*)\[\/url\]/gi, function(match, p1) {
			return parse_url_code(p1);
		});
		content = content.replace(/\{url\}((?:(?!\[\/url\]).)*)\{\/url\}/gi, function(match, p1) {
			return parse_url_code(p1);
		});
		content = content.replace(/\[(\/)?(br|hr|[pbui]|strong|em|li|ul|ol|h\d)(\s?\/?)\]/gi, "<$1$2$3>");
		content = content.replace(/\{(\/)?(br|hr|[pbui]|strong|em|li|ul|ol|h\d)(\s?\/?)\}/gi, "<$1$2$3>");
	}
	return content;
}
function parse_url_code(input) {
	const urlText = input.split("|");
	const url = (urlText[0] || "").trim();
	const text = (function() {
		if (urlText.length > 1 && urlText[1] != "") return urlText[1];
		else return url;
	})();
	const scheme = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, "").match(/^([a-z][a-z0-9+.-]*):/i);
	if (scheme && ![
		"http",
		"https",
		"webcal",
		"webcals",
		"mailto"
	].includes(scheme[1].toLowerCase())) return escape_html_text(text);
	return "<a href=\"" + escape_html(url) + "\" target=\"" + defaultTarget + "\" rel=\"noopener\">" + escape_html_text(text) + "</a>";
}
function rewrite_ical_text(content, inQuotes = false) {
	if (inQuotes) content = content.replace(/"/g, "");
	else content = content.replace(/\\/g, "\\\\").replace(/(,|;)/g, "\\$1").replace(/\\\\n/g, "\\n");
	return content;
}
function format_ical_lines(content) {
	const contentArr = content.split("\r\n");
	const result = [];
	for (const line of contentArr) {
		if (!line || line.length <= 65) {
			result.push(line);
			continue;
		}
		let currentLine = "";
		let position = 0;
		const foldedLines = [];
		while (position < line.length) {
			const char = line.charAt(position);
			const isHighSurrogate = char.charCodeAt(0) >= 55296 && char.charCodeAt(0) <= 56319;
			const isEscapedChar = position > 0 && line.charAt(position - 1) === "\\";
			if ((currentLine + char).length > 65 && !isHighSurrogate && !isEscapedChar) {
				foldedLines.push(currentLine);
				currentLine = "";
			}
			currentLine += char;
			position++;
			if (isHighSurrogate && position < line.length) {
				currentLine += line.charAt(position);
				position++;
			}
		}
		if (currentLine.length > 0) foldedLines.push(currentLine);
		result.push(foldedLines[0]);
		for (let i = 1; i < foldedLines.length; i++) result.push(" " + foldedLines[`${i}`]);
	}
	return result.join("\r\n");
}
//#endregion
//#region src/core/pure-util.ts
function generate_uuid() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
function apply_transformation(value, transform) {
	if (!transform || !value) return value;
	switch (transform) {
		case "upper": return value.toString().toUpperCase();
		case "lower": return value.toString().toLowerCase();
		default: return value;
	}
}
//#endregion
//#region src/core/decorate-recurrence.ts
function decorate_data_rrule(data) {
	data.recurrence = data.recurrence.replace(/\s+/g, "").toUpperCase();
	if (/^RRULE:/i.test(data.recurrence)) {
		data.recurrence_simplified = false;
		const rruleParts = parseRRule(data.recurrence, false);
		data.recurrence_until = rruleParts.UNTIL;
		data.recurrence_count = rruleParts.COUNT;
		data.recurrence_byDay = rruleParts.BYDAY;
		data.recurrence_byMonth = rruleParts.BYMONTH;
		data.recurrence_byMonthDay = rruleParts.BYMONTHDAY;
		data.recurrence_interval = rruleParts.INTERVAL;
		data.recurrence_frequency = rruleParts.FREQ;
	} else {
		data.recurrence_simplified = true;
		if (!data.recurrence_interval || data.recurrence_interval === "") data.recurrence_interval = 1;
		if (!data.recurrence_weekstart || Number(data.recurrence_weekstart === "") | Number(data.recurrence_weekstart.length > 2)) data.recurrence_weekstart = "MO";
		data.recurrence_frequency = data.recurrence;
		data.recurrence = "RRULE:FREQ=" + data.recurrence + ";WKST=" + data.recurrence_weekstart + ";INTERVAL=" + data.recurrence_interval;
		if (data.recurrence_until && data.recurrence_until !== "") {
			data.recurrence_until = data.recurrence_until.replace(/[-:]/g, "");
			if (data.recurrence_until.length < 9) data.recurrence_until += "T235959Z";
			data.recurrence = data.recurrence + ";UNTIL=" + data.recurrence_until;
		}
		if (data.recurrence_count && data.recurrence_count !== "") data.recurrence = data.recurrence + ";COUNT=" + data.recurrence_count;
		if (data.recurrence_byDay && data.recurrence_byDay !== "") data.recurrence = data.recurrence + ";BYDAY=" + data.recurrence_byDay;
		if (data.recurrence_byMonth && data.recurrence_byMonth !== "") data.recurrence = data.recurrence + ";BYMONTH=" + data.recurrence_byMonth;
		if (data.recurrence_byMonthDay && data.recurrence_byMonthDay !== "") data.recurrence = data.recurrence + ";BYMONTHDAY=" + data.recurrence_byMonthDay;
	}
	return data;
}
function decorate_data_recurring_events(data) {
	const startDate = data.dates[0].startDate;
	const startTime = data.dates[0].startTime;
	const endDate = data.dates[0].endDate || startDate;
	const endTime = data.dates[0].endTime || "";
	const tzid = data.dates[0].timeZone || "UTC";
	const diff = (function() {
		if (endTime && endTime !== "" && startTime && startTime !== "") {
			const origStart = startTime && startTime !== "" ? /* @__PURE__ */ new Date(`${startDate}T${startTime}:00${toIsoOffset(tzlib_get_offset(tzid, startDate, startTime))}`) : /* @__PURE__ */ new Date(`${startDate}T00:00:00${toIsoOffset(tzlib_get_offset(tzid, startDate, "00:00"))}`);
			return (endTime && endTime !== "" ? /* @__PURE__ */ new Date(`${endDate}T${endTime}:00${toIsoOffset(tzlib_get_offset(tzid, endDate, endTime))}`) : /* @__PURE__ */ new Date(`${endDate}T00:00:00${toIsoOffset(tzlib_get_offset(tzid, endDate, "00:00"))}`)).getTime() - origStart.getTime();
		}
	})() || 0;
	function toIsoOffset(off) {
		if (!off || off === "Z" || off === "+0000" || off === "-0000" || off === "+00:00" || off === "-00:00") return "Z";
		const raw = String(off).replace(/^GMT/i, "");
		if (/^[+-]\d{2}:\d{2}$/.test(raw)) return raw;
		if (/^[+-]\d{4}$/.test(raw)) return `${raw.slice(0, 3)}:${raw.slice(3)}`;
		const sign = raw.startsWith("-") ? "-" : "+";
		const digits = raw.replace(/\D/g, "").padStart(4, "0").slice(0, 4);
		return `${sign}${digits.slice(0, 2)}:${digits.slice(2)}`;
	}
	const offset = startTime && startTime !== "" ? tzlib_get_offset(tzid, startDate, startTime) : "";
	const startDateTime = (function() {
		if (startTime && startTime !== "") {
			const isoOff = toIsoOffset(offset);
			return /* @__PURE__ */ new Date(`${startDate}T${startTime}:00${isoOff}`);
		}
		const localMidnightOffset = toIsoOffset(tzlib_get_offset(tzid, startDate, "00:00"));
		return /* @__PURE__ */ new Date(`${startDate}T00:00:00${localMidnightOffset}`);
	})();
	const isAllDay = !(startTime && startTime !== "");
	const occurenceData = getNextOccurrence(data.recurrence, startDateTime, diff, isAllDay, tzid);
	if (!occurenceData || !occurenceData.nextOccurrence) return data;
	function formatInTz(dateObj, timeZone, includeTime) {
		if (!(dateObj instanceof Date) || !isFinite(dateObj.getTime())) return {
			date: "",
			time: ""
		};
		try {
			const opts = includeTime ? {
				timeZone,
				hour12: false,
				hourCycle: "h23",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit"
			} : {
				timeZone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit"
			};
			const parts = new Intl.DateTimeFormat("en-CA", opts).formatToParts(dateObj);
			const get = (t) => {
				var _parts$find;
				return ((_parts$find = parts.find((p) => p.type === t)) === null || _parts$find === void 0 ? void 0 : _parts$find.value) || "";
			};
			return {
				date: `${get("year")}-${get("month")}-${get("day")}`,
				time: includeTime ? `${get("hour")}:${get("minute")}` : ""
			};
		} catch (_unused) {
			return {
				date: "",
				time: ""
			};
		}
	}
	const nextLocalDate = formatInTz(occurenceData.nextOccurrence, tzid, false).date;
	if (nextLocalDate) {
		data.startDate = nextLocalDate;
		if (startTime) data.startTime = startTime;
	} else return data;
	const newStartInstant = startTime ? /* @__PURE__ */ new Date(`${data.startDate}T${startTime}:00${toIsoOffset(tzlib_get_offset(tzid, data.startDate, startTime))}`) : /* @__PURE__ */ new Date(`${data.startDate}T00:00:00${toIsoOffset(tzlib_get_offset(tzid, data.startDate, "00:00"))}`);
	const nextEndLocal = formatInTz(new Date(newStartInstant.getTime() + diff), tzid, !!(endTime && endTime !== ""));
	if (nextEndLocal.date) {
		data.endDate = nextEndLocal.date;
		if (endTime && endTime !== "") data.endTime = nextEndLocal.time;
	}
	if (data.recurrence_count && data.recurrence_count !== "" || data.recurrence_until && data.recurrence_until !== "") {
		if (occurenceData.adjustedCount < 2) {
			data.recurrence = "";
			data.recurrence_frequency = "";
			data.recurrence_interval = "";
		} else {
			data.recurrence_count = occurenceData.adjustedCount;
			data.recurrence = data.recurrence.replace(/;?COUNT=\d+/i, ";COUNT=" + data.recurrence_count);
			if (data.recurrence_until && data.recurrence_until !== "") {
				data.recurrence_until = "";
				data.recurrence = data.recurrence.replace(/;?UNTIL=\w+/i, ";COUNT=" + data.recurrence_count);
				if (data.dates && data.dates[0].recurrence) data.dates[0].recurrence = data.dates[0].recurrence.replace(/;?UNTIL=\w+/i, ";COUNT=" + data.recurrence_count);
			}
		}
	}
	return data;
}
//#endregion
//#region src/core/decorate-dates.ts
function decorate_data_dates(data) {
	if (!data.dates || !Array.isArray(data.dates)) data.dates = [{ name: data.name }];
	let cfg = data;
	if (cfg.recurrence && cfg.recurrence !== "") {
		cfg = decorate_data_rrule(cfg);
		cfg = move_root_values_into_dates(cfg, 0);
		cfg = dates_cleanup(cfg, 0);
		cfg = decorate_data_recurring_events(cfg);
	}
	if (cfg.recurrence && cfg.recurrence !== "") cfg.dates[0].recurrence = cfg.recurrence;
	for (let i = 0; i < cfg.dates.length; i++) {
		cfg = move_root_values_into_dates(cfg, i);
		cfg = dates_cleanup(cfg, i);
		cfg = generate_unique_uid(cfg, i);
		cfg = transform_strings(cfg, i);
		cfg = decorate_data_description(cfg, i);
		cfg = replace_custom_variables(cfg, i);
		cfg = set_online_event_flag(cfg, i);
	}
	[
		"description",
		"startDate",
		"startTime",
		"endDate",
		"endTime",
		"timeZone",
		"useUserTZ",
		"location",
		"status",
		"sequence",
		"availability",
		"organizer",
		"attendee",
		"icsCreated",
		"icsUpdated"
	].forEach((prop) => {
		delete cfg[`${prop}`];
	});
	cfg = decorate_data_button_status_handling(cfg);
	const now = /* @__PURE__ */ new Date();
	for (const dateEntry of cfg.dates) {
		if (!dateEntry.icsCreated || dateEntry.icsCreated === "") dateEntry.icsCreated = format_datetime(now, "clean", true);
		if (!dateEntry.icsUpdated || dateEntry.icsUpdated === "") dateEntry.icsUpdated = format_datetime(now, "clean", true);
	}
	if (cfg.dates.length > 1) cfg.dates.sort((a, b) => a.timestamp - b.timestamp);
	return cfg;
}
function move_root_values_into_dates(data, i) {
	const dateEntry = data.dates[`${i}`];
	const properties = [
		"description",
		"startDate",
		"startTime",
		"endDate",
		"endTime",
		"timeZone",
		"useUserTZ",
		"location",
		"status",
		"sequence",
		"availability",
		"organizer",
		"attendee",
		"icsReminder",
		"icsUrl",
		"icsCategories",
		"icsClass",
		"icsPriority",
		"icsGeo",
		"icsAttach",
		"icsCreated",
		"icsUpdated"
	];
	if (data.dates.length === 1) properties.unshift("name");
	properties.forEach((prop) => {
		if (data[`${prop}`] && data[`${prop}`] !== "" || prop === "sequence" && data[`${prop}`] === 0) dateEntry[`${prop}`] = data[`${prop}`];
	});
	return data;
}
function dates_cleanup(data, i) {
	const dateEntry = data.dates[`${i}`];
	const cleanedUpDates = date_cleanup(dateEntry);
	dateEntry.startDate = cleanedUpDates.startDate;
	dateEntry.endDate = cleanedUpDates.endDate;
	dateEntry.startTime = cleanedUpDates.startTime;
	dateEntry.endTime = cleanedUpDates.endTime;
	dateEntry.timeZoneDisplay = cleanedUpDates.timeZone;
	dateEntry.timeZone = map_special_time_zones(cleanedUpDates.timeZone);
	dateEntry.timestamp = date_specials_calculation("timestamp", dateEntry.startDate, dateEntry.startTime, dateEntry.timeZone);
	dateEntry.overdue = date_specials_calculation("overdue", dateEntry.endDate, dateEntry.endTime, dateEntry.timeZone);
	return data;
}
function generate_unique_uid(data, i) {
	const dateEntry = data.dates[`${i}`];
	if (!dateEntry.uid) {
		if (i === 0 && data.uid && data.uid !== "") dateEntry.uid = data.uid;
		else if (data.uid && data.uid !== "") dateEntry.uid = `${data.uid}-${i + 1}`;
		else dateEntry.uid = generate_uuid();
	}
	return data;
}
function transform_strings(data, i) {
	const dateEntry = data.dates[`${i}`];
	dateEntry.status = apply_transformation(dateEntry.status, "lower");
	dateEntry.availability = apply_transformation(dateEntry.availability, "lower");
	dateEntry.icsClass = apply_transformation(dateEntry.icsClass, "lower");
	return data;
}
function decorate_data_description(data, i) {
	const cleanDescription = (desc) => desc.replace(/(\\r\\n|\\n|\\r|<br(\s*\/?)>)/g, "");
	let description = data.dates[`${i}`].description;
	if (description) {
		description = cleanDescription(description);
		const descriptionHtmlFree = rewrite_html_elements(description, true);
		const descriptionHtmlFreeICal = rewrite_html_elements(description, true, true);
		description = rewrite_html_elements(description);
		data.dates[`${i}`] = _objectSpread2(_objectSpread2({}, data.dates[`${i}`]), {}, {
			description,
			descriptionHtmlFree,
			descriptionHtmlFreeICal
		});
	} else data.dates[`${i}`].descriptionHtmlFree = data.dates[`${i}`].descriptionHtmlFreeICal = data.dates[`${i}`].description = "";
	return data;
}
function set_online_event_flag(data, i) {
	const dateEntry = data.dates[`${i}`];
	if (dateEntry.location && dateEntry.location.startsWith("http")) dateEntry.onlineEvent = true;
	else dateEntry.onlineEvent = false;
	return data;
}
function replace_custom_variables(data, i) {
	if (!data.customVar) return data;
	const dateEntry = data.dates[`${i}`];
	for (const key in data.customVar) {
		const value = data.customVar[`${key}`];
		dateEntry.name = replace_placeholder(dateEntry.name, key, value);
		dateEntry.location = replace_placeholder(dateEntry.location, key, value);
		dateEntry.description = replace_placeholder(dateEntry.description, key, value);
	}
	return data;
}
function replace_placeholder(text, key, value) {
	const placeholder = "%%" + key.replace(/[^\w\-.]/g, "") + "%%";
	if (!text) return text;
	return text.replace(new RegExp(placeholder, "gi"), value);
}
function date_cleanup(dateTimeData) {
	function isValidDateFormat(dateStr) {
		return /^\d\d\d\d-\d\d-\d\d(?:T\d\d:\d\d)?(?::\d\d)?(?:.\d\d\d)?Z?(?:\+(?:\d|\d\d|\d\d\d|\d\d\d\d))?$/i.test(dateStr);
	}
	function isValidTodayFormat(dateStr) {
		return /^today(?:\+(?:\d|\d\d|\d\d\d|\d\d\d\d))?$/i.test(dateStr);
	}
	if (!dateTimeData.endDate || dateTimeData.endDate === "") dateTimeData.endDate = dateTimeData.startDate;
	["start", "end"].forEach(function(point) {
		const dateStr = dateTimeData[`${point}Date`];
		if (!isValidDateFormat(dateStr) && !isValidTodayFormat(dateStr)) dateTimeData[`${point}Date`] = "badly-formed";
		else {
			if (/\+/.test(dateStr) || isValidTodayFormat(dateStr)) {
				const timeZone = dateTimeData.timeZone === "currentBrowser" || dateTimeData.useUserTZ ? Intl.DateTimeFormat().resolvedOptions().timeZone || "GMT" : map_special_time_zones(dateTimeData.timeZone || "GMT");
				dateTimeData[`${point}Date`] = date_calculation(dateStr, timeZone);
			}
			if (dateTimeData[`${point}Date`]) {
				const tmpSplitStartDate = dateTimeData[`${point}Date`].split("T");
				if (tmpSplitStartDate[1]) {
					dateTimeData[`${point}Date`] = tmpSplitStartDate[0];
					dateTimeData[`${point}Time`] = tmpSplitStartDate[1];
				}
			}
			if (dateTimeData[`${point}Time`] && dateTimeData[`${point}Time`].length > 5) dateTimeData[`${point}Time`] = dateTimeData[`${point}Time`].substring(0, 5);
		}
	});
	if (dateTimeData.timeZone === "currentBrowser" || dateTimeData.useUserTZ) {
		let browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "GMT";
		const validTimeZones = tzlib_get_timezones();
		if (!validTimeZones.includes(browserTimezone)) {
			browserTimezone = map_special_time_zones(browserTimezone);
			if (!validTimeZones.includes(browserTimezone)) browserTimezone = "GMT";
		}
		if (dateTimeData.useUserTZ && dateTimeData.startTime && dateTimeData.startTime !== "" && dateTimeData.endTime && dateTimeData.endTime !== "") {
			const newStartDateTime = translate_via_time_zone(dateTimeData.startDate, dateTimeData.startTime, dateTimeData.timeZone, browserTimezone);
			const newEndDateTime = translate_via_time_zone(dateTimeData.endDate, dateTimeData.endTime, dateTimeData.timeZone, browserTimezone);
			dateTimeData.startDate = newStartDateTime[0];
			dateTimeData.startTime = newStartDateTime[1];
			dateTimeData.endDate = newEndDateTime[0];
			dateTimeData.endTime = newEndDateTime[1];
		}
		dateTimeData.timeZone = browserTimezone;
	}
	return dateTimeData;
}
function date_specials_calculation(type, dateString, timeString = null, timeZone) {
	try {
		const tmpDate = (function() {
			if (timeString) {
				const offsetEnd = tzlib_get_offset(timeZone, dateString, timeString);
				return /* @__PURE__ */ new Date(dateString + " " + timeString + ":00 GMT" + offsetEnd);
			}
			return new Date(dateString);
		})();
		if (type === "timestamp") return tmpDate.getTime();
		if (!timeString) tmpDate.setDate(tmpDate.getDate() + 1);
		const currentUtcDate = (/* @__PURE__ */ new Date()).toISOString();
		return tmpDate.getTime() < new Date(currentUtcDate).getTime();
	} catch (_unused) {
		return false;
	}
}
function date_calculation(dateString, timeZone) {
	if (/today/i.test(dateString)) try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).formatToParts(/* @__PURE__ */ new Date());
		const part = (type) => {
			var _parts$find;
			return ((_parts$find = parts.find((entry) => entry.type === type)) === null || _parts$find === void 0 ? void 0 : _parts$find.value) || "";
		};
		dateString = dateString.replace(/today/gi, `${part("year")}-${part("month")}-${part("day")}`);
	} catch (_unused2) {
		return false;
	}
	const dateStringParts = dateString.split("+");
	const dateParts = dateStringParts[0].split("-");
	const newDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2].substring(0, 2)));
	if (dateStringParts[1] && dateStringParts[1] > 0) newDate.setDate(newDate.getDate() + parseInt(dateStringParts[1]));
	try {
		return newDate.toISOString().replace(/T(\d{2}:\d{2}:\d{2}\.\d{3})Z/g, "");
	} catch (_unused3) {
		return false;
	}
}
function decorate_data_button_status_handling(data) {
	if (!data.pastDateHandling || data.pastDateHandling !== "disable" && data.pastDateHandling !== "hide") data.pastDateHandling = "none";
	data.allOverdue = (function() {
		for (let i = 0; i < data.dates.length; i++) if (!data.dates[`${i}`].overdue) return false;
		return true;
	})();
	if (data.allOverdue) {
		if (data.pastDateHandling === "disable") data.disabled = true;
		else if (data.pastDateHandling === "hide") data.hidden = true;
	} else if (data.pastDateHandling === "hide" && data.dates.length > 1) {
		const filteredDates = [];
		for (let i = 0; i < data.dates.length; i++) if (!data.dates[`${i}`].overdue) filteredDates.push(data.dates[`${i}`]);
		data.dates = filteredDates;
	}
	data.allCancelled = (function() {
		for (let i = 0; i < data.dates.length; i++) if (!data.dates[`${i}`].status || data.dates[`${i}`].status !== "cancelled") return false;
		return true;
	})();
	if (data.disabled || data.hidden) data.blockInteraction = true;
	return data;
}
//#endregion
//#region src/core/sizes.ts
/**
* Size attribute parsing, shared by the client decoration pipeline and the ssr
* shell. Deliberately dependency-free: the ssr entry must stay importable in
* plain Node, so this module must never grow imports that reach DOM-touching
* code (lit, ui modules).
*
* The `size` attribute takes up to three pipe-separated values 0-10 (large,
* medium, small viewport), mapping to a base font size of 10+n px; unset or
* out-of-range parts fall back to 16px (or the next larger given value).
*/
function decorate_sizes(size) {
	const sizes = [];
	sizes["l"] = sizes["m"] = sizes["s"] = 16;
	if (size && size !== "") {
		const sizeParts = size.split("|");
		for (let i = 0; i < sizeParts.length; i++) sizeParts[`${i}`] = parseInt(sizeParts[`${i}`]);
		if (sizeParts[0] >= 0 && sizeParts[0] < 11) sizes["l"] = sizes["m"] = sizes["s"] = 10 + sizeParts[0];
		if (sizeParts.length > 2) {
			if (sizeParts[1] >= 0 && sizeParts[1] < 11) sizes["m"] = 10 + sizeParts[1];
			if (sizeParts[2] >= 0 && sizeParts[2] < 11) sizes["s"] = 10 + sizeParts[2];
		} else if (sizeParts.length == 2) {
			if (sizeParts[1] >= 0 && sizeParts[1] < 11) sizes["m"] = sizes["s"] = 10 + sizeParts[1];
		}
	}
	return sizes;
}
//#endregion
//#region src/core/script-base.ts
/**
* Resolves the directory that contains a loaded script.
*
* jsDelivr serves the package's `jsdelivr` entry directly for package-root URLs,
* without changing the script element's src to the resolved dist file. Account for
* that supported CDN form so lazy assets still resolve beside dist/atcb.js.
*/
function resolve_script_base(src) {
	const suffixIndex = src.search(/[?#]/);
	const packageUrl = suffixIndex === -1 ? src : src.substring(0, suffixIndex);
	for (const base of ["https://cdn.jsdelivr.net/npm/add-to-calendar-button", "http://cdn.jsdelivr.net/npm/add-to-calendar-button"]) {
		if (!packageUrl.startsWith(base)) continue;
		const version = packageUrl.substring(base.length);
		if (version === "" || version.startsWith("@") && version.length > 1 && !version.includes("/")) return packageUrl + "/dist/";
	}
	return src.lastIndexOf("/") > -1 ? src.substring(0, src.lastIndexOf("/") + 1) : "";
}
var en_default = {
	label: {
		"addtocalendar": "Add to Calendar",
		"share": {
			"email": "Share via Email",
			"copy": "Copy Link",
			"copied": "Copied",
			"email_subject": "Save this event"
		},
		"rsvp": {
			"title": "RSVP",
			"expired": "Expired",
			"bookedout": "Booked out",
			"restart": "New RSVP Reply"
		}
	},
	ical: "iCal File",
	modal: {
		"button": { "default": "Click me" },
		"webview": { "ical": {
			"h": "Open your browser",
			"text": "Unfortunately, in-app browsers have problems with the way we generate the calendar file.",
			"steps": "<ol><li><strong>Open another browser</strong> on your phone, ...</li><li><strong>Paste</strong> the clipboard content and go.</li></ol>"
		} },
		"clipboard": {
			"text": "We automatically copied a magical URL into your clipboard.",
			"failed": "Copying to your clipboard failed. Please copy the following link manually:"
		},
		"opensafari": { "ical": {
			"h": "Open Safari",
			"text": "Unfortunately, iOS has some problems generating and opening the calendar file outside of Safari.",
			"steps": "<ol><li><strong>Open Safari</strong>, ...</li><li><strong>Paste</strong> the clipboard content and go.</li></ol>"
		} },
		"multidate": {
			"h": "This is an event series",
			"text": "Add the individual events one by one:"
		}
	},
	date: { "status": {
		"cancelled": "This date got cancelled.",
		"cancelled_cta": "Please update your calendar!"
	} },
	group_overview: { "empty": "No events this year." },
	close: "Close",
	"continue": "Continue",
	cancel: "Cancel",
	expired: "Expired",
	recurring: "Recurring",
	thankyou: "Thank you",
	submit: "Submit",
	form: {
		"error": {
			"required": "You did not properly fill all required fields",
			"sending": "There was a problem sending your response. Please try again later",
			"email": "Your email address is not valid",
			"bookedoutmany": "Booked out - try with less attendees"
		},
		"success": {
			"title": "Sent successfully!",
			"sent": "Your reply has been sent. Thank you!",
			"email": "You should have received a confirmation email.",
			"doi": "To make it count, you now need to open the confirmation link in the email we just sent you (within the next 30 minutes).",
			"demo": "Thank you. The RSVP demo ends here.",
			"already": "You already replied."
		},
		"status": {
			"title": "Are you joining?",
			"confirmed": "Yes",
			"undecided": "Maybe",
			"declined": "No"
		},
		"amount": "Number of attendees",
		"max": "max.",
		"email": "Email address",
		"seatsleft": "Open slots"
	}
};
//#endregion
//#region src/i18n/index.ts
var rtlLanguages = [
	"ar",
	"fa",
	"he"
];
var availableLanguages = [
	"en",
	"de",
	"es",
	"pt",
	"fr",
	"nl",
	"tr",
	"zh",
	"ar",
	"hi",
	"pl",
	"id",
	"no",
	"fi",
	"sv",
	"cs",
	"ja",
	"it",
	"ko",
	"vi",
	"ro",
	"fa",
	"et",
	"uk",
	"hu",
	"he",
	"az",
	"be",
	"bg",
	"bs",
	"da",
	"el",
	"hr",
	"hy",
	"ka",
	"lt",
	"lv",
	"mk",
	"mt",
	"ru",
	"sk",
	"sl",
	"sq",
	"sr"
];
var calendarNames = {
	apple: "Apple",
	google: "Google",
	ms365: "Microsoft 365",
	msteams: "Microsoft Teams",
	outlookcom: "Outlook.com",
	yahoo: "Yahoo"
};
/**
* The translation registry. English ships inside every bundle; other languages load
* on demand: fetched from {scriptOrigin}/locales/{lang}.json for script-tag usage or
* registered via register_locale (the npm locale modules at dist/locales/{lang}.js
* do exactly that). Regional packs (like en_GB) are looked up first when registered,
* falling back to their base language, then to English.
*/
var i18nStrings = { en: _objectSpread2(_objectSpread2({}, calendarNames), flatten_translations(en_default)) };
var atcbLocaleRelPath = "../locales/";
var localeScriptBase = (() => {
	try {
		if (typeof import.meta !== "undefined" && import.meta.url) {
			const src = String(import.meta.url);
			if (src.indexOf("data:") !== 0 && src.lastIndexOf("/") > -1) return resolve_script_base(src);
		}
	} catch (_unused) {}
	try {
		if (typeof document !== "undefined" && document.currentScript && document.currentScript.src) {
			const src = document.currentScript.src;
			return resolve_script_base(src);
		}
	} catch (_unused2) {}
	return "";
})();
var pendingLocaleLoads = /* @__PURE__ */ new Map();
function flatten_translations(strings, prefix = "") {
	const flat = {};
	for (const [key, value] of Object.entries(strings)) if (typeof value === "string") flat[prefix + key] = value;
	else Object.assign(flat, flatten_translations(value, prefix + key + "."));
	return flat;
}
/**
* Registers a translation pack under a language code (base like "de" or regional
* like "en_GB"). Accepts nested or flat packs. Public API used by the generated
* locale modules and custom setups.
*/
function register_locale(language, strings) {
	i18nStrings[`${language}`] = _objectSpread2(_objectSpread2({}, calendarNames), flatten_translations(strings));
}
function locale_base_url(data) {
	if (data.styleSource && data.styleSource !== "") {
		const src = String(data.styleSource);
		return (src.endsWith("/") ? src : src + "/").replace(/styles\/$/, "locales/");
	}
	if (localeScriptBase === "") return "";
	return localeScriptBase + atcbLocaleRelPath;
}
/**
* Makes sure the translation pack for the configured language is available before
* rendering (labels are needed synchronously at template time). Unknown languages
* and failed loads gracefully keep the English fallback behavior.
*/
async function ensure_locale(data) {
	const language = data.language || "en";
	if (i18nStrings[`${language}`] || !availableLanguages.includes(language)) return;
	if (!pendingLocaleLoads.has(language)) pendingLocaleLoads.set(language, (async () => {
		const base = locale_base_url(data);
		if (base === "") {
			if (data.debug) console.warn("Add to Calendar Button: language \"" + language + "\" is not registered and no locale source could be resolved - import the locale module or set the style-source attribute");
			return false;
		}
		try {
			const response = await fetch(base + language + ".json");
			if (!response.ok) throw new Error("status " + response.status);
			const strings = await response.json();
			register_locale(language, strings);
			return true;
		} catch (e) {
			if (data.debug) console.error("Add to Calendar Button: loading language \"" + language + "\" from \"" + base + "\" failed", e);
			return false;
		} finally {
			pendingLocaleLoads.delete(language);
		}
	})());
	await pendingLocaleLoads.get(language);
}
function translate(identifier, language) {
	if (!language) language = "en";
	const pack = i18nStrings[`${language}`];
	if (pack && pack[`${identifier}`]) return pack[`${identifier}`];
	if (language.length > 2) return translate(identifier, language.substring(0, 2));
	if (language !== "en") return translate(identifier, "en");
	return identifier;
}
function translate_hook(identifier, data) {
	if (data.customLabels && data.customLabels[`${identifier}`] && data.customLabels[`${identifier}`] !== "") return safe_html(data.customLabels[`${identifier}`]);
	else return translate(identifier, data.translationLocale || data.language);
}
//#endregion
//#region src/ui/positioning.ts
function position_list(host, trigger, list, blockUpwards = false, blockDownwards = false) {
	let anchorSet = false;
	const originalTrigger = trigger;
	if (trigger.querySelector(".atcb-dropdown-anchor") !== null) {
		trigger = trigger.querySelector(".atcb-dropdown-anchor");
		anchorSet = true;
	}
	list.style.position = "relative";
	list.style.display = "inline-block";
	let triggerDim = trigger.getBoundingClientRect();
	const btnDim = originalTrigger.getBoundingClientRect();
	const btnParentDim = originalTrigger.parentNode.getBoundingClientRect();
	const viewportHeight = document.documentElement.clientHeight;
	if (anchorSet === true && !list.classList.contains("atcb-dropoverlay")) {
		let listDim = list.getBoundingClientRect();
		list.style.width = listDim.width + "px";
		if (list.classList.contains("atcb-dropup") || !blockUpwards && triggerDim.top + listDim.height > viewportHeight - 20 && 2 * btnDim.top + btnDim.height - triggerDim.top - listDim.height > 20 || blockDownwards) {
			originalTrigger.classList.add("atcb-dropup");
			list.classList.add("atcb-dropup");
			list.style.bottom = btnParentDim.bottom - btnDim.bottom + (triggerDim.top - btnDim.top) + "px";
		} else {
			list.style.top = btnDim.top - btnParentDim.top + (triggerDim.top - btnDim.top) + "px";
			if (originalTrigger.classList.contains("atcb-dropup")) originalTrigger.classList.remove("atcb-dropup");
		}
		triggerDim = trigger.getBoundingClientRect();
		if (!list.classList.contains("atcb-style-simple") && !list.classList.contains("atcb-style-round") && !list.classList.contains("atcb-style-text") && !list.classList.contains("atcb-style-neumorphism")) {
			list.style.minWidth = triggerDim.width + "px";
			if (list.classList.contains("atcb-dropdown")) list.style.maxWidth = triggerDim.width + "px";
		}
		listDim = list.getBoundingClientRect();
		list.style.left = Math.round(triggerDim.left - btnParentDim.left - (listDim.width - triggerDim.width) / 2) + "px";
	} else {
		list.style.minWidth = btnDim.width + 20 + "px";
		const listDim = list.getBoundingClientRect();
		list.style.width = listDim.width + "px";
		const sideMargin = Math.round((btnDim.width - listDim.width) / 2);
		list.style.margin = -Math.round((listDim.height + btnDim.height) / 2) + "px " + sideMargin + "px 0 " + sideMargin + "px";
	}
	list.style.position = "absolute";
	list.style.display = "block";
	const brandingReference = host.querySelector("#atcb-reference");
	if (brandingReference) {
		if (originalTrigger.classList.contains("atcb-dropup")) {
			originalTrigger.parentNode.after(brandingReference);
			brandingReference.classList.add("atcb-dropup");
		}
	}
}
function position_shadow_button(originalShadowHost, modalShadowHost) {
	const wrapperDim = originalShadowHost.querySelector(".atcb-initialized ").getBoundingClientRect();
	const newWrapper = modalShadowHost.querySelector(".atcb-initialized");
	let widthVal = wrapperDim.width;
	if (wrapperDim.width < 250) widthVal = 250;
	newWrapper.style.width = widthVal + "px";
	newWrapper.style.height = wrapperDim.height + "px";
	newWrapper.style.top = wrapperDim.top + "px";
	newWrapper.style.left = wrapperDim.left + "px";
}
function position_shadow_button_listener() {
	const active = getActiveButton();
	if (active !== null && active !== "") {
		const originalEl = document.querySelector("add-to-calendar-button[atcb-button-id=" + active + "]").shadowRoot;
		const shadowEl = document.querySelector("div[atcb-button-id=" + active + "]").shadowRoot;
		position_shadow_button(originalEl, shadowEl);
	}
}
function manage_body_scroll(host, modalObj = null) {
	if ((function() {
		if (modalObj != null) return modalObj;
		else {
			const allModals = host.querySelectorAll(".atcb-modal");
			if (allModals.length === 0) return null;
			return allModals[allModals.length - 1];
		}
	})() == null) return;
	document.body.classList.add("atcb-modal-no-scroll");
	document.documentElement.classList.add("atcb-modal-no-scroll");
}
function set_sizes(el, sizes) {
	el.style.setProperty("--base-font-size-l", sizes["l"] + "px");
	el.style.setProperty("--base-font-size-m", sizes["m"] + "px");
	el.style.setProperty("--base-font-size-s", sizes["s"] + "px");
}
//#endregion
//#region src/core/events.ts
function log_event(event, trigger, identifier) {
	const parentEl = (function() {
		const customTrigger = document.getElementById(identifier);
		if (customTrigger) return customTrigger;
		return document.querySelector("[atcb-button-id=\"" + identifier + "\"]");
	})();
	if (parentEl) parentEl.setAttribute("atcb-last-event", event + ":" + trigger);
	if (isBrowser()) push_to_data_layer(event, trigger);
}
function push_to_data_layer(event, trigger) {
	let action = "";
	switch (event) {
		case "initialization":
			action = "Initialized";
			break;
		case "openList":
			action = "Opened";
			break;
		case "closeList":
			action = "Closed";
			break;
		case "openCalendarLink":
			action = "Opened";
			break;
		case "openSingletonLink":
			action = "Opened";
			break;
		case "openSubEventLink":
			action = "Opened";
			break;
		case "openRSVP":
			action = "Opened";
			break;
		case "success":
			action = "Saved";
			break;
		case "successRSVP": action = "Saved";
	}
	const category = event === "openRSVP" || event === "successRSVP" ? "Add-to-Calendar-RSVP" : "Add-to-Calendar-Button";
	(window.dataLayer = window.dataLayer || []).push({
		eventCategory: category,
		eventAction: action,
		eventLabel: trigger,
		event
	});
}
//#endregion
//#region src/core/util.ts
function saved_hook(host, data) {
	log_event("success", data.identifier, data.identifier);
	if (data.ty && typeof generate_ty === "function") setTimeout(() => {
		generate_ty(host, data);
	}, 1e3);
}
function save_file(file, filename) {
	try {
		const save = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
		save.rel = "noopener";
		save.href = file;
		if (isMobile()) save.target = "_self";
		else save.target = "_blank";
		save.download = filename + ".ics";
		const evt = new MouseEvent("click", {
			view: window,
			button: 0,
			bubbles: true,
			cancelable: false
		});
		save.dispatchEvent(evt);
		(window.URL || window.webkitURL).revokeObjectURL(save.href);
	} catch (e) {
		console.error(e);
	}
}
function validEmail(email) {
	if (!/^.{0,70}@.{1,30}\.[a-z]{2,9}$/i.test(email)) return false;
	return true;
}
async function copy_to_clipboard(dataString) {
	const v = (dataString !== null && dataString !== void 0 ? dataString : "").toString().trim();
	if (!v) throw new Error("No value to copy!");
	const legacyCopy = () => {
		if (typeof window === "undefined" || typeof document === "undefined") return false;
		if (!document.queryCommandSupported || !document.queryCommandSupported("copy")) return false;
		const ta = document.createElement("textarea");
		const prevFocus = document.activeElement;
		ta.value = v;
		ta.setAttribute("readonly", "");
		ta.style.contain = "strict";
		ta.style.position = "fixed";
		ta.style.top = "-9999px";
		ta.style.left = "-9999px";
		ta.style.opacity = "0";
		ta.style.outline = "none";
		ta.style.pointerEvents = "none";
		ta.style.fontSize = "12pt";
		document.body.appendChild(ta);
		try {
			ta.focus();
			ta.select();
			if (isIOS()) {
				ta.selectionStart = 0;
				ta.selectionEnd = v.length;
			}
			const ok = document.execCommand("copy");
			document.body.removeChild(ta);
			if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
			return ok;
		} catch (_unused) {
			document.body.removeChild(ta);
			if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
			return false;
		}
	};
	if ((() => {
		try {
			if (typeof window !== "undefined" && "isSecureContext" in window && window.isSecureContext) return true;
			if (typeof window !== "undefined" && window.location && window.location.protocol === "https:") return true;
			if (typeof window !== "undefined" && window.location && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) return true;
			return false;
		} catch (_unused2) {
			return false;
		}
	})() && typeof navigator !== "undefined" && navigator.clipboard) {
		try {
			if (typeof navigator.clipboard.writeText === "function") {
				await navigator.clipboard.writeText(v);
				return "Copied!";
			}
		} catch (_unused3) {}
		try {
			if (typeof window !== "undefined" && typeof window.ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
				const type = "text/plain";
				const blob = new Blob([v], { type });
				const data = [new ClipboardItem({ [type]: blob })];
				await navigator.clipboard.write(data);
				return "Copied!";
			}
		} catch (_unused4) {}
	}
	if (legacyCopy()) return "Copied!";
	throw new Error("Clipboard copy not supported in this environment");
}
function debounce(func, timeout = 200) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
}
function debounce_leading(func, timeout = 300) {
	let timer;
	return (...args) => {
		if (!timer) func.apply(this, args);
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = void 0;
		}, timeout);
	};
}
//#endregion
//#region src/ui/control.ts
function toggle(host, action, data = "", button = null, keyboardTrigger = false, generatedButton = false) {
	if (resultChannel.active()) return;
	if (action == "open") open(host, data, button, keyboardTrigger, generatedButton);
	else if (action == "close" || button.classList.contains("atcb-active") || host.querySelector(".atcb-active-modal")) close(host, keyboardTrigger);
	else open(host, data, button, keyboardTrigger, generatedButton);
}
async function open(host, data, button = null, keyboardTrigger = false, generatedButton = false) {
	if (host.querySelector(".atcb-list") || host.querySelector(".atcb-modal")) return;
	log_event("openList", data.identifier, data.identifier);
	setActiveButton(data.identifier);
	const list = generate_dropdown_list(host, data);
	const listWrapper = document.createElement("div");
	listWrapper.classList.add("atcb-list-wrapper");
	listWrapper.setAttribute("part", "atcb-list-wrapper");
	if (data.hideTextLabelList) listWrapper.classList.add("atcb-no-text");
	if (button) {
		button.classList.add("atcb-active");
		button.setAttribute("aria-expanded", "true");
		if (data.listStyle === "modal") {
			button.classList.add("atcb-modal-style");
			list.classList.add("atcb-modal");
		} else {
			listWrapper.append(list);
			listWrapper.classList.add("atcb-dropdown");
			if (data.listStyle === "overlay") listWrapper.classList.add("atcb-dropoverlay");
		}
		if (generatedButton) list.classList.add("atcb-generated-button");
	} else list.classList.add("atcb-modal");
	const focusFirstOption = () => {
		const focusEl = list.querySelector("[role=\"menuitem\"][data-option-number=\"1\"]");
		if (!focusEl) return;
		if (keyboardTrigger) focusEl.focus();
		else {
			focusEl.focus({ preventScroll: true });
			focusEl.blur();
		}
	};
	const bgOverlay = generate_bg_overlay(host, data.trigger, data.listStyle === "modal", !data.hideBackground);
	if (data.listStyle === "modal") {
		const headline = list.querySelector(".atcb-list-modal-headline");
		if (headline) {
			headline.id = data.identifier + "-list-headline";
			bgOverlay.setAttribute("aria-labelledby", headline.id);
		}
		bgOverlay.setAttribute("aria-modal", "true");
		const modalHost = await generate_modal_host(host, data);
		modalHost.querySelector(".atcb-modal-host-initialized").append(bgOverlay);
		bgOverlay.showModal();
		bgOverlay.append(list);
		if (!data.hideBranding) place_modal_reference(modalHost, bgOverlay);
		set_sizes(list, data.sizes);
		manage_body_scroll(modalHost);
		focusFirstOption();
	} else {
		if (data.forceOverlay) {
			host = await generate_overlay_dom(host, data);
			button = host.querySelector(".atcb-button");
		}
		host.querySelector(".atcb-initialized").append(listWrapper);
		listWrapper.append(list);
		if (data.buttonStyle != "default") listWrapper.classList.add("atcb-style-" + data.buttonStyle);
		if (!data.hideBranding) create_atcbl(host);
		host.append(bgOverlay);
		set_sizes(list, data.sizes);
		listWrapper.style.display = "none";
		setTimeout(function() {
			listWrapper.style.display = "block";
			if (data.listStyle === "dropdown-static") position_list(host, button, listWrapper, true);
			else if (data.listStyle === "dropup-static") position_list(host, button, listWrapper, false, true);
			else position_list(host, button, listWrapper);
			focusFirstOption();
		}, 5);
	}
}
function close(host, keyboardTrigger = false) {
	const existingModalHost = document.getElementById(host.host.getAttribute("atcb-button-id") + "-modal-host");
	const allModals = (function() {
		if (!existingModalHost || existingModalHost.length === 0) return [];
		return existingModalHost.shadowRoot.querySelectorAll(".atcb-modal[data-modal-nr]");
	})();
	if (allModals.length > 1) {
		existingModalHost.shadowRoot.querySelectorAll(".atcb-modal[data-modal-nr=\"" + allModals.length + "\"]")[0].remove();
		const nextModal = existingModalHost.shadowRoot.querySelectorAll(".atcb-modal[data-modal-nr=\"" + (allModals.length - 1) + "\"]")[0];
		nextModal.classList.remove("atcb-hidden");
		let focusEl = nextModal;
		const availableButtons = nextModal.getElementsByTagName("button");
		if (availableButtons.length > 0) focusEl = availableButtons[0];
		focusEl.focus();
		if (!keyboardTrigger) focusEl.blur();
	} else {
		const newFocusEl = (function() {
			const hostEl = host.querySelector(".atcb-active, .atcb-active-modal");
			if (hostEl) return hostEl;
			return document.querySelector(".atcb-active, .atcb-active-modal");
		})();
		Array.from(host.querySelectorAll(".atcb-active")).forEach((button) => {
			button.classList.remove("atcb-active");
			button.setAttribute("aria-expanded", "false");
		});
		Array.from(host.querySelectorAll(".atcb-active-modal")).forEach((modal) => {
			modal.classList.remove("atcb-active-modal");
		});
		Array.from(document.querySelectorAll(".atcb-active")).forEach((button) => {
			button.classList.remove("atcb-active");
			button.setAttribute("aria-expanded", "false");
		});
		Array.from(document.querySelectorAll(".atcb-active-modal")).forEach((modal) => {
			modal.classList.remove("atcb-active-modal");
		});
		if (existingModalHost) existingModalHost.remove();
		document.body.classList.remove("atcb-modal-no-scroll");
		document.documentElement.classList.remove("atcb-modal-no-scroll");
		Array.from(host.querySelectorAll(".atcb-list-wrapper")).concat(Array.from(host.querySelectorAll(".atcb-list"))).concat(Array.from(host.querySelectorAll("#atcb-reference"))).concat(Array.from(host.querySelectorAll("#atcb-bgoverlay"))).forEach((el) => el.remove());
		const hiddenButton = document.querySelector(".atcb-shadow-hide");
		if (hiddenButton) {
			hiddenButton.shadowRoot.querySelector(".atcb-initialized").style.opacity = "1";
			hiddenButton.classList.remove("atcb-shadow-hide");
			window.removeEventListener("scroll", position_shadow_button_listener);
			window.removeEventListener("resize", position_shadow_button_listener);
		}
		if (newFocusEl) {
			newFocusEl.focus({ preventScroll: true });
			if (!keyboardTrigger) newFocusEl.blur();
		}
		setActiveButton("");
	}
}
//#endregion
//#region src/generators/ical.ts
function ics_option_list(value) {
	if (!value) return [];
	return (Array.isArray(value) ? value : [String(value)]).flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter((item) => item !== "");
}
function open_cal_url(data, type, url = "", subscribe = false, subEvent = null, target = "") {
	if (target === "") target = defaultTarget;
	if (data.proxy && data.proKey && data.proKey !== "") {
		const urlType = subscribe ? "s" : "o";
		const query = (function() {
			const parts = [];
			if (data.dates[0].attendee && data.dates[0].attendee !== "") parts.push("attendee=" + encodeURIComponent(data.dates[0].attendee));
			if (data.customVar && typeof data.customVar === "object" && Object.keys(data.customVar).length > 0) parts.push("customvar=" + encodeURIComponent(JSON.stringify(data.customVar)));
			if (data.dates && data.dates.length > 1 && subEvent !== null && subEvent !== "all") parts.push("sub-event=" + subEvent);
			if (parts.length > 0) return "?" + parts.join("&");
			return "";
		})();
		url = `https://${data.domain ? data.domain : data.dev ? "dev.caldn.net" : "caldn.net"}/${data.proKey}/${urlType}/${type}${query}`;
		if (!secure_url(url)) return;
	}
	if (secure_url(url)) {
		if (resultChannel.active()) {
			resultChannel.push(url);
			return;
		}
		const newTab = window.open(url, target);
		if (newTab) newTab.focus();
	}
}
function proxy_url(data, type, subEvent = null, subscribe = false) {
	const urlType = subscribe ? "s" : "o";
	const parts = [];
	if (data.dates[0].attendee && data.dates[0].attendee !== "") parts.push("attendee=" + encodeURIComponent(data.dates[0].attendee));
	if (data.customVar && typeof data.customVar === "object" && Object.keys(data.customVar).length > 0) parts.push("customvar=" + encodeURIComponent(JSON.stringify(data.customVar)));
	if (data.dates && data.dates.length > 1 && subEvent !== null && subEvent !== "all") parts.push("sub-event=" + subEvent);
	const query = parts.length > 0 ? "?" + parts.join("&") : "";
	const url = `https://${data.domain ? data.domain : data.dev ? "dev.caldn.net" : "caldn.net"}/${data.proKey}/${urlType}/${type}${query}`;
	return secure_url(url) ? url : "";
}
function static_ics_file(host, data, subEvent) {
	const potentialHostAttendee = host && host.host && host.host.getAttribute("attendee") || "";
	const potentialHostCustomVar = host && host.host && (host.host.getAttribute("customVar") || host.host.getAttribute("custom-var")) || "";
	if (data.attendee && data.attendee !== "" && potentialHostAttendee !== "" || data.customVar && data.customVar !== "" && potentialHostCustomVar !== "") return "";
	const selectedEntry = subEvent === "all" ? void 0 : data.dates.find((_entry, index) => index === subEvent);
	if (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.icsFile) return selectedEntry.icsFile;
	return data.icsFile || "";
}
function subscribe_ical(data, fileUrl, type, host = null, keyboardTrigger = false) {
	if (isIOS() && !isSafari()) {
		ical_copy_note(host, fileUrl, data, keyboardTrigger);
		return;
	}
	open_cal_url(data, type, fileUrl, true);
}
function generate_ical(host, data, type, subEvent = "all", keyboardTrigger = false, resolveOnly = false) {
	if (subEvent !== "all") subEvent = parseInt(subEvent);
	const filename = determine_ical_filename(data, subEvent);
	const givenIcsFile = static_ics_file(host, data, subEvent);
	if (data.proxy) {
		if (resolveOnly) return {
			kind: "proxy",
			href: proxy_url(data, type, subEvent),
			filename,
			target: defaultTarget
		};
		open_cal_url(data, type, "", false, subEvent);
		return;
	}
	if (givenIcsFile !== "" && (!isIOS() && !data.fakeIOS || !isWebView() || data.bypassWebViewCheck)) {
		if (resolveOnly) return {
			kind: "static",
			href: givenIcsFile,
			filename,
			target: isMobileTarget()
		};
		if (resultChannel.active()) {
			resultChannel.push(givenIcsFile);
			return;
		}
		save_file(givenIcsFile, filename);
		return;
	}
	const now = /* @__PURE__ */ new Date();
	const ics_lines = ["BEGIN:VCALENDAR", "VERSION:2.0"];
	const icalVersion = atcbVersion.replace(/-next.*$/i, "");
	ics_lines.push("PRODID:-// calendarverse.org // v" + icalVersion + " //EN");
	ics_lines.push("CALSCALE:GREGORIAN");
	if (subEvent === "all") {
		if (data.dates[0].organizer && data.dates[0].organizer !== "") ics_lines.push("METHOD:REQUEST");
		else ics_lines.push("METHOD:PUBLISH");
	} else if (data.dates[`${subEvent}`].status && data.dates[`${subEvent}`].status === "cancelled") ics_lines.push("METHOD:CANCEL");
	else if (data.dates[`${subEvent}`].organizer && data.dates[`${subEvent}`].organizer !== "") ics_lines.push("METHOD:REQUEST");
	else ics_lines.push("METHOD:PUBLISH");
	const usedTimeZones = [];
	const loopStart = (function() {
		if (subEvent != "all") return subEvent;
		return 0;
	})();
	const loopEnd = (function() {
		if (subEvent != "all") return subEvent;
		return data.dates.length - 1;
	})();
	for (let i = loopStart; i <= loopEnd; i++) {
		const formattedDate = generate_time(data.dates[`${i}`], "clean", "ical");
		const timeAddon = (function() {
			if (formattedDate.allday) return ";VALUE=DATE";
			if (data.dates[`${i}`].timeZone && data.dates[`${i}`].timeZone !== "") {
				const timeZone = atcbTimeZonesToUtc.test(data.dates[`${i}`].timeZone) ? "GMT" : data.dates[`${i}`].timeZone;
				const timeZoneBlock = tzlib_get_ical_block(timeZone);
				if (!usedTimeZones.includes(timeZone)) ics_lines.push(timeZoneBlock[0]);
				usedTimeZones.push(timeZone);
				return ";" + timeZoneBlock[1];
			}
		})();
		ics_lines.push("BEGIN:VEVENT");
		if (data.dates[`${i}`].uid && data.dates[`${i}`].uid !== "") ics_lines.push("UID:" + data.dates[`${i}`].uid);
		ics_lines.push("DTSTAMP:" + format_datetime(now, "clean", true));
		ics_lines.push("DTSTART" + timeAddon + ":" + formattedDate.start);
		ics_lines.push("DTEND" + timeAddon + ":" + formattedDate.end);
		ics_lines.push("SUMMARY:" + rewrite_ical_text(data.dates[`${i}`].name));
		if (data.dates[`${i}`].descriptionHtmlFreeICal && data.dates[`${i}`].descriptionHtmlFreeICal !== "") ics_lines.push("DESCRIPTION:" + rewrite_ical_text(data.dates[`${i}`].descriptionHtmlFreeICal));
		if (data.dates[`${i}`].description && data.dates[`${i}`].description !== "") ics_lines.push("X-ALT-DESC;FMTTYPE=text/html:\r\n <!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 3.2//EN\">\r\n <HTML><BODY>\r\n " + rewrite_ical_text(data.dates[`${i}`].description) + "\r\n </BODY></HTML>");
		if (data.dates[`${i}`].location && data.dates[`${i}`].location !== "") ics_lines.push("LOCATION:" + rewrite_ical_text(data.dates[`${i}`].location));
		if (data.dates[`${i}`].organizer && data.dates[`${i}`].organizer !== "") {
			const organizerParts = data.dates[`${i}`].organizer.split("|");
			ics_lines.push("ORGANIZER;CN=" + rewrite_ical_text(organizerParts[0], true) + ":MAILTO:" + organizerParts[1]);
		}
		if (data.dates[`${i}`].attendee && data.dates[`${i}`].attendee !== "") {
			const attendeeParts = data.dates[`${i}`].attendee.split("|");
			if (attendeeParts.length === 2) ics_lines.push("ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=" + rewrite_ical_text(attendeeParts[0], true) + ";X-NUM-GUESTS=0:mailto:" + attendeeParts[1]);
			else ics_lines.push("ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=" + attendeeParts[0] + ";X-NUM-GUESTS=0:mailto:" + attendeeParts[0]);
		}
		if (data.recurrence && data.recurrence !== "") ics_lines.push(data.recurrence);
		if (data.dates[`${i}`].availability && data.dates[`${i}`].availability !== "") {
			const transpVal = (function() {
				if (data.dates[`${i}`].availability == "free") return "TRANSPARENT";
				return "OPAQUE";
			})();
			ics_lines.push("TRANSP:" + transpVal);
		}
		ics_lines.push("SEQUENCE:" + data.dates[`${i}`].sequence);
		ics_lines.push("STATUS:" + String(data.dates[`${i}`].status).toUpperCase());
		ics_lines.push("CREATED:" + data.dates[`${i}`].icsCreated);
		ics_lines.push("LAST-MODIFIED:" + data.dates[`${i}`].icsUpdated);
		const entry = data.dates[`${i}`];
		if (entry.icsUrl && entry.icsUrl !== "") ics_lines.push("URL:" + entry.icsUrl);
		const categories = ics_option_list(entry.icsCategories);
		if (categories.length > 0) ics_lines.push("CATEGORIES:" + categories.map((category) => rewrite_ical_text(category)).join(","));
		if (entry.icsClass && String(entry.icsClass) !== "") ics_lines.push("CLASS:" + String(entry.icsClass).toUpperCase());
		if (entry.icsPriority !== void 0 && String(entry.icsPriority) !== "") ics_lines.push("PRIORITY:" + parseInt(String(entry.icsPriority), 10));
		if (entry.icsGeo && String(entry.icsGeo) !== "") {
			const [latRaw, lonRaw] = String(entry.icsGeo).split(",");
			const lat = parseFloat(latRaw.trim());
			const lon = parseFloat(lonRaw.trim());
			ics_lines.push("GEO:" + lat + ";" + lon);
			if (entry.location && entry.location !== "") ics_lines.push("X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=100;X-TITLE=" + rewrite_ical_text(entry.location, true) + ":geo:" + lat + "," + lon);
		}
		for (const attachUrl of ics_option_list(entry.icsAttach)) ics_lines.push("ATTACH:" + attachUrl);
		if (i === 0 && data.recurrence && data.recurrence !== "") {
			const exdates = ics_option_list(data.icsExdate);
			if (exdates.length > 0) {
				const exdateValues = exdates.map((exdate) => {
					const datePart = exdate.replace(/-/g, "");
					if (formattedDate.allday) return datePart;
					return datePart + "T" + (entry.startTime ? entry.startTime.replace(":", "") : "0000") + "00";
				});
				ics_lines.push("EXDATE" + (timeAddon || "") + ":" + exdateValues.join(","));
			}
		}
		if (entry.icsReminder !== void 0 && String(entry.icsReminder) !== "") {
			const trigger = /^\d+$/.test(String(entry.icsReminder)) ? "-PT" + parseInt(String(entry.icsReminder), 10) + "M" : String(entry.icsReminder).toUpperCase();
			ics_lines.push("BEGIN:VALARM");
			ics_lines.push("ACTION:DISPLAY");
			ics_lines.push("DESCRIPTION:" + rewrite_ical_text(entry.name || "Reminder"));
			ics_lines.push("TRIGGER:" + trigger);
			ics_lines.push("END:VALARM");
		}
		ics_lines.push("END:VEVENT");
	}
	ics_lines.push("END:VCALENDAR");
	const icsContent = givenIcsFile !== "" ? "" : format_ical_lines(ics_lines.join("\r\n"));
	const dataUrl = givenIcsFile !== "" ? givenIcsFile : "data:text/calendar;charset=utf-8," + encodeURIComponent(icsContent);
	const action = {
		kind: givenIcsFile !== "" ? "static" : "dynamic",
		href: dataUrl,
		filename,
		target: isMobileTarget(),
		content: givenIcsFile !== "" ? void 0 : icsContent
	};
	const requiresAssistance = isIOS() && !isSafari() || isWebView() && (isIOS() || isAndroid() && isProblematicWebView());
	if (resolveOnly) return requiresAssistance ? _objectSpread2(_objectSpread2({}, action), {}, { kind: "assistance" }) : action;
	if (resultChannel.active()) {
		resultChannel.push(givenIcsFile !== "" ? givenIcsFile : icsContent);
		return;
	}
	if (requiresAssistance) {
		ical_copy_note(host, dataUrl, data, keyboardTrigger);
		return;
	}
	save_file(dataUrl, filename);
}
function isMobileTarget() {
	return isIOS() || isAndroid() ? "_self" : "_blank";
}
function determine_ical_filename(data, subEvent) {
	const filenameSuffix = (function() {
		if (subEvent != "all" && subEvent != 0) return "-" + parseInt(subEvent) + 1;
		return "";
	})();
	if (data.iCalFileName != null && data.iCalFileName != "") return data.iCalFileName + filenameSuffix;
	if (data.icsFile != null && data.icsFile != "") {
		const filenamePart = data.icsFile.split("/").pop().split(".")[0];
		if (filenamePart != "") return filenamePart + filenameSuffix;
	}
	return "event" + filenameSuffix;
}
async function clipboard_note_content(copyValue, data) {
	try {
		await copy_to_clipboard(copyValue);
		return translate_hook("modal.clipboard.text", data);
	} catch (e) {
		console.warn(e);
		return translate_hook("modal.clipboard.failed", data) + "<br><input type=\"text\" class=\"atcb-modal-clipboard-input\" readonly value=\"" + escape_html(copyValue) + "\" aria-label=\"" + escape_html(translate_hook("label.share.copy", data)) + "\" />";
	}
}
function wire_clipboard_input(data) {
	const modalHost = document.getElementById(data.identifier + "-modal-host");
	const input = modalHost && modalHost.shadowRoot ? modalHost.shadowRoot.querySelector(".atcb-modal-clipboard-input") : null;
	if (input) input.addEventListener("focus", () => input.select());
}
async function ical_copy_note(host, dataUrl, data, keyboardTrigger) {
	const clipboardNote = await clipboard_note_content(dataUrl, data);
	if (isIOS() && !isSafari()) {
		await create_modal(host, data, "warning", translate_hook("modal.opensafari.ical.h", data), translate_hook("modal.opensafari.ical.text", data) + "<br>" + clipboardNote + "<br>" + translate_hook("modal.opensafari.ical.steps", data), [], [], keyboardTrigger);
		wire_clipboard_input(data);
		return;
	}
	await create_modal(host, data, "warning", translate_hook("modal.webview.ical.h", data), translate_hook("modal.webview.ical.text", data) + "<br>" + clipboardNote + "<br>" + translate_hook("modal.webview.ical.steps", data), [], [], keyboardTrigger);
	wire_clipboard_input(data);
}
//#endregion
//#region src/generators/google.ts
function subscribe_google(data, fileUrl) {
	const baseUrl = "https://calendar.google.com/calendar/u/0/r?cid=";
	let isGoogleCalId = false;
	const newFileUrl = (function() {
		if (/^(?:webcal:\/\/|\/\/)calendar\.google\.com\/.*\?cid=/.test(fileUrl)) {
			isGoogleCalId = true;
			return fileUrl.replace(/^(.)*\?cid=/, "");
		}
		return encodeURIComponent(fileUrl);
	})();
	if ((isAndroid() || data.fakeAndroid) && isGoogleCalId) {
		if (!isWebView()) {
			const httpsUrl = baseUrl + newFileUrl;
			const fallback = encodeURIComponent(httpsUrl);
			open_cal_url(data, "google", "intent://calendar.google.com/calendar?cid=" + newFileUrl + "#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=" + fallback + ";end", true);
		} else open_cal_url(data, "google", baseUrl + newFileUrl, true);
		return;
	}
	open_cal_url(data, "google", baseUrl + newFileUrl, true);
}
function generate_google(data, date, subEvent = "all") {
	const urlParts = [];
	if (isMobile() || data.fakeMobile) urlParts.push("https://calendar.google.com/calendar/render?action=TEMPLATE&");
	else urlParts.push("https://calendar.google.com/calendar/r/eventedit?");
	const formattedDate = generate_time(date, "clean", "google");
	urlParts.push("dates=" + encodeURIComponent(formattedDate.start) + "%2F" + encodeURIComponent(formattedDate.end));
	if (date.timeZone && date.timeZone !== "" && !atcbTimeZonesToUtc.test(date.timeZone) && !formattedDate.allday) urlParts.push("ctz=" + date.timeZone);
	if (date.name && date.name !== "") urlParts.push("text=" + encodeURIComponent(date.name));
	if (date.location && date.location !== "") urlParts.push("location=" + encodeURIComponent(date.location));
	if (date.description && date.description !== "") urlParts.push("details=" + encodeURIComponent(date.description));
	if (date.recurrence && date.recurrence !== "") urlParts.push("recur=" + encodeURIComponent(date.recurrence));
	if (date.availability && date.availability !== "") {
		const availabilityPart = (function() {
			if (date.availability == "free") return "crm=AVAILABLE&trp=false";
			return "crm=BUSY&trp=true";
		})();
		urlParts.push(availabilityPart);
	}
	let fullUrl = urlParts.join("&");
	if (isAndroid() || data.fakeAndroid) {
		if (!isWebView()) {
			const fallback = encodeURIComponent(fullUrl);
			fullUrl = "intent://" + fullUrl.slice(8) + "#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=" + fallback + ";end";
		}
	}
	open_cal_url(data, "google", fullUrl, false, subEvent);
}
//#endregion
//#region src/generators/msteams.ts
function generate_msteams(data, date, subEvent = "all") {
	const urlParts = [];
	const baseUrl = "https://teams.microsoft.com/l/meeting/new?";
	const formattedDate = generate_time(date, "delimiters", "msteams", true);
	if (!formattedDate.allday || isMobile() || data.fakeMobile) {
		urlParts.push("startTime=" + encodeURIComponent(formattedDate.start));
		urlParts.push("endTime=" + encodeURIComponent(formattedDate.end));
	} else {
		urlParts.push("startTime=" + formattedDate.start);
		urlParts.push("endTime=" + formattedDate.end);
	}
	if (date.name && date.name !== "") urlParts.push("subject=" + encodeURIComponent(date.name));
	let locationString = "";
	if (date.location && date.location !== "") {
		locationString = date.location;
		locationString += " // ";
		urlParts.push("location=" + encodeURIComponent(locationString));
	}
	if (date.descriptionHtmlFree && date.descriptionHtmlFree != "") urlParts.push("content=" + encodeURIComponent(locationString + date.descriptionHtmlFree));
	open_cal_url(data, "msteams", baseUrl + urlParts.join("&"), false, subEvent);
}
//#endregion
//#region src/generators/outlook.ts
function subscribe_microsoft(data, fileUrl, calName, type = "ms365") {
	const urlParts = [];
	const baseUrl = (function() {
		if (type == "outlookcom") return "https://outlook.live.com/calendar/0/addfromweb/?";
		else return "https://outlook.office.com/calendar/0/addfromweb/?";
	})();
	urlParts.push("url=" + encodeURIComponent(fileUrl));
	urlParts.push("name=" + encodeURIComponent(calName));
	open_cal_url(data, type, baseUrl + urlParts.join("&"), true);
}
function generate_microsoft(data, date, subEvent = "all", type = "ms365") {
	const urlParts = [];
	const basePath = "/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent";
	const baseUrl = (function() {
		if (type == "outlookcom") return "https://outlook.live.com" + basePath;
		else return "https://outlook.office.com" + basePath;
	})();
	urlParts.push(baseUrl);
	const formattedDate = generate_time(date, "delimiters", "microsoft");
	urlParts.push("startdt=" + formattedDate.start);
	urlParts.push("enddt=" + formattedDate.end);
	if (formattedDate.allday) urlParts.push("allday=true");
	if (date.name && date.name !== "") urlParts.push("subject=" + encodeURIComponent(date.name));
	if (date.location && date.location !== "") urlParts.push("location=" + encodeURIComponent(date.location));
	if (date.description && date.description !== "") urlParts.push("body=" + encodeURIComponent(date.description));
	open_cal_url(data, type, urlParts.join("&"), false, subEvent);
}
//#endregion
//#region src/generators/yahoo.ts
function generate_yahoo(data, date, subEvent = "all") {
	const urlParts = [];
	urlParts.push("https://calendar.yahoo.com/?v=60");
	const formattedDate = generate_time(date, "clean");
	if (formattedDate.allday) {
		if (formattedDate.start === formattedDate.end) urlParts.push("dur=allday&st=" + encodeURIComponent(formattedDate.start));
		else {
			const allDayDate = JSON.parse(JSON.stringify(date));
			allDayDate.startTime = "00:00";
			allDayDate.endTime = "23:59";
			allDayDate.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			const formattedAllDayDate = generate_time(allDayDate, "clean");
			urlParts.push("st=" + encodeURIComponent(formattedAllDayDate.start) + "&et=" + encodeURIComponent(formattedAllDayDate.end));
		}
	} else urlParts.push("st=" + encodeURIComponent(formattedDate.start) + "&et=" + encodeURIComponent(formattedDate.end));
	if (date.name && date.name !== "") urlParts.push("title=" + encodeURIComponent(date.name));
	if (date.location && date.location !== "") urlParts.push("in_loc=" + encodeURIComponent(date.location));
	if (date.descriptionHtmlFree && date.descriptionHtmlFree !== "") urlParts.push("desc=" + encodeURIComponent(date.descriptionHtmlFree));
	open_cal_url(data, "yahoo", urlParts.join("&"), false, subEvent);
}
//#endregion
//#region src/generators/index.ts
async function generate_links(host, type, data, subEvent = "all", keyboardTrigger = false, multiDateModal = false, skipDoubleLink = false) {
	let linkType = type;
	if (type === "apple") linkType = "ical";
	if (subEvent !== "all") subEvent = parseInt(subEvent) - 1;
	else if (data.dates.length == 1) subEvent = 0;
	if (data.subscribe) {
		await generate_subscribe_links(host, type, linkType, data, keyboardTrigger);
		return;
	}
	if (subEvent !== "all") {
		if (data.dates[`${subEvent}`].status === "cancelled" && linkType !== "ical") create_modal(host, data, "warning", translate_hook("date.status.cancelled", data), translate_hook("date.status.cancelled_cta", data), [], [], keyboardTrigger);
		else {
			if (!skipDoubleLink) {}
			switch (linkType) {
				case "ical":
					generate_ical(host, data, type, subEvent, keyboardTrigger);
					break;
				case "google":
					generate_google(data, data.dates[`${subEvent}`], subEvent);
					break;
				case "msteams":
					generate_msteams(data, data.dates[`${subEvent}`], subEvent);
					break;
				case "ms365":
					generate_microsoft(data, data.dates[`${subEvent}`], subEvent);
					break;
				case "outlookcom":
					generate_microsoft(data, data.dates[`${subEvent}`], subEvent, "outlookcom");
					break;
				case "yahoo": generate_yahoo(data, data.dates[`${subEvent}`], subEvent);
			}
			if (resultChannel.active()) return;
			const modalHost = document.getElementById(data.identifier + "-modal-host");
			if (modalHost) {
				const subEventButton = modalHost.shadowRoot.getElementById(data.identifier + "-" + type + "-" + (subEvent + 1));
				if (subEventButton) subEventButton.classList.add("atcb-saved");
			}
			if (data.dates[`${subEvent}`].status !== "cancelled") getOptionStates(data.identifier)[`${type}`][subEvent]++;
			if (getOptionStates(data.identifier)[`${type}`].filter(function(value) {
				return value < 1;
			}).length == 0) set_fully_successful(host, data, multiDateModal);
		}
		return;
	}
	generate_multidate_links(host, type, linkType, data, keyboardTrigger, multiDateModal);
}
function generate_multidate_links(host, type, linkType, data, keyboardTrigger, multiDateModal) {
	if (linkType === "ical" && !data.dates.some((theSubEvent) => theSubEvent.status === "cancelled") && data.dates.every((theSubEvent) => (theSubEvent.organizer || "") === (data.dates[0].organizer || ""))) {
		generate_ical(host, data, type, "all", keyboardTrigger);
		for (let i = 0; i < getOptionStates(data.identifier)[`${type}`].length; i++) getOptionStates(data.identifier)[`${type}`][`${i}`]++;
		set_fully_successful(host, data, multiDateModal);
		return;
	}
	if (!multiDateModal) {
		const individualButtons = [type];
		for (let i = 0; i < data.dates.length; i++) individualButtons.push(i + 1);
		create_modal(host, data, type, translate_hook("modal.multidate.h", data), translate_hook("modal.multidate.text", data), [], individualButtons, keyboardTrigger);
	}
}
async function generate_subscribe_links(host, type, linkType, data, keyboardTrigger) {
	const adjustedFileUrl = data.icsFile.replace(/^https:\/\//, "webcal://");
	switch (linkType) {
		case "ical":
			if (isAndroid() || data.fakeAndroid) {
				subscribe_ical(data, data.icsFile, type);
				break;
			}
			subscribe_ical(data, adjustedFileUrl, type, host, keyboardTrigger);
			break;
		case "google":
			subscribe_google(data, adjustedFileUrl);
			break;
		case "ms365":
			subscribe_microsoft(data, adjustedFileUrl, data.name);
			break;
		case "outlookcom": subscribe_microsoft(data, adjustedFileUrl, data.name, "outlookcom");
	}
	set_fully_successful(host, data);
}
function set_fully_successful(host, data, multiDateModal = false) {
	if (resultChannel.active()) return;
	const trigger = host.getElementById(data.identifier);
	if (trigger) trigger.classList.add("atcb-saved");
	saved_hook(host, data);
	if (multiDateModal && host.querySelectorAll(".atcb-modal[data-modal-nr]").length < 2) toggle(host, "close");
}
//#endregion
//#region src/styles/css-template.ts
/**
* Style registry.
*
* The build inlines the shared core (tokens + core rules) and the DEFAULT style delta
* into the template map below - unless building the unstyle variants. All other style
* deltas load on demand:
*  - script tag / CDN: fetched relative to the script's own origin ({base}/styles/{name}.css),
*    overridable via the style-source attribute
*  - npm: import the style module (dist/styles/{name}.js), which registers itself via
*    register_style
* The load-all-styles attribute prefetches every delta for runtime style switching.
*/
var atcbCssTemplate = {
	"core": ":host(.atcb-dark){--accent-color:#7ab0ff;--btn-text:#f2f4f7;--list-text:#f2f4f7;--modal-text:#f1f1f1;--modal-background:#242424;--modal-btn-background:#181819;--modal-btn-secondary-background:#2e2d30;--modal-btn-hover-background:#434246;--modal-btn-text:#dbdbdb;--modal-btn-hover-text:#fff;--modal-btn-secondary-text:#b8b8b8;--input-background:#434246;--status-active-text:#000;--form-error:#db8680;--form-success:#99de9c;--date-btn-text:#f2f4f7;--date-btn-text-secondary:#98a2b3;--date-btn-cal-day-text:#101216;--date-btn-cal-background:#c9ccd2;--date-badge-ink:#0b0d10;--date-btn-hover-background:#2b2f35;--icon-yahoo-color:#bebebe}:host{--modal-border-radius:0px}:where(a.atcb-button,a.atcb-list-item,a.atcb-subevent-btn){all:unset;box-sizing:border-box}.atcb-button-wrapper,.atcb-list,.atcb-modal-box{font-size:var(--base-font-size-l)}@media (width <= 991px){.atcb-button-wrapper,.atcb-list,.atcb-modal-box{font-size:var(--base-font-size-m)}}@media (width <= 575px){.atcb-button-wrapper,.atcb-list,.atcb-modal-box{font-size:var(--base-font-size-s)}}.atcb-button-wrapper{display:block;padding:var(--wrapper-padding);position:relative}.atcb-rtl .atcb-button{direction:rtl;text-align:right}.atcb-icon svg{fill:currentcolor;height:100%;width:100%}.atcb-chevron svg[fill=none],.atcb-date-btn-content-icon svg[fill=none],.atcb-date-btn-plus svg[fill=none],.atcb-icon svg[fill=none]{fill:none}.atcb-text{overflow-wrap:anywhere}[part=atcb-button-text]{text-align:left}.atcb-rtl [part=atcb-button-text]{text-align:right}.atcb-button .atcb-icon+.atcb-text{margin-top:.07em}.atcb-rtl .atcb-list-item{direction:rtl;text-align:right}.atcb-list-item .atcb-icon+.atcb-text{width:100%}.atcb-list-modal-header{align-items:center;display:flex;gap:40px;justify-content:space-between;padding-block:.6em;padding-inline:1em .6em}.atcb-list-modal-headline{flex:1 1 auto;font-weight:700;font-size:1.05em;padding-top:.1em;text-align:left}.atcb-list.atcb-rtl .atcb-list-modal-headline{text-align:right}.atcb-list.atcb-modal .atcb-list-item-close{flex:0 0 auto;position:static}.atcb-list.atcb-modal .atcb-list-item-close .atcb-text{display:none}.atcb-list.atcb-modal .atcb-list-item-close .atcb-icon{height:100%;width:100%;margin:0}.atcb-modal{display:block;margin:auto;width:auto;min-width:auto;position:relative;z-index:14000090}.atcb-list.atcb-modal{min-width:auto;overflow:hidden}@media (width <= 575px){.atcb-list.atcb-modal{border:0;border-radius:0;box-shadow:none;margin:0;min-height:100dvh;min-width:100%;width:100%}}.atcb-modal-box.atcb-rtl{text-align:right;direction:rtl;padding:1.25em 1em 1.25em 2em}.atcb-modal-icon svg{fill:currentcolor;height:100%;width:100%}.atcb-modal-content ol,.atcb-modal-content ul{margin:1em 0;text-align:left;width:fit-content}.atcb-rtl .atcb-modal-content ol,.atcb-rtl .atcb-modal-content ul{text-align:right}.atcb-modal-content-subevents{max-width:320px}@media (width <= 575px){.atcb-modal-content-subevents{margin:auto;max-width:380px}}.atcb-modal-clipboard-input{background-color:transparent;border:1px solid currentcolor;border-radius:6px;box-sizing:border-box;color:inherit;cursor:text;direction:ltr;font-family:monospace;font-size:.9em;margin:.5em 0;max-width:100%;padding:.5em .6em;width:100%}a.atcb-modal-btn.btn-small,button.atcb-modal-btn.btn-small{padding:.6em .8em}a.atcb-modal-btn.atcb-modal-btn-primary,button.atcb-modal-btn.atcb-modal-btn-primary{background-color:var(--modal-btn-background);color:var(--modal-btn-text)}a.atcb-modal-btn:focus-visible,button.atcb-modal-btn:focus-visible{background-color:var(--modal-btn-hover-background);outline:2px solid var(--accent-color)}a.atcb-modal-btn:disabled,button.atcb-button:disabled,button.atcb-modal-btn:disabled,button.atcb-subevent-btn:disabled{cursor:not-allowed;opacity:.75;filter:brightness(95%);border-style:dashed;box-shadow:none}.atcb-subevent-btn+.atcb-subevent-btn{margin-top:30px}.atcb-date-btn-day{color:var(--date-btn-cal-day-text);font-weight:600;font-size:1.7em;line-height:1.15;word-break:keep-all}.atcb-initialized[lang=ja] .atcb-date-btn-day,.atcb-initialized[lang=ko] .atcb-date-btn-day,.atcb-initialized[lang=zh] .atcb-date-btn-day{font-size:1.3em}.atcb-date-btn-month{color:var(--date-btn-cal-month-text);font-weight:700;font-size:.68em;letter-spacing:.14em;text-transform:uppercase}.atcb-date-btn-right{position:relative;color:var(--date-btn-text);min-width:13.5em;overflow-wrap:anywhere}@media (width <= 414px){.atcb-date-btn-day{font-size:1.7em}.atcb-date-btn-month{font-size:.8em}.atcb-date-btn-right{min-width:10em}}.atcb-date-btn-right-centered{align-self:center}.atcb-subevent-btn .atcb-date-btn-right{width:100%}.atcb-rtl .atcb-date-btn-details{text-align:right}.atcb-date-btn-hover{position:absolute;top:0;left:0;width:100%;opacity:0;height:100%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:1em;padding:.4em 1.2em .4em .7em;box-sizing:border-box}.atcb-date-btn-content{display:flex;align-items:flex-start;font-size:.8em;color:var(--date-btn-text-secondary)}.atcb-date-btn-content-clamped{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2}.atcb-date-btn-content.atcb-date-btn-cancelled{color:var(--form-error);font-weight:700}.atcb-date-btn-content-location{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.atcb-date-btn-content-icon{display:inline-block;height:.9em;margin:.075em .4em 0 0;width:.9em;flex-shrink:0}.atcb-rtl .atcb-date-btn-content-icon{margin-right:0;margin-left:.4em}.atcb-initialized[lang=ja] .atcb-date-btn-content:not(.atcb-date-btn-content-location) .atcb-date-btn-content-icon,.atcb-initialized[lang=ko] .atcb-date-btn-content:not(.atcb-date-btn-content-location) .atcb-date-btn-content-icon,.atcb-initialized[lang=zh] .atcb-date-btn-content:not(.atcb-date-btn-content-location) .atcb-date-btn-content-icon{margin-top:.15em}.atcb-date-btn-content-icon svg{height:100%;fill:currentcolor;width:100%}.atcb-date-btn-content-text span:not(.atcb-icon-ical){padding-right:.3em;display:inline-block}.atcb-button:focus-visible .atcb-date-btn-plus,.atcb-subevent-btn:focus-visible .atcb-date-btn-plus{background-color:var(--accent-color)}.atcb-checkmark{display:none}.atcb-modal-host-initialized{width:100%;height:100%}#atcb-bgoverlay.atcb-no-bg{animation:none;backdrop-filter:none;-webkit-backdrop-filter:none;opacity:1;background-color:transparent}@keyframes atcb-bgoverlay-animate{0%{opacity:0}100%{opacity:1}}@keyframes atcb-modal-appear{0%{opacity:0}100%{opacity:1}}.atcb-modal.atcb-modal-appear{animation:atcb-modal-appear .15s ease 0s 1 normal both}.atcb-icon.atcb-icon-ms365 svg{fill:var(--icon-ms365-color)}.atcb-icon.atcb-icon-yahoo svg{fill:var(--icon-yahoo-color)}.atcb-icon.atcb-icon-google svg,.atcb-icon.atcb-icon-msteams svg,.atcb-icon.atcb-icon-outlookcom svg{filter:var(--icon-filter)}.pro{text-align:left}.atcb-modal-box.atcb-rtl .pro{text-align:right}.pro .pro-intro{text-align:inherit}.pro a:not(.atcb-modal-btn),.pro a:not(.atcb-modal-btn):active,.pro a:not(.atcb-modal-btn):visited{color:var(--modal-btn-text);text-decoration:underline;text-decoration-thickness:2px;text-decoration-color:var(--accent-color)}.pro a:not(.atcb-modal-btn):hover{color:var(--accent-color);text-decoration:none}.pro .pro-share-buttons{display:flex;flex-wrap:wrap;justify-content:center}.pro-field+.pro-field{padding-top:1.3em}.pro-field-type-label+.pro-field-type-radio{padding-top:0}.pro-field-type-checkbox,.pro-field-type-radio div{align-items:center;display:flex}.pro-field-type-checkbox input,.pro-field-type-radio input{cursor:pointer}.pro-field label{display:block;font-size:.9em;opacity:.7}.pro-field-type-checkbox label,.pro-field-type-radio label{cursor:pointer;opacity:.8;padding-left:.3em}.pro-field input[type=checkbox],.pro-field input[type=radio]{accent-color:var(--accent-color);height:1.2rem;opacity:.8;transition:all .1s ease-in-out;width:1.2em}.pro-field input:disabled,.pro-field input:disabled+label{cursor:not-allowed;opacity:.75;filter:brightness(95%)}.pro-field input:not([disabled]):hover{opacity:1}.pro-field input[type=checkbox]:focus,.pro-field input[type=radio]:focus{outline-color:var(--accent-color);outline-width:2px}#submit-error{color:var(--form-error);display:none;font-weight:700;padding-top:1.5em;text-align:center}#submit-error:focus{outline:2px solid var(--accent-color);outline-offset:2px}.pro-form.form-error #submit-error{display:block}.pro-field input.error{accent-color:var(--form-error);border:2px solid var(--form-error)}.pro-field input.error+label,.pro-field:has(input.error) label{color:var(--form-error);opacity:1}.pro-form.form-error .pro-form-fine{opacity:0}@media (width > 575px){#pro-form-submit,.pro-waiting{min-width:200px}}.pro-waiting span:not(.atcb-icon-ical):not(.atcb-sr-only){animation-name:blink;animation-duration:1s;animation-iteration-count:infinite;animation-fill-mode:both;font-size:2.5em}.pro-field label span:not(.atcb-icon-ical){color:var(--form-error);font-weight:700;padding-left:2px}.pro-waiting span:not(.atcb-icon-ical):not(.atcb-sr-only):nth-child(2){animation-delay:.15s}.pro-waiting span:not(.atcb-icon-ical):not(.atcb-sr-only):nth-child(3){animation-delay:.3s}.atcb-sr-only{border:0;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px}@keyframes blink{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}.atcb-modal-content .pro p:not(.pro-form-fine){margin:0}.atcb-modal-content .pro p.pro-pt{margin-top:1.5em}.atcb-modal-content .pro .pro-field p{font-size:.9em}.pro .btn-flex{align-items:center;display:flex}.pro .atcb-modal-btn svg{fill:none;height:1.5em;margin-right:.5em;stroke:currentcolor;width:auto}#atcb-reference{box-sizing:border-box;color:#000;filter:drop-shadow( 1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow( 0 1px 0 #fff) drop-shadow( 0 -1px 0 #fff);height:auto;padding:8px 0;text-align:center;transform:translate3d(0,0,0);width:100%;z-index:15000000}#atcb-reference.fixed-ref{position:fixed;bottom:10px;right:40px;width:auto}.atcb-modal-host-initialized #atcb-reference.atcb-dropup{text-align:left}:host(.atcb-dark) #atcb-reference{color:#fff;filter:drop-shadow( 1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow( 0 1px 0 #000) drop-shadow( 0 -1px 0 #000)}#atcb-reference a,#atcb-reference a:active,#atcb-reference a:visited{opacity:.8;width:150px;max-width:100%;margin:auto;display:inline-block;text-decoration:none}#atcb-reference a:hover{opacity:1;text-decoration:none}#atcb-reference svg{fill:var(--list-text)}:host{width:fit-content;--font:arial,helvetica,\"Twemoji Mozilla\",\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"EmojiOne Color\",\"Android Emoji\",sans-serif;--accent-color:#2f6fed;--input-background:#fff;--status-active-text:#fff;--form-error:#c5372c;--form-success:#338a36;--modal-background:#f5f5f5;--modal-btn-secondary-background:#e2e1e6;--modal-btn-font-weight:600;--modal-btn-text:#2e2e2e;--date-btn-text:#1d1d1e;--date-btn-cal-day-text:#fff;--date-btn-cal-month-text:#c9ccd2;--date-btn-cal-background:#2f3134;--date-badge-ink:#fff;--date-btn-hover-background:#fff;--date-btn-headline-line-clamp:1;--icon-ms365-color:#ea3e23;--icon-yahoo-color:#5f01d1;--icon-filter:none}.atcb-button{gap:.55em;position:relative;z-index:1}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay){z-index:15000000}.atcb-button.atcb-active.atcb-dropoverlay{z-index:14000090}.atcb-icon{flex-grow:0;flex-shrink:0;line-height:1em}.atcb-chevron{flex-grow:0;flex-shrink:0;height:.8em;width:.8em;opacity:.55;transition:transform .16s ease}.atcb-chevron svg{display:block;height:100%;width:100%}.atcb-button.atcb-active .atcb-chevron{transform:rotate(180deg)}@media (prefers-reduced-motion:reduce){.atcb-chevron{transition:none}}.atcb-dropdown-anchor{width:100%;opacity:0;position:absolute}.atcb-list-wrapper{box-sizing:border-box;position:absolute}.atcb-list{box-sizing:border-box;color:var(--list-text);display:block;font-family:var(--font);position:relative;user-select:none;-webkit-user-select:none;width:fit-content}.atcb-list-item{align-items:center;background-color:var(--list-background);box-sizing:border-box;cursor:pointer;display:flex;gap:.8em;font-size:1em;margin:.2em 0;line-height:1.75em;text-align:left;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.atcb-list-item:hover{background-color:var(--list-hover-background);color:var(--list-hover-text)}.atcb-list-item:focus-visible{background-color:var(--list-hover-background);color:var(--accent-color);outline:0}.atcb-list-item .atcb-icon{margin:0 auto}.atcb-list.atcb-no-text .atcb-list-item:not(.atcb-list-item-close) .atcb-icon{margin-left:0;margin-right:auto}.atcb-list.atcb-rtl.atcb-no-text .atcb-list-item:not(.atcb-list-item-close) .atcb-icon{margin-left:auto;margin-right:0}.atcb-modal-box{background-color:var(--modal-background);border-radius:var(--modal-border-radius);color:var(--modal-text);cursor:default;box-sizing:border-box;font-family:var(--font);line-height:1.5em;text-align:left;user-select:none;-webkit-user-select:none;touch-action:manipulation;width:100%;margin-bottom:20px;-webkit-tap-highlight-color:transparent;overflow:hidden;position:relative}.atcb-modal-box-with-icon{column-gap:1.5em;display:grid;grid-template-columns:auto minmax(0,1fr)}.atcb-modal-box-with-icon.atcb-rtl{grid-template-columns:minmax(0,1fr) auto}.atcb-modal-box-with-icon>:not(.atcb-modal-icon,.atcb-modal-close){grid-column:2}.atcb-modal-box-with-icon.atcb-rtl>:not(.atcb-modal-icon,.atcb-modal-close){grid-column:1}.atcb-modal-box-with-icon.atcb-rtl>.atcb-modal-buttons,.atcb-modal-box-with-icon>.atcb-modal-buttons{grid-column:1/-1}.atcb-list-item-close,.atcb-modal-close{align-items:center;background:0 0;border:0;border-radius:100%;box-sizing:border-box;color:var(--modal-btn-text);cursor:pointer;display:flex;height:2.2em;justify-content:center;padding:.65em;touch-action:manipulation;width:2.2em;-webkit-tap-highlight-color:transparent;z-index:1}.atcb-modal-close{inset-inline-end:.7em;position:absolute;top:.7em}.atcb-list-item-close:focus-visible,.atcb-list-item-close:hover,.atcb-modal-close:focus-visible,.atcb-modal-close:hover{background-color:var(--modal-btn-hover-background);color:var(--modal-btn-hover-text);outline:1px solid var(--modal-btn-hover-text)}.atcb-list-item-close:focus-visible,.atcb-modal-close:focus-visible{outline:2px solid var(--accent-color)}.atcb-list-item-close svg,.atcb-modal-close svg{fill:currentcolor;height:100%;width:100%}:host(.atcb-dark) .atcb-list-item-close,:host(.atcb-dark) .atcb-modal-close{color:var(--modal-text)}:host(.atcb-dark) .atcb-list-item-close:focus-visible,:host(.atcb-dark) .atcb-list-item-close:hover,:host(.atcb-dark) .atcb-modal-close:focus-visible,:host(.atcb-dark) .atcb-modal-close:hover{color:var(--modal-btn-hover-text)}@media (width > 575px){.atcb-modal-box{width:32em}}@media (width <= 575px){.atcb-modal-box{border-radius:0;display:flex;filter:none;flex-direction:column;margin-bottom:0;min-height:100%;overflow:visible}}@media (width <= 575px){.atcb-modal-host-initialized #atcb-bgoverlay{padding:0;background-color:var(--modal-background)}}@media (width <= 575px){.atcb-modal{width:100%;min-height:100dvh;margin:0}}@media (width <= 575px){.atcb-modal-buttons{border-radius:0;margin-top:auto}}.atcb-modal-icon{height:2.5em;grid-column:1;grid-row:1/span 20;margin-block-start:1.8em;margin-inline-start:2em;width:2.5em}.atcb-modal-box.atcb-rtl .atcb-modal-icon{grid-column:2}.atcb-modal-headline{font-size:1.3em;font-weight:600;line-height:1.5em;padding:1.8em 1.5em 1.3em;text-transform:var(--modal-headline-text-transform);text-align:left}.atcb-modal-box.atcb-rtl .atcb-modal-headline{text-align:right}.atcb-modal-content{font-size:1em;padding:.3em 2em 2.2em}.atcb-modal-box-with-icon .atcb-modal-content,.atcb-modal-box-with-icon .atcb-modal-headline{padding-inline-start:0}@media (width <= 575px){.atcb-modal-icon{margin:1.8em auto 0}.atcb-modal-box.atcb-rtl .atcb-modal-icon{margin-inline:auto}}@media (width <= 575px){.atcb-modal-box.atcb-rtl .atcb-modal-headline,.atcb-modal-headline{padding:1.8em 1em 1em;text-align:center}.atcb-modal-box-with-icon .atcb-modal-headline{padding-inline:1em}}@media (width <= 575px){.atcb-modal-content{padding:.3em 1.5em 1.5em;text-align:center}.atcb-modal-box-with-icon .atcb-modal-content{padding-inline:1.5em}.atcb-modal-content .pro,.atcb-modal-content .pro-form,.atcb-modal-content .pro-intro{text-align:left}.atcb-modal-box.atcb-rtl .atcb-modal-content .pro,.atcb-modal-box.atcb-rtl .atcb-modal-content .pro-form,.atcb-modal-box.atcb-rtl .atcb-modal-content .pro-intro{text-align:right}}.atcb-modal-buttons{background-color:var(--modal-btn-bar);box-sizing:border-box;padding:.6em;text-align:center;width:100%;display:flex;justify-content:center;flex-flow:row-reverse wrap;align-items:center}a.atcb-modal-btn,button.atcb-modal-btn{background-color:var(--modal-btn-secondary-background);color:var(--modal-btn-secondary-text);cursor:pointer;display:inline-block;font-family:var(--font);font-weight:var(--modal-btn-font-weight);line-height:1em;padding:1em 1.25em;position:relative;text-align:center;text-decoration:none;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{background-color:var(--modal-btn-hover-background);color:var(--modal-btn-hover-text);text-decoration:none}.atcb-subevent-btn{width:100%}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{background-color:var(--date-btn-hover-background)}.atcb-date-btn-left{align-self:stretch;background-color:var(--date-btn-cal-background);padding:.6em .5em;width:3.2em;align-items:center;justify-content:center;text-align:center;display:flex;flex-direction:column;flex-shrink:0;box-sizing:border-box}@media (width <= 414px){.atcb-date-btn-left{width:fit-content}}@media (width <= 575px){dialog .atcb-list.atcb-modal{display:flex;flex-direction:column}}@media (width <= 575px){dialog .atcb-list-item{padding:1.3em}}.atcb-date-btn-details{opacity:1;text-align:left}.atcb-date-btn-headline{font-weight:600;overflow:hidden;display:-webkit-box;-webkit-line-clamp:var(--date-btn-headline-line-clamp);line-clamp:var(--date-btn-headline-line-clamp)}.atcb-date-btn-headline-two-lines{-webkit-line-clamp:2;line-clamp:2}.atcb-date-btn-headline-centered{text-align:center}.atcb-date-btn-content+.atcb-date-btn-content{padding-right:.6em}.atcb-date-btn-plus{position:absolute;right:-.7em;top:50%;transform:translateY(-50%);background:var(--accent-color);border-radius:100%;box-shadow:0 0 0 .14em var(--date-btn-background);color:var(--date-badge-ink,#fff);display:flex;font-size:.9em;font-weight:400;height:1.5em;width:1.5em;justify-content:center;align-items:center;transition:transform .16s ease}.atcb-date-btn-plus svg{height:.75em;width:.75em}.atcb-rtl .atcb-date-btn-plus{right:auto;left:-.7em}.atcb-button:not(.atcb-active):hover .atcb-date-btn-plus,.atcb-subevent-btn:hover .atcb-date-btn-plus{transform:translateY(-50%) scale(1.12)}.atcb-button.atcb-active .atcb-date-btn-plus{transform:translateY(-50%) rotate(45deg)}@media (prefers-reduced-motion:reduce){.atcb-date-btn-plus{transition:none}.atcb-button:not(.atcb-active):hover .atcb-date-btn-plus,.atcb-subevent-btn:hover .atcb-date-btn-plus{transform:translateY(-50%)}}.atcb-saved .atcb-checkmark{box-sizing:content-box;color:var(--btn-text);display:block;position:absolute;padding:.5em;border-radius:100%}.atcb-checkmark svg{height:100%;width:auto}#atcb-bgoverlay{background-color:var(--overlay-background);border:0;box-sizing:border-box;display:flex;height:100dvh;inset-inline:0;left:0;right:0;top:0;min-height:100%;min-width:100%;overflow-y:auto;padding:20px;position:fixed;width:100dvw;z-index:14000000}.pro-form{text-align:left}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{background-color:var(--input-background);border-radius:var(--input-border-radius);box-sizing:border-box;caret-color:var(--accent-color);color:var(--modal-text);font-size:.9em;opacity:.8;padding:.7em;transition:all .1s ease-in-out;width:100%}#pro-form-submit{display:block;margin:auto;min-width:150px}.pro-form-fine{font-size:.8em;opacity:.5;text-align:center}.pro-waiting{background-color:var(--modal-btn-background);border-radius:var(--btn-border-radius);box-sizing:border-box;color:var(--modal-btn-text);cursor:wait;display:none;line-height:.5em;margin:auto;min-width:150px;padding:.5em 1.25em 1.2em;text-align:center;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:fit-content}#atcb-reference.atcb-dropup{position:absolute}:host:has(.atcb-group-overview){box-sizing:border-box;display:block;max-width:100%!important;width:min(600px,100%)!important}:host:has(.atcb-group-overview.atcb-group-overview-cards){width:min(1200px,100%)!important}.atcb-group-overview{box-sizing:border-box;color:#1b1f24;display:block;font-family:Arial,Helvetica,sans-serif;max-width:100%;width:100%}.atcb-group-overview.atcb-group-overview-cards{container-name:atcb-group-overview-cards;container-type:inline-size}.atcb-group-overview *{box-sizing:border-box}.atcb-group-overview-controls{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 1.25em;width:100%}.atcb-group-overview-results{display:block;width:100%}.atcb-group-overview-select{appearance:none;background-color:#fff;background-image:linear-gradient(45deg,transparent 50%,#1b1f24 50%),linear-gradient(135deg,#1b1f24 50%,transparent 50%);background-position:calc(100% - .8em) 50%,calc(100% - .55em) 50%;background-repeat:no-repeat;background-size:.25em .25em;border:1px solid #111;border-radius:4px;color:#1b1f24;cursor:pointer;font:inherit;font-weight:700;padding:.55em 2.3em .55em .85em}.atcb-group-overview-select:focus:not(:focus-visible){outline:0}.atcb-group-overview-select:focus-visible{outline:2px solid #111;outline-offset:2px}.atcb-group-overview-month{font-size:1.15em;margin:24px 0 10px}.atcb-group-overview-items{display:flex;flex-direction:column;gap:.7em;list-style:none;margin:0;padding:0}.atcb-group-overview-items:has(> .atcb-group-overview-item-with-add){padding-right:1.35em}.atcb-group-overview-items.atcb-group-overview-list{max-width:600px;width:100%}.atcb-group-overview-items.atcb-group-overview-list>.atcb-group-overview-item{width:100%}.atcb-group-overview-items.atcb-group-overview-cards{display:grid;gap:1.4em;grid-template-columns:minmax(0,1fr);max-width:1200px;width:100%}.atcb-group-overview-items.atcb-group-overview-cards>.atcb-group-overview-item{min-width:0}@container atcb-group-overview-cards (width >= 600px){.atcb-group-overview-items.atcb-group-overview-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@container atcb-group-overview-cards (width >= 1000px){.atcb-group-overview-items.atcb-group-overview-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}.atcb-group-overview-item{background:#fff;border:1px solid #d7dbe0;border-radius:4px;box-shadow:rgb(16 24 40 / 9%) 0 1px 3px;min-height:4.5em;min-width:0;padding:0;position:relative;transition:border-color .15s ease,box-shadow .15s ease}.atcb-group-overview-event-link{align-items:stretch;color:inherit;display:flex;min-height:inherit;text-decoration:none;width:100%}.atcb-group-overview-event-link:focus-visible{border-radius:2px;outline:2px solid #111;outline-offset:2px}.atcb-group-overview-items:not(.atcb-group-overview-compact)>.atcb-group-overview-item-no-details:hover,.atcb-group-overview-items:not(.atcb-group-overview-compact)>.atcb-group-overview-item:hover:not(.atcb-group-overview-item-no-add):not(:has(.atcb-group-overview-add:hover)){border-color:#bfc5cd;box-shadow:rgb(16 24 40 / 15%) 0 .4em 1em}.atcb-group-overview-day{align-items:center;background:#282a2e;clip-path:inset(0 round 3px 0 0 3px);color:#fff;display:flex;flex:0 0 3.2em;justify-content:center;padding:.6em .8em;text-align:center;min-width:56px}.atcb-group-overview-day-value{font-size:1.7em;font-weight:600;line-height:1.15}.atcb-group-overview-content{min-width:0;padding:.7em 1.4em .7em .8em;width:100%}.atcb-group-overview-title{color:inherit;display:-webkit-box;font-size:.95em;font-weight:600;overflow:hidden;text-decoration:none;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2}.atcb-group-overview-meta{display:flex;flex-direction:column;align-items:flex-start;color:#667085;font-size:.78em;gap:3px;margin:10px 0}.atcb-group-overview-meta-item{align-items:center;display:inline-flex;gap:.35em}.atcb-group-overview-meta-icon{display:inline-flex;flex:0 0 1em;height:1em;width:1em}.atcb-group-overview-meta-icon svg{height:100%;width:100%}.atcb-group-overview-description{color:#667085;display:-webkit-box;font-size:.8em;line-height:1.35;margin:.45em 0 0;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2}.atcb-group-overview-cards .atcb-group-overview-description{-webkit-line-clamp:3;line-clamp:3}.atcb-group-overview-add{align-items:center;background:#fff;border:1px solid #d7dbe0;border-radius:50%;color:#111;cursor:pointer;display:inline-flex;box-shadow:rgb(16 24 40 / 14%) 0 2px 5px;flex:0 0 1.8em;font-size:1em;height:1.8em;justify-content:center;line-height:1;padding:0;position:absolute;right:-.9em;text-decoration:none;top:calc(50% - .9em);touch-action:manipulation;width:1.8em;z-index:2;transition:background-color .15s ease,border-color .15s ease,color .15s ease}.atcb-group-overview-add:focus-visible,.atcb-group-overview-add:hover{background:#111;border-color:#111;color:#fff}.atcb-group-overview-item-no-details .atcb-group-overview-event-link:focus-visible .atcb-group-overview-add,.atcb-group-overview-item-no-details:hover .atcb-group-overview-add{background:#111;border-color:#111;color:#fff}.atcb-group-overview-add:focus-visible{outline:2px solid #111;outline-offset:2px}.atcb-group-overview-cards .atcb-group-overview-content{padding:1em}.atcb-group-overview-cards .atcb-group-overview-meta-datetime{color:#111;font-size:1em;font-weight:600;margin-bottom:.5em}.atcb-group-overview-cards .atcb-group-overview-title{border-bottom:1px solid #d7dbe0;border-top:1px solid #d7dbe0;padding:.65em 0}.atcb-group-overview-compact.atcb-group-overview-items{display:list-item;list-style-type:disc;gap:10px}.atcb-group-overview-compact>.atcb-group-overview-item{background:0 0;border:0;border-radius:0;box-shadow:none;min-height:0;margin:0 0 10px 20px}.atcb-group-overview-compact-row{align-items:center;display:inline-flex;max-width:100%;gap:6px}.atcb-group-overview-compact>:is(.atcb-group-overview-compact-with-add,.atcb-group-overview-compact-with-marker){list-style:none}.atcb-group-overview-compact:has(:is(.atcb-group-overview-compact-with-add,.atcb-group-overview-compact-with-marker))>.atcb-group-overview-item{margin-left:0}.atcb-group-overview-compact .atcb-group-overview-add{flex:0 0 1.8em;margin-right:.4em;position:static}.atcb-group-overview-compact-marker{align-items:center;display:inline-flex;flex:0 0 1.8em;height:1.8em;justify-content:center;line-height:1;margin-right:.4em;width:1.8em}.atcb-group-overview-empty{font-size:.9em;margin:12px 0}@media (width <= 414px){.atcb-group-overview-day{flex-basis:auto;width:fit-content;min-width:43px;padding:.6em .5em}.atcb-group-overview-day-value{font-size:1.5em}}@media (width <= 575px){.atcb-group-overview-meta-location{max-width:100%;width:100%}.atcb-group-overview-meta-location .atcb-group-overview-meta-text{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}",
	"default": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-background:#fff;--btn-hover-background:#f7f8fa;--btn-hover-border:#bfc5cd;--btn-border:#d7dbe0;--btn-border-radius:10px;--btn-padding-x:1.09em;--btn-padding-y:.7em;--btn-font-weight:600;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--btn-shadow:rgb(16 24 40 / 7%) 0 1px 2px;--btn-hover-shadow:rgb(16 24 40 / 11%) 0 3px 8px;--btn-active-shadow:rgb(16 24 40 / 13%) 0 4px 10px -1px;--list-background:#fff;--list-border-color:#e4e7ec;--list-hover-background:#f2f4f7;--list-text:#1b1f24;--list-font-weight:400;--list-hover-text:#1b1f24;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-radius:12px;--list-padding:.6em .75em;--list-shadow:rgb(16 24 40 / 25%) 0 12px 32px -8px,rgb(16 24 40 / 8%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) 0 4px 34px -3px,rgb(0 0 0 / 14%) 0 2px 12px -2px;--input-border-radius:6px;--modal-text:#000;--modal-border-radius:6px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-border:#d2d2d2;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(0 0 0 / 08%) 0 4px 14px -2px,rgb(0 0 0 / 08%) 0 2px 6px -1px;--modal-btn-hover-shadow:rgb(0 0 0 / 14%) 0 5px 17px -2px,rgb(0 0 0 / 12%) 0 3px 8px -2px;--modal-headline-text-transform:none;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--date-btn-shadow:rgb(16 24 40 / 9%) 0 1px 3px;--date-btn-hover-shadow:rgb(16 24 40 / 15%) 0 6px 16px -4px;--checkmark-background:drop-shadow(0 0 4px #fff);--overlay-background:rgb(20 20 20 / 25%)}:host(.atcb-dark){--btn-background:#24272c;--btn-hover-background:#2b2f35;--btn-hover-border:#4a5058;--btn-border:#3b4046;--btn-hover-text:#f2f4f7;--btn-shadow:rgb(0 0 0 / 35%) 0 1px 2px;--btn-hover-shadow:rgb(0 0 0 / 45%) 0 3px 8px;--btn-active-shadow:rgb(0 0 0 / 50%) 0 4px 10px -1px;--list-background:#24272c;--list-border-color:#373c43;--list-hover-background:#2f343b;--list-hover-text:#f2f4f7;--list-close-background:#282828;--list-close-text:#777;--list-shadow:rgb(0 0 0 / 60%) 0 12px 32px -8px,rgb(0 0 0 / 30%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) -1px 3px 34px 2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--modal-btn-shadow:rgb(255 255 255 / 3%) -2px -2px 14px,rgb(0 0 0 / 10%) 3px 3px 14px -2px,rgb(0 0 0 / 12%) 1px 2px 10px -1px;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--date-btn-shadow:rgb(0 0 0 / 40%) 0 1px 3px;--checkmark-background:drop-shadow(0 0 4px #0a0a0a);--overlay-background:rgb(20 20 20 / 60%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:1px solid var(--btn-border);border-radius:var(--btn-border-radius);box-shadow:var(--btn-shadow);box-sizing:content-box;color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:0;max-width:300px;padding:var(--btn-padding-y) var(--btn-padding-x);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button:not(.atcb-no-text,.atcb-modal-style,.atcb-dropoverlay,.atcb-single){min-width:calc(11.6em - 2 * var(--btn-padding-x))}.atcb-button.atcb-no-text{display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-hover-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button.atcb-single:not([disabled]):focus,.atcb-button.atcb-single:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-active-shadow);color:var(--btn-hover-text)}.atcb-button:not([disabled]).atcb-no-text.atcb-active,.atcb-button:not([disabled]).atcb-no-text:focus,.atcb-button:not([disabled]).atcb-no-text:hover{height:3em;width:3em;padding:0!important}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:4px;height:1px}.atcb-list-wrapper{font-weight:var(--list-font-weight);padding:0;z-index:14000090}.atcb-list-wrapper.atcb-dropoverlay{z-index:15000000;max-width:max-content}.atcb-list{background-color:var(--list-background);border:1px solid var(--list-border-color);border-radius:var(--list-border-radius);box-shadow:var(--list-shadow);min-width:100%;padding:.3em}.atcb-list-wrapper.atcb-dropdown:not(.atcb-dropup,.atcb-dropoverlay) .atcb-list{margin-top:.7em}.atcb-list-wrapper.atcb-dropup .atcb-list{margin-bottom:.7em}.atcb-list-item{background-color:transparent;border-radius:8px;padding:var(--list-padding)}.atcb-dropoverlay .atcb-list,.atcb-list.atcb-modal{border-radius:var(--list-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:1px solid var(--modal-btn-border)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-checkmark,.atcb-button.atcb-single:focus .atcb-checkmark,.atcb-button.atcb-single:hover .atcb-checkmark{top:-.77em;right:-.37em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-trigger{padding-bottom:.05em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:1px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:1px solid var(--modal-btn-text);border-radius:var(--input-border-radius);box-shadow:var(--btn-shadow);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);box-shadow:var(--btn-hover-shadow);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{box-shadow:var(--btn-hover-shadow);opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}"
};
var atcbStyleRelPath = "../styles/";
var knownStyles = [
	"default",
	"simple",
	"3d",
	"flat",
	"round",
	"neumorphism",
	"text",
	"date"
];
var scriptBase = (() => {
	try {
		if (typeof import.meta !== "undefined" && import.meta.url) {
			const src = String(import.meta.url);
			if (src.indexOf("data:") !== 0 && src.lastIndexOf("/") > -1) return resolve_script_base(src);
		}
	} catch (_unused) {}
	try {
		if (typeof document !== "undefined" && document.currentScript && document.currentScript.src) {
			const src = document.currentScript.src;
			return resolve_script_base(src);
		}
	} catch (_unused2) {}
	return "";
})();
var pendingStyleLoads = /* @__PURE__ */ new Map();
/**
* Registers a style delta (css text) under a style name. Public API used by the
* generated style modules (dist/styles/{name}.js) and available for custom setups.
*/
function register_style(name, css) {
	atcbCssTemplate[`${name}`] = css;
}
function style_base(data) {
	if (data.styleSource && data.styleSource !== "") {
		const src = String(data.styleSource);
		return src.endsWith("/") ? src : src + "/";
	}
	if (scriptBase === "") return "";
	return scriptBase + atcbStyleRelPath;
}
async function fetch_style(name, data) {
	const base = style_base(data);
	if (base === "") {
		if (data.debug) console.warn("Add to Calendar Button: style \"" + name + "\" is not registered and no style source could be resolved - import the style module or set the style-source attribute");
		return null;
	}
	try {
		const response = await fetch(base + name + ".css");
		if (!response.ok) throw new Error("status " + response.status);
		const css = await response.text();
		register_style(name, css);
		return css;
	} catch (e) {
		if (data.debug) console.error("Add to Calendar Button: loading style \"" + name + "\" from \"" + base + "\" failed", e);
		return null;
	}
}
/**
* Resolves the full css (core + style delta) for the configured buttonStyle.
* Returns null when nothing should be injected (style none, unstyle builds,
* unknown styles, failed loads): the button stays functional, just unstyled.
*/
async function ensure_style(data) {
	const name = data.buttonStyle || "default";
	if (name === "none") return null;
	const core = atcbCssTemplate["core"];
	if (!core) return null;
	if (atcbCssTemplate[`${name}`]) return core + atcbCssTemplate[`${name}`];
	if (name === "custom") return null;
	if (!pendingStyleLoads.has(name)) pendingStyleLoads.set(name, fetch_style(name, data).finally(() => {
		pendingStyleLoads.delete(name);
	}));
	const css = await pendingStyleLoads.get(name);
	return css === null ? null : core + css;
}
/**
* Prefetches all known style deltas (load-all-styles attribute) so styles can be
* switched at runtime without further requests. Fire-and-forget.
*/
function prefetch_all_styles(data) {
	if (!atcbCssTemplate["core"]) return;
	for (const name of knownStyles) if (!atcbCssTemplate[`${name}`]) ensure_style(_objectSpread2(_objectSpread2({}, data), {}, { buttonStyle: name }));
}
//#endregion
//#region src/core/validate.ts
async function check_required(data) {
	if ((!data.name || data.name === "") && (!data.dates || data.dates.length === 0)) throw new Error("Add to Calendar Button generation failed: required name information missing");
	if (data.dates && data.dates.length > 0) {
		if (data.subscribe === true && data.dates.length > 1) throw new Error("Add to Calendar Button generation failed: a subscription calendar cannot be a multi-date setup");
		const dates = data.dates;
		const requiredMultiField = ["name", "startDate"];
		const requiredMultiFieldFlex = ["name"];
		return requiredMultiField.every(function(field) {
			for (let i = 0; i < dates.length; i++) if (!requiredMultiFieldFlex.includes(`${field}`) && (!dates[`${i}`][`${field}`] || dates[`${i}`][`${field}`] === "") || requiredMultiFieldFlex.includes(`${field}`) && (!dates[`${i}`][`${field}`] || dates[`${i}`][`${field}`] === "") && (!data[`${field}`] || data[`${field}`] === "")) {
				if (!data.subscribe || field !== "startDate") throw new Error("Add to Calendar Button generation failed: required setting missing [dates array object #" + (i + 1) + "/" + dates.length + "] => [" + field + "]");
				else dates[`${i}`].startDate = "today";
			}
			return true;
		});
	} else return ["startDate"].every(function(field) {
		if (!data[`${field}`] || data[`${field}`] === "") {
			if (!data.subscribe || field !== "startDate") throw new Error("Add to Calendar Button generation failed: required setting missing [" + field + "]");
			else data.startDate = "today";
		}
		return true;
	});
}
async function validate(data) {
	const msgPrefix = "Add to Calendar Button generation (" + data.identifier + ")";
	try {
		await validate_icsFile(data, msgPrefix);
		await validate_buttonStyle(data, msgPrefix);
		await validate_subscribe(data, msgPrefix);
		await validate_created(data, msgPrefix);
		await validate_updated(data, msgPrefix);
		await validate_options(data, msgPrefix);
		await validate_date_blocks(data, msgPrefix);
		await validate_rrule(data, msgPrefix);
		await validate_ics_extras(data, msgPrefix);
		if (data.recurrence_simplified) await validate_rrule_simplified(data, msgPrefix);
		return true;
	} catch (e) {
		throw new Error(e.message);
	}
}
async function validate_icsFile(data, msgPrefix, i = "", msgSuffix = "") {
	const icsFileStr = (function() {
		if (i !== "" && data.dates[`${i}`].icsFile) return data.dates[`${i}`].icsFile;
		if (i === "" && data.icsFile) return data.icsFile;
		return "";
	})();
	if (icsFileStr !== "") {
		if (!secure_url(icsFileStr, false) || !/^https:\/\//i.test(icsFileStr)) throw new Error(msgPrefix + " failed: explicit ics file path not valid" + msgSuffix);
		const normalizedIcsFile = icsFileStr.replace(/^https:\/\//i, "https://");
		if (i === "") data.icsFile = normalizedIcsFile;
		else data.dates[`${i}`].icsFile = normalizedIcsFile;
	}
	return true;
}
async function validate_buttonStyle(data, msgPrefix) {
	if (![
		"default",
		"simple",
		"3d",
		"flat",
		"round",
		"neumorphism",
		"text",
		"date",
		"custom",
		"none"
	].includes(data.buttonStyle)) throw new Error(msgPrefix + " failed: provided buttonStyle invalid");
	if (data.customCss && data.customCss !== "" && (!secure_url(data.customCss, false) || !/\.css(?:$|\?)/.test(data.customCss))) throw new Error(msgPrefix + " failed: customCss provided, but no valid url");
	if ((!data.customCss || data.customCss === "") && data.buttonStyle === "custom") throw new Error(msgPrefix + " failed: buttonStyle \"custom\" selected, but no customCss file provided");
	if (data.rsvp && (data.buttonStyle === "date" || data.buttonStyle === "none")) throw new Error(msgPrefix + " failed: buttonStyle " + data.buttonStyle + " is not compatible with the RSVP functionality");
	return true;
}
async function validate_subscribe(data, msgPrefix) {
	if (data.subscribe === true && (!data.icsFile || data.icsFile === "")) throw new Error(msgPrefix + " failed: a subscription calendar requires a valid explicit ics file as well");
	return true;
}
async function validate_created(data, msgPrefix) {
	for (let i = 0; i < data.dates.length; i++) {
		const suffix = data.dates.length > 1 ? " [dates array object #" + (i + 1) + "/" + data.dates.length + "]" : "";
		if (!/^\d{8}T\d{6}Z$/.test(data.dates[`${i}`].icsCreated)) throw new Error(msgPrefix + " failed: icsCreated date format not valid. Needs to be a full ISO-8601 UTC date and time string, formatted YYYYMMDDTHHMMSSZ" + suffix);
	}
	return true;
}
async function validate_updated(data, msgPrefix) {
	for (let i = 0; i < data.dates.length; i++) {
		const suffix = data.dates.length > 1 ? " [dates array object #" + (i + 1) + "/" + data.dates.length + "]" : "";
		if (!/^\d{8}T\d{6}Z$/.test(data.dates[`${i}`].icsUpdated)) throw new Error(msgPrefix + " failed: icsUpdated date format not valid. Needs to be a full ISO-8601 UTC date and time string, formatted YYYYMMDDTHHMMSSZ" + suffix);
	}
	return true;
}
async function validate_options(data, msgPrefix) {
	return data.options.every((option) => {
		if (!options.includes(option)) throw new Error(`${msgPrefix} failed: invalid option [${option}]`);
		return true;
	});
}
async function validate_date_blocks(data, msgPrefix) {
	try {
		for (let i = 0; i < data.dates.length; i++) {
			const msgSuffix = (function() {
				if (data.dates.length === 1) return "";
				else return " [dates array object #" + (i + 1) + "/" + data.dates.length + "] ";
			})();
			await validate_icsFile(data, msgPrefix, i, msgSuffix);
			await validate_status(data, msgPrefix, i, msgSuffix);
			await validate_availability(data, msgPrefix, i, msgSuffix);
			await validate_organizer(data, msgPrefix, i, msgSuffix);
			await validate_attendee(data, msgPrefix, i, msgSuffix);
			await validate_uid(data, msgPrefix, i, msgSuffix);
			await validate_sequence(data, msgPrefix, i, msgSuffix);
			await validate_timezone(data, msgPrefix, i, msgSuffix);
			await validate_datetime(data, msgPrefix, i, msgSuffix);
		}
		return true;
	} catch (e) {
		throw new Error(e.message);
	}
}
async function validate_status(data, msgPrefix, i, msgSuffix) {
	if (![
		"tentative",
		"confirmed",
		"cancelled"
	].includes(data.dates[`${i}`].status.toLowerCase())) throw new Error(msgPrefix + " failed: event status needs to be tentative, confirmed, or cancelled" + msgSuffix);
	return true;
}
async function validate_availability(data, msgPrefix, i, msgSuffix) {
	if (data.dates[`${i}`].availability && data.dates[`${i}`].availability !== "" && data.dates[`${i}`].availability !== "free" && data.dates[`${i}`].availability !== "busy") throw new Error(msgPrefix + " failed: event availability needs to be \"free\" or \"busy\"" + msgSuffix);
	return true;
}
async function validate_organizer(data, msgPrefix, i, msgSuffix) {
	if (data.dates[`${i}`].organizer && data.dates[`${i}`].organizer !== "") {
		const organizerParts = data.dates[`${i}`].organizer.split("|");
		if (organizerParts.length !== 2 || organizerParts[0].length > 50 || organizerParts[1].length > 100 || !validEmail(organizerParts[1])) throw new Error(msgPrefix + " failed: organizer needs to match the schema \"NAME|EMAIL\" with a valid email address, where the name is <50 and email <100 characters" + msgSuffix);
	}
	return true;
}
async function validate_attendee(data, msgPrefix, i, msgSuffix) {
	if (data.dates[`${i}`].attendee && data.dates[`${i}`].attendee !== "") {
		if (!data.dates[`${i}`].organizer || data.dates[`${i}`].organizer === "") throw new Error(msgPrefix + " failed: if an attendee is set, you also need to set the organizer" + msgSuffix);
		const attendeeParts = data.dates[`${i}`].attendee.split("|");
		if (attendeeParts.length === 1 && validEmail(attendeeParts[0])) return true;
		if (attendeeParts.length !== 2 || attendeeParts[0].length > 50 || attendeeParts[1].length > 100 || !validEmail(attendeeParts[1])) throw new Error(msgPrefix + " failed: attendee needs to be a valid email address or match the schema \"NAME|EMAIL\" with EMAIL being a valid email address" + msgSuffix);
	}
	return true;
}
async function validate_uid(data, msgPrefix, i, msgSuffix) {
	if (!/^(?:\w|-){1,254}$/.test(data.dates[`${i}`].uid)) {
		if (data.debug) console.warn(msgPrefix + ": UID not valid. May only contain alpha, digits, and dashes; and be less than 255 characters. Falling back to an automated value!" + msgSuffix);
		data.dates[`${i}`].uid = generate_uuid();
	}
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.dates[`${i}`].uid) && data.debug) console.warn(msgPrefix + ": UID is highly recommended to be a hex-encoded random Universally Unique Identifier (UUID)!" + msgSuffix);
	return true;
}
async function validate_sequence(data, msgPrefix, i, msgSuffix) {
	if (data.dates[`${i}`].sequence && (Number(data.dates[`${i}`].sequence) < 0 || Number(data.dates[`${i}`].sequence) % 1 !== 0)) {
		if (data.debug) console.log(msgPrefix + ": sequence needs to be a full number >= 0. Used the default 0 instead" + msgSuffix);
		data.dates[`${i}`].sequence = 0;
	}
	return true;
}
async function validate_timezone(data, msgPrefix, i, msgSuffix) {
	if (!tzlib_get_timezones().includes(data.dates[`${i}`].timeZone)) throw new Error(msgPrefix + " failed: invalid time zone given" + msgSuffix);
	return true;
}
async function validate_datetime(data, msgPrefix, i, msgSuffix) {
	const selectedDate = data.dates[`${i}`];
	const dates = ["startDate", "endDate"];
	const newDate = {};
	dates.forEach((date) => {
		const dateString = selectedDate[`${date}`];
		if (dateString.length !== 10) throw new Error(`${msgPrefix} failed: date misspelled [${dateString} -> YYYY-MM-DD]${msgSuffix}`);
		const dateParts = dateString.split("-");
		if (dateParts.length !== 3) throw new Error(`${msgPrefix} failed: date misspelled [${date}: ${dateString}]${msgSuffix}`);
		newDate[`${date}`] = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
	});
	["startTime", "endTime"].forEach((time) => {
		const timeString = selectedDate[`${time}`];
		if (timeString) {
			if (timeString.length !== 5) throw new Error(`${msgPrefix} failed: time misspelled [${timeString} -> HH:MM]${msgSuffix}`);
			const timeParts = timeString.split(":");
			if (timeParts.length !== 2 || Number(timeParts[0]) > 23 || Number(timeParts[1]) > 59) throw new Error(`${msgPrefix} failed: time misspelled [${time}: ${timeString}]${msgSuffix}`);
			const dateKey = time === "startTime" ? "startDate" : "endDate";
			newDate[`${dateKey}`] = new Date(newDate[`${dateKey}`].getTime() + parseInt(timeParts[0], 10) * 36e5 + parseInt(timeParts[1], 10) * 6e4);
		}
	});
	if (selectedDate.startTime && !selectedDate.endTime || !selectedDate.startTime && selectedDate.endTime) throw new Error(`${msgPrefix} failed: if you set a starting or end time, the respective other one also needs to be defined${msgSuffix}`);
	if (newDate.endDate < newDate.startDate) throw new Error(`${msgPrefix} failed: end date before start date${msgSuffix}`);
	return true;
}
async function validate_ics_extras(data, msgPrefix) {
	const toList = (value) => {
		if (!value) return [];
		return (Array.isArray(value) ? value : [String(value)]).flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter((item) => item !== "");
	};
	const isHttpUrl = (value) => secure_url(value, false) && /^https?:\/\//i.test(value);
	for (let i = 0; i < data.dates.length; i++) {
		const entry = data.dates[`${i}`];
		const suffix = data.dates.length > 1 ? " [dates array object #" + (i + 1) + "/" + data.dates.length + "]" : "";
		if (entry.icsClass && ![
			"public",
			"private",
			"confidential"
		].includes(String(entry.icsClass).toLowerCase())) throw new Error(msgPrefix + " failed: icsClass needs to be public, private, or confidential" + suffix);
		if (entry.icsPriority !== void 0 && entry.icsPriority !== "") {
			const priority = Number(entry.icsPriority);
			if (!Number.isInteger(priority) || priority < 0 || priority > 9) throw new Error(msgPrefix + " failed: icsPriority needs to be an integer between 0 and 9" + suffix);
		}
		if (entry.icsGeo && !/^-?\d{1,2}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(String(entry.icsGeo).trim())) throw new Error(msgPrefix + " failed: icsGeo needs to be \"latitude,longitude\" decimal coordinates" + suffix);
		if (entry.icsGeo) {
			const [lat, lon] = String(entry.icsGeo).split(",").map((part) => parseFloat(part));
			if (Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error(msgPrefix + " failed: icsGeo coordinates out of range" + suffix);
		}
		if (entry.icsReminder !== void 0 && entry.icsReminder !== "" && !/^\d+$/.test(String(entry.icsReminder)) && !/^-?P(?:\d+[DW])?(?:T(?:\d+[HMS])+)?$/i.test(String(entry.icsReminder))) throw new Error(msgPrefix + " failed: icsReminder needs to be minutes before start (number) or an ISO 8601 duration" + suffix);
		if (entry.icsUrl && !isHttpUrl(String(entry.icsUrl))) throw new Error(msgPrefix + " failed: icsUrl is no valid http(s) url" + suffix);
		for (const attachUrl of toList(entry.icsAttach)) if (!isHttpUrl(attachUrl)) throw new Error(msgPrefix + " failed: icsAttach entries need to be valid http(s) urls" + suffix);
	}
	const exdates = toList(data.icsExdate);
	if (exdates.length > 0) {
		if (!data.recurrence || data.recurrence === "") throw new Error(msgPrefix + " failed: icsExdate requires a recurrence to exclude dates from");
		for (const exdate of exdates) if (!/^\d{4}-\d{2}-\d{2}$/.test(exdate)) throw new Error(msgPrefix + " failed: icsExdate entries need to be formatted as YYYY-MM-DD");
	}
	return true;
}
async function validate_rrule(data, msgPrefix) {
	if (data.recurrence && data.recurrence !== "" && data.dates.length > 1) throw new Error(msgPrefix + " failed: RRULE and multi-date set at the same time");
	if (data.recurrence && data.recurrence !== "" && !/^RRULE:[\w=;,:+\-/\\]+$/i.test(data.recurrence)) throw new Error(msgPrefix + " failed: RRULE data misspelled");
	return true;
}
async function validate_rrule_simplified(data, msgPrefix) {
	if (data.recurrence_interval && (Number(data.recurrence_interval) < 1 || Number(data.recurrence_interval) % 1 !== 0)) throw new Error(msgPrefix + " failed: recurrence data (interval) misspelled");
	if (data.recurrence_until && data.recurrence_until !== "" && !/^\d{8}T\d{6}Z$/.test(data.recurrence_until)) throw new Error(msgPrefix + " failed: recurrence data (until) misspelled - must be in format YYYYMMDDTHHMMSSZ");
	if (data.recurrence_count && (Number(data.recurrence_count) < 1 || Number(data.recurrence_count) % 1 !== 0)) throw new Error(msgPrefix + " failed: recurrence data (count) misspelled");
	if (data.recurrence_byMonth && data.recurrence_byMonth !== "" && !/^[\d,]+$/.test(data.recurrence_byMonth)) throw new Error(msgPrefix + " failed: recurrence data (byMonth) misspelled");
	if (data.recurrence_byMonthDay && data.recurrence_byMonthDay !== "" && !/^[\d,]+$/.test(data.recurrence_byMonthDay)) throw new Error(msgPrefix + " failed: recurrence data (byMonthDay) misspelled");
	if (data.recurrence_byDay && data.recurrence_byDay !== "" && !/^(?:[\d,-]|MO|TU|WE|TH|FR|SA|SU)+$/im.test(data.recurrence_byDay)) throw new Error(msgPrefix + " failed: recurrence data (byDay) misspelled");
	if (data.recurrence_weekstart && data.recurrence_weekstart !== "" && !/^(?:MO|TU|WE|TH|FR|SA|SU)$/im.test(data.recurrence_weekstart)) throw new Error(msgPrefix + " failed: recurrence data (weekstart) misspelled");
	return true;
}
//#endregion
//#region src/ui/ics-links.ts
var icsBlobUrls = /* @__PURE__ */ new Map();
function create_ics_blob_url(data, action) {
	if (!(isIOS() || data.fakeIOS) || !action.content || typeof URL.createObjectURL !== "function") return action.href;
	const url = URL.createObjectURL(new Blob([action.content], { type: "text/calendar;charset=utf-8" }));
	const identifier = data.identifier;
	const urls = icsBlobUrls.get(identifier) || /* @__PURE__ */ new Set();
	urls.add(url);
	icsBlobUrls.set(identifier, urls);
	return url;
}
function revoke_ics_blob_urls(identifier) {
	if (!identifier) return;
	const urls = icsBlobUrls.get(identifier);
	if (!urls) return;
	urls.forEach((url) => URL.revokeObjectURL(url));
	icsBlobUrls.delete(identifier);
}
function is_ics_option(type) {
	return type === "apple" || type === "ical";
}
function can_group_ics(data) {
	return !data.dates.some((entry) => entry.status === "cancelled") && data.dates.every((entry) => (entry.organizer || "") === (data.dates[0].organizer || ""));
}
function complete_ics_link(host, data, type, subEvent, context, control) {
	var _Object$entries$find, _data$dates$find;
	log_event(context === "singleton" ? "openSingletonLink" : context === "subevent" ? "openSubEventLink" : "openCalendarLink", control.id, data.identifier);
	if (context === "list") setTimeout(() => toggle(host, "close"), 0);
	const states = (_Object$entries$find = Object.entries(getOptionStates(data.identifier)).find(([option]) => option === type)) === null || _Object$entries$find === void 0 ? void 0 : _Object$entries$find[1];
	if (!states) return;
	if (subEvent === "all") states.forEach((value, index) => states.splice(index, 1, value + 1));
	else if (((_data$dates$find = data.dates.find((_entry, index) => index === subEvent)) === null || _data$dates$find === void 0 ? void 0 : _data$dates$find.status) !== "cancelled") {
		const value = states.find((_state, index) => index === subEvent) || 0;
		states.splice(subEvent, 1, value + 1);
	}
	if (states.every((value) => value > 0)) {
		var _host$getElementById;
		(_host$getElementById = host.getElementById(data.identifier)) === null || _host$getElementById === void 0 || _host$getElementById.classList.add("atcb-saved");
		saved_hook(host, data);
		if (context === "subevent") setTimeout(() => toggle(host, "close"), 0);
	}
	control.classList.add("atcb-saved");
}
function replace_with_ics_anchor(host, data, control, type, subEvent, context, action) {
	const anchor = document.createElement("a");
	for (const attribute of Array.from(control.attributes)) anchor.setAttribute(attribute.name, attribute.value);
	anchor.href = create_ics_blob_url(data, action);
	anchor.target = action.target;
	anchor.rel = "noopener";
	if (action.kind === "dynamic") anchor.download = action.filename + ".ics";
	delete anchor.dataset.atcbLinkPending;
	anchor.removeAttribute("disabled");
	while (control.firstChild) anchor.append(control.firstChild);
	anchor.addEventListener("click", () => complete_ics_link(host, data, type, subEvent, context, anchor));
	const focused = control.getRootNode() instanceof ShadowRoot && control.getRootNode().activeElement === control;
	control.replaceWith(anchor);
	if (focused) anchor.focus();
	return anchor;
}
function prepare_ics_link(host, data, control, type, subEvent = "all", context = "list") {
	if (!is_ics_option(type) || data.subscribe || data.blockInteraction || data.disabled) return;
	if (subEvent === "all" && data.dates.length > 1 && !can_group_ics(data)) return;
	if (!data.proxy && static_ics_file(host, data, subEvent) !== "") return;
	control.dataset.atcbLinkPending = "true";
	const blockPendingActivation = (event) => {
		event.preventDefault();
		event.stopImmediatePropagation();
	};
	control.addEventListener("click", blockPendingActivation, { capture: true });
	const identifier = data.identifier;
	setTimeout(() => {
		if (!control.isConnected || data.identifier !== identifier) return;
		let action;
		try {
			action = generate_ical(host, data, type, subEvent, false, true);
		} catch (_unused) {
			delete control.dataset.atcbLinkPending;
			control.removeEventListener("click", blockPendingActivation, { capture: true });
			return;
		}
		if (!action || action.kind === "static" || action.kind === "assistance" || action.href === "") {
			delete control.dataset.atcbLinkPending;
			control.removeEventListener("click", blockPendingActivation, { capture: true });
			return;
		}
		replace_with_ics_anchor(host, data, control, type, subEvent, context, action);
	}, 0);
}
//#endregion
//#region src/ui/templates.ts
/**
* lit-html templates for the button rendering path.
*
* These templates produce the same DOM as the imperative ui builders (generate_label,
* date-button rendering and the trigger parts of generate_label /
* generate_label_content) 1:1 - every class, part, id, aria attribute and
* event wiring is behavior-identical. The transient interaction layers (dropdown
* list, modal, overlay) stay imperative by design; they are event-driven,
* positioned and removed outside the reactive render cycle.
*/
function defaultTriggerText(data) {
	if (data.pastDateHandling != "none") {
		let allOverdue = true;
		for (let i = 0; i < data.dates.length; i++) if (!data.dates[`${i}`].overdue) {
			allOverdue = false;
			break;
		}
		if (allOverdue) return translate_hook("expired", data);
	}
	return translate_hook("label.addtocalendar", data);
}
function labelText(data, type, text) {
	if (text !== "") return text;
	if (data.options.length === 1 || type === "trigger") return defaultTriggerText(data);
	if (type === "close") return translate_hook("close", data);
	return translate_hook(type, data);
}
function labelAriaLabel(data, type, text, oneOption) {
	if (oneOption) return translate_hook("label.addtocalendar", data) + " (" + translate_hook(type, data) + "): " + data.name;
	if (type === "trigger") return text + ": " + data.name;
	return text;
}
function iconTemplate(type) {
	return html`<div class="atcb-icon atcb-icon-${type}" part=${type === "trigger" ? "atcb-button-icon" : "atcb-list-icon"}>${unsafeHTML(icons[`${type}`])}</div>`;
}
function triggerListeners(host, data, type) {
	const toggleAuto = (parent, keyboard) => {
		if (type === "rsvp" && typeof generate_rsvp_form === "function") generate_rsvp_form(host, data, parent, keyboard);
		else toggle(host, "auto", data, parent, keyboard, true);
	};
	const touchendHandler = debounce_leading((event) => {
		event.preventDefault();
		toggleAuto(event.currentTarget, false);
	});
	const mouseupHandler = debounce_leading((event) => {
		event.preventDefault();
		toggleAuto(event.currentTarget, false);
	});
	return {
		keyup: (event) => {
			if (event.key === "Enter" || event.code == "Space") {
				event.preventDefault();
				if (type === "rsvp" && typeof generate_rsvp_form === "function") generate_rsvp_form(host, data, event.currentTarget, true);
				else toggle(host, "auto", data, event.currentTarget, true, true);
			}
		},
		touchend: touchendHandler,
		mouseup: data.trigger === "click" || type === "rsvp" ? mouseupHandler : void 0,
		mouseenter: data.trigger !== "click" && type !== "rsvp" ? (event) => {
			toggle(host, "open", data, event.currentTarget, false, true);
		} : void 0
	};
}
function singletonListeners(host, data, type) {
	return {
		click: debounce_leading(async (event) => {
			var _host$querySelector;
			const parent = event.currentTarget;
			(_host$querySelector = host.querySelector("#" + parent.id)) === null || _host$querySelector === void 0 || _host$querySelector.blur();
			log_event("openSingletonLink", parent.id, data.identifier);
			await generate_links(host, type, data);
		}),
		keyup: async (event) => {
			if (event.key === "Enter") {
				var _host$querySelector2;
				event.preventDefault();
				const parent = event.currentTarget;
				(_host$querySelector2 = host.querySelector("#" + parent.id)) === null || _host$querySelector2 === void 0 || _host$querySelector2.blur();
				log_event("openSingletonLink", parent.id, data.identifier);
				await generate_links(host, type, data, "all", true);
			}
		}
	};
}
function dateButtonAriaLabel(data, subEvent, subEventAll, hoverText, fullTimeInfo, oneOption) {
	const btnHeadlineText = data.dates.length > 1 && subEventAll ? data.name : data.dates[`${subEvent}`].name;
	const detailedTimeInfo = (function() {
		const withYear = generate_timestring(data.dates, data.formatLocale || data.language, subEvent, false, false, true);
		if (withYear.length > 0) return withYear.join(" ");
		return fullTimeInfo.join(" ");
	})();
	const parts = [hoverText.replace(/<br>/g, " ").replace(/\+\s/g, "") + (oneOption ? " (" + translate_hook(data.options[0], data) + ")" : "") + ": " + btnHeadlineText];
	if (data.dates[`${subEvent}`].location && data.dates[`${subEvent}`].location !== "") parts.push(data.dates[`${subEvent}`].location);
	if (detailedTimeInfo !== "") parts.push(detailedTimeInfo);
	if (data.recurrence && data.recurrence !== "") parts.push(translate_hook("recurring", data));
	return parts.join(", ");
}
function dateButtonMeta(data, subEventIn = "all", forceFullDate = false) {
	let subEvent = subEventIn;
	if (subEvent !== "all") subEvent = parseInt(subEvent) - 1;
	else if (data.dates.length === 1) subEvent = 0;
	const fullTimeInfo = generate_timestring(data.dates, data.formatLocale || data.language, subEvent, false, false, forceFullDate);
	const hoverText = (function() {
		if (subEvent !== "all" && data.dates[`${subEvent}`].status === "cancelled" || subEvent === "all" && data.allCancelled) return translate_hook("date.status.cancelled", data);
		if (data.pastDateHandling !== "none") {
			if (subEvent === "all" && data.allOverdue || subEvent !== "all" && data.dates[`${subEvent}`].overdue) return translate_hook("expired", data);
		}
		if (data.label && data.label !== "") return data.label;
		return translate_hook("label.addtocalendar", data);
	})();
	const cancelledInfo = (function() {
		if (subEvent !== "all" && data.dates[`${subEvent}`].status === "cancelled" || subEvent === "all" && data.allCancelled) return translate_hook("date.status.cancelled", data);
		return "";
	})();
	const recurringString = (function() {
		if (fullTimeInfo.length === 0) return translate_hook("recurring", data) + " &#x27F3;";
		return "&#x27F3;";
	})();
	let subEventAll = false;
	if (subEvent === "all") {
		subEvent = 0;
		if (!data.allOverdue) {
			for (let i = 0; i < data.dates.length; i++) if (!data.dates[`${i}`].overdue) {
				subEvent = i;
				break;
			}
		}
		subEventAll = true;
	}
	return {
		subEvent,
		subEventAll,
		fullTimeInfo,
		hoverText,
		cancelledInfo,
		recurringString
	};
}
function dateButtonContentTemplate(data, subEventIn = "all", forceFullDate = false) {
	const { subEvent, subEventAll, fullTimeInfo, hoverText, cancelledInfo, recurringString } = dateButtonMeta(data, subEventIn, forceFullDate);
	const startDate = new Date(generate_time(data.dates[`${subEvent}`]).start);
	const allDay = generate_time(data.dates[`${subEvent}`]).allday;
	const timeZone = data.dates[`${subEvent}`].timeZone;
	const btnHeadlineText = data.dates.length > 1 && subEventAll ? data.name : data.dates[`${subEvent}`].name;
	const hasLocationLine = data.dates[`${subEvent}`].location && data.dates[`${subEvent}`].location !== "" && !data.dates[`${subEvent}`].onlineEvent || cancelledInfo !== "";
	const hasDescriptionFallback = !hasLocationLine && data.dates[`${subEvent}`].description !== "" && fullTimeInfo.length === 0 && (!data.recurrence || data.recurrence === "");
	const centerHeadline = !hasLocationLine && !hasDescriptionFallback && fullTimeInfo.length == 0 && (data.recurrence == null || data.recurrence == "");
	const headlineClasses = `${!hasLocationLine && !hasDescriptionFallback ? " atcb-date-btn-headline-two-lines" : ""}${centerHeadline ? " atcb-date-btn-headline-centered" : ""}`;
	return html`<div class="atcb-date-btn-left">
      <div class="atcb-date-btn-day">${startDate.toLocaleString(data.formatLocale || data.language, {
		day: "numeric",
		timeZone: allDay ? "UTC" : timeZone
	})}</div>
      <div class="atcb-date-btn-month">${startDate.toLocaleString(data.formatLocale || data.language, {
		month: "short",
		timeZone: allDay ? "UTC" : timeZone
	})}</div>
    </div>
    <div class="atcb-date-btn-right${centerHeadline ? " atcb-date-btn-right-centered" : ""}">
      <div class="atcb-date-btn-details">
        <div class="atcb-date-btn-headline${headlineClasses}">${btnHeadlineText}</div>
        ${hasLocationLine ? cancelledInfo != "" ? html`<div class="atcb-date-btn-content atcb-date-btn-cancelled">${cancelledInfo}</div>` : html`<div class="atcb-date-btn-content">
                <span class="atcb-date-btn-content-icon">${unsafeHTML(icons["pin"])}</span>
                <span class="atcb-date-btn-content-location">${data.dates[`${subEvent}`].location}</span>
              </div>` : hasDescriptionFallback ? html`<div class="atcb-date-btn-content atcb-date-btn-content-clamped">${data.dates[`${subEvent}`].descriptionHtmlFree}</div>` : nothing}
        ${fullTimeInfo.length > 0 || data.recurrence != null && data.recurrence != "" ? html`<div class="atcb-date-btn-content">
              <span class="atcb-date-btn-content-icon">${unsafeHTML(icons["clock"])}</span>
              <span class="atcb-date-btn-content-text">
                ${fullTimeInfo.map((block) => html`<span>${block}</span>`)}${data.recurrence != null && data.recurrence != "" ? html`<span>${unsafeHTML(recurringString)}</span>` : nothing}
              </span>
            </div>` : nothing}
      </div>
      <div class="atcb-date-btn-hover">${unsafeHTML(hoverText)}</div>
    </div>
    ${!data.hideCheckmark && data.dates[`${subEvent}`].status !== "cancelled" ? html`<div class="atcb-checkmark">${unsafeHTML(icons["checkmark"])}</div>` : nothing}
    ${cancelledInfo === "" && (!data.dates[`${subEvent}`].overdue || data.pastDateHandling === "none") ? html`<div class="atcb-date-btn-plus">${unsafeHTML(icons["plus"])}</div>` : nothing}`;
}
function buttonTemplate(host, data) {
	const oneOption = (function() {
		if (data.options.length === 1 || data.buttonsList && data.buttonStyle != "date") return true;
		return false;
	})();
	const optionSplit = oneOption ? data.options : ["default"];
	const isDate = data.buttonStyle === "date";
	return html`${optionSplit.map((option, index) => {
		const buttonId = oneOption && data.buttonsList ? data.identifier + "-" + option : data.identifier;
		const label = (function() {
			if (oneOption && data.buttonsList && data.options.length > 1) return translate_hook(`${data.options[`${index}`]}`, data);
			return data.label;
		})();
		const contentType = oneOption ? !data.buttonsList ? "trigger" : option : "trigger";
		const text = labelText(data, contentType, label !== null && label !== void 0 ? label : "");
		const showText = (contentType === "trigger" || oneOption) && !data.hideTextLabelButton || !oneOption && contentType !== "trigger" && !data.hideTextLabelList;
		const handlers = oneOption ? singletonListeners(host, data, option) : triggerListeners(host, data, "trigger");
		const interactive = !data.blockInteraction;
		const meta = isDate ? dateButtonMeta(data, "all", false) : null;
		const ariaLabel = isDate ? dateButtonAriaLabel(data, meta.subEvent, meta.subEventAll, meta.hoverText, meta.fullTimeInfo, oneOption) : labelAriaLabel(data, contentType, text, oneOption);
		const showLabelAria = !(isDate && (contentType === "trigger" || oneOption));
		return html`<div class="atcb-button-wrapper${data.rtl ? " atcb-rtl" : ""}" part="atcb-button-wrapper">
      <button
        type="button"
        class="atcb-button${data.hideTextLabelButton ? " atcb-no-text" : ""}${data.trigger === "click" ? " atcb-click" : ""}${data.listStyle === "overlay" ? " atcb-dropoverlay" : ""}${oneOption ? " atcb-single" : ""}"
        part="atcb-button"
        id=${buttonId}
        disabled=${data.disabled ? "true" : nothing}
        aria-haspopup=${!oneOption ? "true" : nothing}
        aria-expanded="false"
        aria-label=${isDate ? ariaLabel : showLabelAria ? ariaLabel : nothing}
        @keyup=${interactive ? handlers.keyup : nothing}
        @touchend=${interactive && "touchend" in handlers ? handlers.touchend : nothing}
        @mouseup=${interactive && "mouseup" in handlers && handlers.mouseup ? handlers.mouseup : nothing}
        @mouseenter=${interactive && "mouseenter" in handlers && handlers.mouseenter ? handlers.mouseenter : nothing}
        @click=${interactive && "click" in handlers ? handlers.click : nothing}
      >
        ${isDate ? dateButtonContentTemplate(data, "all", false) : nothing}
        ${!isDate && !data.hideIconButton ? iconTemplate(contentType === "trigger" ? "trigger" : option) : nothing}${!isDate && showText ? html`<span class="atcb-text" part=${contentType === "trigger" ? "atcb-button-text" : "atcb-list-text"}>${text}</span>` : nothing}
        ${!isDate && contentType === "trigger" && !oneOption && !data.buttonsList && !data.hideTextLabelButton ? html`<div class="atcb-chevron" part="atcb-button-chevron">${unsafeHTML(icons["chevron"])}</div>` : nothing}
        ${!oneOption ? html`<div class="atcb-dropdown-anchor"></div>` : nothing}
        ${!data.hideCheckmark && !data.hideTextLabelButton && !data.buttonsList && !data.disabled && !data.allCancelled ? html`<div class="atcb-checkmark">${unsafeHTML(icons["checkmark"])}</div>` : nothing}
      </button>
    </div>`;
	})}`;
}
/**
* Renders the date-style button CONTENT into an imperatively created parent
* (used by the modal sub-event buttons) and sets the aria-label on the parent,
* and sets the aria-label on that parent.
*/
function renderDateButtonContent(data, parent, subEventIn = "all", oneOption = false, forceFullDate = false) {
	const meta = dateButtonMeta(data, subEventIn, forceFullDate);
	render(dateButtonContentTemplate(data, subEventIn, forceFullDate), parent);
	parent.setAttribute("aria-label", dateButtonAriaLabel(data, meta.subEvent, meta.subEventAll, meta.hoverText, meta.fullTimeInfo, oneOption));
}
/**
* Renders the button template into a container and applies the post-render
* imperative finishing (sizes on the wrapper elements) - shared by the element,
* the PRO rsvp flow, and any standalone consumer.
*/
function renderButton(host, container, data) {
	render(buttonTemplate(host, data), container);
	container.querySelectorAll(".atcb-button-wrapper").forEach((wrapper) => {
		set_sizes(wrapper, data.sizes);
	});
	if (!data.subscribe) data.options.forEach((option) => {
		if (option !== "apple" && option !== "ical") return;
		const id = data.buttonsList ? data.identifier + "-" + option : data.identifier;
		const control = container.querySelector("#" + id);
		if (control && (data.options.length === 1 || data.buttonsList)) prepare_ics_link(host, data, control, option, data.dates.length === 1 ? 0 : "all", "singleton");
	});
	if (data.debug) console.log("Add to Calendar Button \"" + data.identifier + "\" created");
}
//#endregion
//#region src/generators/rich-data.ts
function generate_rich_data(data, parent) {
	const schemaEl = document.createElement("script");
	schemaEl.id = "atcb-schema-" + data.identifier;
	if (parent.hasAttribute("cspnonce")) {
		if (/[`'"()[\]{}<>\s]/.test(parent.getAttribute("cspnonce"))) throw new Error("cspnonce input contains forbidden characters.");
		schemaEl.setAttribute("nonce", parent.getAttribute("cspnonce"));
	}
	schemaEl.type = "application/ld+json";
	const id = data.name.replace(/\s/g, "");
	const schemaContentMulti = [];
	if (data.dates.length > 1) {
		const parts = [];
		parts.push("\"@context\":\"https://schema.org\"");
		parts.push("\"@type\":\"EventSeries\"");
		parts.push("\"@id\":" + JSON.stringify(id));
		parts.push("\"name\":" + JSON.stringify(data.name) + ",");
		schemaContentMulti.push("{\r\n" + parts.join(",\r\n") + "\r\n");
	}
	const schemaContentFull = [];
	for (let i = 0; i < data.dates.length; i++) {
		const schemaContent = [];
		schemaContent.push("\"@context\":\"https://schema.org\"");
		schemaContent.push("\"@type\":\"Event\"");
		if (data.dates.length > 1) schemaContent.push("\"@id\":" + JSON.stringify(id + "-" + (i + 1)));
		if (data.dates[`${i}`].status === "cancelled") schemaContent.push("\"eventStatus\":\"https://schema.org/EventCancelled\"");
		else schemaContent.push("\"eventStatus\":\"https://schema.org/EventScheduled\"");
		schemaContent.push("\"name\":" + JSON.stringify(data.dates[`${i}`].name));
		if (data.dates[`${i}`].descriptionHtmlFree) schemaContent.push("\"description\":" + JSON.stringify(data.dates[`${i}`].descriptionHtmlFree));
		const formattedDate = generate_time(data.dates[`${i}`], "delimiters", "general", true);
		schemaContent.push("\"startDate\":\"" + formattedDate.start + "\"");
		if ("duration" in formattedDate && formattedDate.duration) schemaContent.push("\"duration\":\"" + formattedDate.duration + "\"");
		schemaContent.push(data.dates[`${i}`].onlineEvent ? "\"eventAttendanceMode\":\"https://schema.org/OnlineEventAttendanceMode\",\r\n\"location\": {\r\n\"@type\":\"VirtualLocation\",\r\n\"url\":" + JSON.stringify(data.dates[`${i}`].location) + "\r\n}" : "\"location\":" + JSON.stringify(data.dates[`${i}`].location));
		if (data.recurrence && data.recurrence !== "") schemaContent.push(...generate_rich_data_recurrence(data, formattedDate));
		else schemaContent.push("\"endDate\":\"" + formattedDate.end + "\"");
		if (data.dates[`${i}`].organizer && data.dates[`${i}`].organizer !== "") {
			const organizerParts = data.dates[`${i}`].organizer.split("|");
			schemaContent.push("\"organizer\":{\r\n\"@type\":\"Person\",\r\n\"name\":" + JSON.stringify(organizerParts[0]) + ",\r\n\"email\":" + JSON.stringify(organizerParts[1]) + "\r\n}");
		}
		const imageData = [];
		if (data.images) {
			if (Array.isArray(data.images)) {
				for (let i = 0; i < data.images.length; i++) if (secure_url(data.images[`${i}`], data.debug) && data.images[`${i}`].startsWith("http")) imageData.push(JSON.stringify(data.images[`${i}`]));
			}
		}
		if (imageData.length > 0) schemaContent.push("\"image\":[\r\n" + imageData.join(",\r\n") + "]");
		schemaContentFull.push("{\r\n" + schemaContent.join(",\r\n") + "\r\n}");
	}
	if (data.dates.length > 1) schemaEl.textContent = schemaContentMulti.join(",\r\n") + "\"subEvents\":[\r\n" + schemaContentFull.join(",\r\n") + "\r\n]\r\n}";
	else schemaEl.textContent = schemaContentFull[0];
	document.body.insertBefore(schemaEl, document.body.firstChild);
}
function generate_rich_data_recurrence(data, formattedDate) {
	const schemaRecurrenceContent = [];
	schemaRecurrenceContent.push("\"eventSchedule\": { \"@type\": \"Schedule\"");
	schemaRecurrenceContent.push("\"scheduleTimezone\":\"" + data.dates[0].timeZone + "\"");
	if (data.recurrence_interval && data.recurrence_interval !== "" && data.recurrence_frequency && data.recurrence_frequency !== "") {
		const repeatFrequency = "P" + data.recurrence_interval + data.recurrence_frequency.substring(0, 1);
		schemaRecurrenceContent.push("\"repeatFrequency\":\"" + repeatFrequency + "\"");
	}
	if (data.recurrence_byDay && data.recurrence_byDay !== "") {
		const byDayString = (function() {
			if (/\d/.test(data.recurrence_byDay)) return "\"" + data.recurrence_byDay + "\"";
			else {
				const byDays = data.recurrence_byDay.split(",");
				const helperMap = {
					MO: "https://schema.org/Monday",
					TU: "https://schema.org/Tuesday",
					WE: "https://schema.org/Wednesday",
					TH: "https://schema.org/Thursday",
					FR: "https://schema.org/Friday",
					SA: "https://schema.org/Saturday",
					SU: "https://schema.org/Sunday"
				};
				const output = [];
				for (let i = 0; i < byDays.length; i++) output.push("\"" + helperMap[byDays[`${i}`]] + "\"");
				return "[" + output.join(",") + "]";
			}
		})();
		schemaRecurrenceContent.push("\"byDay\":" + byDayString);
	}
	if (data.recurrence_byMonth && data.recurrence_byMonth !== "") {
		const byMonthString = data.recurrence_byMonth.includes(",") ? "[" + data.recurrence_byMonth + "]" : data.recurrence_byMonth;
		schemaRecurrenceContent.push("\"byMonth\":\"" + byMonthString + "\"");
	}
	if (data.recurrence_byMonthDay && data.recurrence_byMonthDay !== "") {
		const byMonthDayString = data.recurrence_byMonthDay.includes(",") ? "[" + data.recurrence_byMonthDay + "]" : data.recurrence_byMonthDay;
		schemaRecurrenceContent.push("\"byMonthDay\":\"" + byMonthDayString + "\"");
	}
	if (data.recurrence_count && data.recurrence_count !== "") schemaRecurrenceContent.push("\"repeatCount\":\"" + data.recurrence_count + "\"");
	if (data.recurrence_until && data.recurrence_until !== "") schemaRecurrenceContent.push("\"endDate\":\"" + data.recurrence_until + "\"");
	if (data.dates[0].startTime && data.dates[0].startTime !== "" && data.dates[0].endTime && data.dates[0].endTime !== "") {
		schemaRecurrenceContent.push("\"startTime\":\"" + data.dates[0].startTime + ":00\"");
		schemaRecurrenceContent.push("\"endTime\":\"" + data.dates[0].endTime + ":00\"");
		schemaRecurrenceContent.push("\"duration\":\"" + ("duration" in formattedDate ? formattedDate.duration : void 0) + "\"");
	}
	schemaRecurrenceContent.push("\"startDate\":\"" + data.dates[0].startDate + "\" }");
	return schemaRecurrenceContent;
}
//#endregion
//#region src/ui/group-overview.ts
function isoDate(year, month = 1, day = 1) {
	return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00Z`;
}
function normalize_config(input, now) {
	const config = strip_unsafe_keys(input || {});
	const minimum = isoDate(now.getUTCFullYear() - 1);
	const validIso = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !isNaN(Date.parse(value));
	const from = validIso(config.from) && Date.parse(config.from) >= Date.parse(minimum) ? config.from : minimum;
	let to;
	if (config.to !== void 0) {
		if (!validIso(config.to) || Date.parse(config.to) < Date.parse(from)) throw new Error("group-overview-config.to must be a UTC ISO datetime at or after from.");
		to = config.to;
	}
	const domainInput = typeof config["custom-domain"] === "string" ? config["custom-domain"].toLowerCase() : "";
	const domainParts = domainInput.split(".");
	const domain = domainParts.length > 1 && domainParts.every((part) => part.length > 0 && part.length <= 63 && /^[a-z0-9-]+$/.test(part) && !part.startsWith("-") && !part.endsWith("-")) ? domainInput : void 0;
	return {
		yearsOnly: config["years-only"] === true,
		type: config.type === "cards" || config.type === "compact" ? config.type : "list",
		from,
		to,
		noDetails: config["no-details"] === true,
		noAdd: config["no-add"] === true,
		customDomain: domain,
		addViaList: config["add-via-list"] === true
	};
}
function text(value) {
	return typeof value === "string" ? secure_content(value, false).replace(/\s+/g, " ").trim() : "";
}
function description_text(value) {
	if (typeof value !== "string") return "";
	return rewrite_html_elements(secure_content(value.replace(/<br\s*\/?>|<\/p\s*>/gi, " "), false), true).replace(/\s+/g, " ").trim();
}
function flatten_events(input, currentYear) {
	if (!Array.isArray(input)) throw new Error("The group overview response is invalid.");
	const output = [];
	for (const raw of input) {
		const item = strip_unsafe_keys(raw);
		if (!item || typeof item !== "object" || typeof item.prokey !== "string" || !Array.isArray(item.dates)) continue;
		for (const date of item.dates) {
			if (!date || typeof date.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date.startDate)) continue;
			const startYear = Number(date.startDate.slice(0, 4));
			const startMonth = Number(date.startDate.slice(5, 7));
			if (startYear < currentYear - 1 || startMonth < 1 || startMonth > 12) continue;
			const event = _objectSpread2(_objectSpread2({}, date), {}, {
				name: text(date.name),
				description: description_text(date.description),
				location: text(date.location),
				prokey: item.prokey,
				title: text(date.name) || text(item.label) || "Event",
				year: startYear,
				month: startMonth,
				hasRsvp: item.rsvp === true || item.rsvp_block !== null && item.rsvp_block !== void 0 && item.rsvp_block !== "" || /,\s*RSVP\s*$/i.test(text(item.label))
			});
			output.push(event);
			if (date.endDate && /^\d{4}-\d{2}-\d{2}$/.test(date.endDate)) {
				const endYear = Number(date.endDate.slice(0, 4));
				if (endYear > startYear && endYear >= currentYear - 1) output.push(_objectSpread2(_objectSpread2({}, event), {}, {
					year: endYear,
					month: 1
				}));
			}
		}
	}
	output.sort((a, b) => `${a.startDate || ""}T${a.startTime || ""}`.localeCompare(`${b.startDate || ""}T${b.startTime || ""}`));
	return output;
}
function append_text(parent, tag, value, part) {
	const element = document.createElement(tag);
	element.textContent = value;
	if (part) element.setAttribute("part", part);
	parent.append(element);
	return element;
}
function append_meta(parent, type, value) {
	const item = document.createElement("span");
	item.className = `atcb-group-overview-meta-item atcb-group-overview-meta-${type === "clock" ? "datetime" : "location"}`;
	item.setAttribute("part", `atcb-group-overview-${type === "clock" ? "datetime" : "location"}`);
	const icon = document.createElement("span");
	icon.className = "atcb-group-overview-meta-icon";
	icon.setAttribute("part", `atcb-group-overview-${type === "clock" ? "datetime" : "location"}-icon`);
	icon.append(document.importNode(new DOMParser().parseFromString(icons[`${type}`], "image/svg+xml").documentElement, true));
	item.append(icon);
	const text = append_text(item, "span", value);
	text.className = "atcb-group-overview-meta-text";
	parent.append(item);
	return item;
}
function blur_after_pointer_selection(select) {
	let pointerInteraction = false;
	select.addEventListener("pointerdown", () => {
		pointerInteraction = true;
	});
	select.addEventListener("change", () => {
		if (pointerInteraction) select.blur();
		pointerInteraction = false;
	});
	select.addEventListener("blur", () => {
		pointerInteraction = false;
	});
}
function render_event(event, config, locale, dev, onAdd) {
	const item = document.createElement("li");
	item.className = "atcb-group-overview-item";
	if (config.noAdd) item.classList.add("atcb-group-overview-item-no-add");
	else if (config.noDetails) item.classList.add("atcb-group-overview-item-no-details");
	item.setAttribute("part", "atcb-group-overview-event");
	const start = /* @__PURE__ */ new Date(`${event.startDate}T${event.startTime || "00:00"}:00`);
	const dateFormatter = new Intl.DateTimeFormat(locale, _objectSpread2({
		day: "numeric",
		month: "short"
	}, event.startTime ? {
		hour: "2-digit",
		minute: "2-digit"
	} : {}));
	let dateLabel = dateFormatter.format(start);
	if (event.endDate || event.endTime) {
		const end = /* @__PURE__ */ new Date(`${event.endDate || event.startDate}T${event.endTime || event.startTime || "00:00"}:00`);
		dateLabel += ` – ${dateFormatter.format(end)}`;
	}
	const href = `https://${config.customDomain || (dev ? "dev.caldn.net" : "caldn.net")}/${encodeURIComponent(event.prokey)}`;
	if (config.type === "compact") {
		const row = document.createElement("span");
		row.className = "atcb-group-overview-compact-row";
		item.append(row);
		const link = append_text(row, config.noAdd ? "span" : "a", `${dateLabel} | ${event.title}`, "atcb-group-overview-link");
		if (!config.noAdd) {
			link.href = href;
			link.target = "_blank";
			link.rel = "noopener";
		}
		if (config.noDetails && !config.noAdd) link.addEventListener("click", (e) => {
			e.preventDefault();
			onAdd(event, link);
		});
		if (config.addViaList && !config.noDetails && !config.noAdd && event.hasRsvp) {
			item.classList.add("atcb-group-overview-compact-with-marker");
			const marker = append_text(row, "span", "•", "atcb-group-overview-marker");
			marker.className = "atcb-group-overview-compact-marker";
			marker.setAttribute("aria-hidden", "true");
			row.prepend(marker);
		} else if (config.addViaList && !config.noDetails && !config.noAdd) {
			item.classList.add("atcb-group-overview-compact-with-add");
			const add = append_text(row, "button", "+", "atcb-group-overview-add");
			add.className = "atcb-group-overview-add";
			add.type = "button";
			add.setAttribute("aria-label", `Add ${event.title} to calendar`);
			add.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				onAdd(event, add);
			});
			row.prepend(add);
		}
		return item;
	}
	const link = document.createElement(config.noAdd ? "div" : "a");
	link.className = "atcb-group-overview-event-link";
	link.setAttribute("part", "atcb-group-overview-link");
	if (link instanceof HTMLAnchorElement) {
		link.href = href;
		link.target = "_blank";
		link.rel = "noopener";
		link.setAttribute("aria-label", event.title);
	}
	if (config.noDetails && !config.noAdd) link.addEventListener("click", (e) => {
		e.preventDefault();
		onAdd(event, link);
	});
	item.append(link);
	if (config.type === "list") {
		const day = document.createElement("span");
		day.className = "atcb-group-overview-day";
		day.setAttribute("part", "atcb-group-overview-day");
		const dayValue = append_text(day, "span", String(Number(event.startDate.slice(8, 10))), "atcb-group-overview-day-value");
		dayValue.className = "atcb-group-overview-day-value";
		link.append(day);
	}
	const content = document.createElement("div");
	content.className = "atcb-group-overview-content";
	link.append(content);
	const title = append_text(content, "span", event.title, "atcb-group-overview-title");
	title.className = "atcb-group-overview-title";
	const meta = document.createElement("div");
	meta.className = "atcb-group-overview-meta";
	meta.setAttribute("part", "atcb-group-overview-meta");
	const datetime = append_meta(meta, "clock", dateLabel);
	if (event.location) append_meta(meta, "pin", event.location);
	content.append(meta);
	if (config.type === "cards") {
		content.insertBefore(datetime, title);
		if (meta.children.length === 0) meta.remove();
	}
	if (event.description) {
		const description = append_text(content, "p", event.description, "atcb-group-overview-description");
		description.className = "atcb-group-overview-description";
	}
	if (config.addViaList && !config.noAdd && !event.hasRsvp) {
		item.classList.add("atcb-group-overview-item-with-add");
		const add = append_text(config.noDetails ? link : item, config.noDetails ? "span" : "button", "+", "atcb-group-overview-add");
		add.className = "atcb-group-overview-add";
		if (config.noDetails) add.setAttribute("aria-hidden", "true");
		else {
			add.type = "button";
			add.setAttribute("aria-label", `Add ${event.title} to calendar`);
			add.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				onAdd(event, add);
			});
		}
	}
	return item;
}
async function render_group_overview(input, signal, onAdd) {
	const prokey = typeof input.prokey === "string" ? input.prokey : "";
	if (!prokey) throw new Error("group-overview requires a prokey.");
	const now = /* @__PURE__ */ new Date();
	const config = normalize_config(input.groupOverviewConfig, now);
	const query = new URLSearchParams({
		group: prokey,
		dates: "true",
		from: config.from
	});
	if (config.to) query.set("to", config.to);
	const response = await fetch(`https://api${input.dev ? "-dev" : ""}.add-to-calendar-pro.com/v1/event/all?${query}`, { signal });
	if (!response.ok) throw new Error("Not possible to read the public group overview.");
	const events = flatten_events(await response.json(), now.getFullYear());
	if (input.subscribe === true || input.subscribe === "true" || input.subscribe === "1") for (const event of events) event.prokey = prokey;
	const locale = typeof input.language === "string" ? input.language.replace("_", "-") : "en";
	const translationData = _objectSpread2(_objectSpread2({}, input), {}, { language: locale });
	await ensure_locale(translationData);
	const emptyLabel = translate_hook("group_overview.empty", translationData);
	const currentYear = now.getFullYear();
	const years = [...new Set(events.map((event) => event.year).concat(currentYear))].sort((a, b) => a - b);
	const css = await ensure_style(input);
	const style = document.createElement("style");
	style.textContent = css || "";
	if (input.cspnonce) style.setAttribute("nonce", input.cspnonce);
	const root = document.createElement("div");
	root.className = `atcb-group-overview atcb-group-overview-${config.type}`;
	root.setAttribute("part", "atcb-group-overview");
	root.setAttribute("lang", locale);
	const controls = document.createElement("div");
	controls.className = "atcb-group-overview-controls";
	controls.setAttribute("part", "atcb-group-overview-controls");
	const yearSelect = document.createElement("select");
	yearSelect.className = "atcb-group-overview-select";
	yearSelect.setAttribute("part", "atcb-group-overview-year-select");
	yearSelect.setAttribute("aria-label", "Year");
	for (const year of years) yearSelect.add(new Option(String(year), String(year), year === currentYear, year === currentYear));
	if (years.length > 1) controls.append(yearSelect);
	let monthSelect;
	if (!config.yearsOnly) {
		monthSelect = document.createElement("select");
		monthSelect.className = "atcb-group-overview-select";
		monthSelect.setAttribute("part", "atcb-group-overview-month-select");
		monthSelect.setAttribute("aria-label", "Month");
		controls.append(monthSelect);
	}
	if (controls.childElementCount > 0) root.append(controls);
	const results = document.createElement("div");
	results.className = "atcb-group-overview-results";
	results.setAttribute("part", "atcb-group-overview-results");
	root.append(results);
	const render = () => {
		results.replaceChildren();
		const year = Number(yearSelect.value);
		const yearEvents = events.filter((event) => event.year === year);
		if (yearEvents.length === 0) {
			if (year === currentYear) {
				const empty = append_text(results, "p", emptyLabel, "atcb-group-overview-empty");
				empty.className = "atcb-group-overview-empty";
			}
			if (monthSelect) monthSelect.replaceChildren();
			return;
		}
		const months = [...new Set(yearEvents.map((event) => event.month))].sort((a, b) => a - b);
		const renderMonth = (month, headline) => {
			if (headline) {
				const heading = append_text(results, "h3", new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2e3, month - 1, 1)), "atcb-group-overview-month-heading");
				heading.className = "atcb-group-overview-month";
			}
			const list = document.createElement("ul");
			list.className = `atcb-group-overview-items atcb-group-overview-${config.type}`;
			list.setAttribute("part", "atcb-group-overview-list");
			for (const event of yearEvents.filter((candidate) => candidate.month === month)) list.append(render_event(event, config, locale, input.dev === true || input.dev === "true", onAdd));
			results.append(list);
		};
		if (config.yearsOnly) for (const month of months) renderMonth(month, true);
		else if (monthSelect) {
			const previous = Number(monthSelect.value);
			monthSelect.replaceChildren(...months.map((month) => new Option(new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2e3, month - 1, 1)), String(month))));
			monthSelect.value = String(months.includes(previous) ? previous : months.includes(now.getMonth() + 1) ? now.getMonth() + 1 : months[0]);
			renderMonth(Number(monthSelect.value), false);
		}
	};
	yearSelect.addEventListener("change", render);
	monthSelect === null || monthSelect === void 0 || monthSelect.addEventListener("change", () => {
		results.replaceChildren();
		const yearEvents = events.filter((event) => event.year === Number(yearSelect.value) && event.month === Number(monthSelect.value));
		const list = document.createElement("ul");
		list.className = `atcb-group-overview-items atcb-group-overview-${config.type}`;
		list.setAttribute("part", "atcb-group-overview-list");
		for (const event of yearEvents) list.append(render_event(event, config, locale, input.dev === true || input.dev === "true", onAdd));
		results.append(list);
	});
	blur_after_pointer_selection(yearSelect);
	if (monthSelect) blur_after_pointer_selection(monthSelect);
	render();
	return {
		root,
		style
	};
}
//#endregion
//#region src/compat/attributes.ts
var SPECIAL_OFFICIAL_NAMES = {
	proKey: "prokey",
	iCalFileName: "ical-file-name",
	useUserTZ: "use-user-tz"
};
/**
* The official kebab-case attribute name for a config param.
*/
function officialAttributeName(param) {
	if (SPECIAL_OFFICIAL_NAMES[`${param}`]) return SPECIAL_OFFICIAL_NAMES[`${param}`];
	return param.replace(/_/g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
/**
* The legacy attribute name: what the DOM stores for the documented camelCase
* attribute names (HTML lowercases attribute names).
*/
function legacyAttributeName(param) {
	return param.toLowerCase();
}
/**
* Resolves the attribute name to read for a param on a given element,
* honoring official-over-legacy precedence. Returns null if neither is set.
*/
function resolveAttributeName(el, param) {
	const official = officialAttributeName(param);
	if (el.hasAttribute(official)) return official;
	const legacy = legacyAttributeName(param);
	if (el.hasAttribute(legacy)) return legacy;
	return null;
}
/**
* Convenience readers used by the attribute scan and the special-cased reads.
*/
function hasConfigAttribute(el, param) {
	return resolveAttributeName(el, param) !== null;
}
function getConfigAttribute(el, param) {
	const name = resolveAttributeName(el, param);
	return name === null ? null : el.getAttribute(name);
}
/**
* All attribute names the element observes for change-triggered re-initialization:
* official + legacy spellings of every WC param plus the special control attributes.
*/
function observedConfigAttributes(params) {
	const names = /* @__PURE__ */ new Set();
	for (const param of params) {
		names.add(officialAttributeName(param));
		names.add(legacyAttributeName(param));
	}
	for (const extra of [
		"instance",
		"prokey",
		"pro-override",
		"prooverride"
	]) names.add(extra);
	return [...names];
}
//#endregion
//#region src/element/index.ts
var initialGlobalInit = false;
var buttonCount = 0;
var lightModeMutationObserver = /* @__PURE__ */ new Map();
var template = `<div class="atcb-initialized atcb-hidden"></div>`;
function is_group_overview(el) {
	const value = getConfigAttribute(el, "groupOverview");
	return hasConfigAttribute(el, "groupOverview") && (!value || value === "" || value === "true" || value === "1");
}
function should_render_group_overview(el, data) {
	if (data.public_event_overview !== true) return false;
	if (data.subscribe === true) return is_group_overview(el);
	return true;
}
if (isBrowser()) {
	var _AddToCalendarButton;
	class AddToCalendarButton extends LitElement {
		constructor() {
			super();
			this._initialized = new Promise((resolve) => this._initializedResolver = resolve);
			if (this.shadowRoot) {
				this._ssrShellNodes = Array.from(this.shadowRoot.children);
				this._deferLitRender = true;
			} else {
				this.attachShadow({
					mode: "open",
					delegatesFocus: true
				});
				this._ssrShellNodes = [];
				this._deferLitRender = false;
			}
			this._buttonTemplate = null;
			this.state = {
				initializing: false,
				initialized: false,
				ready: false,
				updatePending: false
			};
			this.data = {};
			this.error = false;
		}
		removeSsrShell() {
			for (const node of this._ssrShellNodes) node.remove();
			this._ssrShellNodes = [];
		}
		createRenderRoot() {
			return this.shadowRoot;
		}
		shouldUpdate() {
			return !this._deferLitRender;
		}
		render() {
			var _this$_buttonTemplate;
			return html`<div class="atcb-initialized atcb-hidden">${(_this$_buttonTemplate = this._buttonTemplate) !== null && _this$_buttonTemplate !== void 0 ? _this$_buttonTemplate : nothing}</div>`;
		}
		connectedCallback() {
			super.connectedCallback();
			if (this._ssrShellNodes.length === 0) {
				var _this$querySelector;
				(_this$querySelector = this.querySelector(":scope > template[shadowrootmode]")) === null || _this$querySelector === void 0 || _this$querySelector.remove();
			}
			if (!this.initializing) {
				this.initializing = true;
				setTimeout(() => this.initializeComponent(), 0);
			}
		}
		async initializeComponent() {
			var _this = this;
			if (_this.state.ready) return;
			await _this.updateComplete;
			_this.state.initializing = true;
			const debugVal = getConfigAttribute(_this, "debug");
			_this.debug = hasConfigAttribute(_this, "debug") && (!debugVal || debugVal === "true" || debugVal === "") ? true : false;
			if (hasConfigAttribute(_this, "proOverride")) {
				const proOverrideVal = getConfigAttribute(_this, "proOverride");
				_this.proOverride = !proOverrideVal || proOverrideVal === "true" || proOverrideVal === "" ? true : false;
			}
			try {
				const proKeyVal = getConfigAttribute(_this, "proKey");
				if (proKeyVal && proKeyVal !== "") {
					_this.data = await get_pro_data(proKeyVal, _this);
					if (_this.data.proKey) _this.prokey = _this.data.proKey;
					if (should_render_group_overview(_this, _this.data)) {
						await _this.initGroupOverview();
						_this.state.initializing = false;
						_this.state.initialized = true;
						_this.state.ready = true;
						_this._initializedResolver();
						return;
					}
				} else {
					_this.data.proKey = "";
					_this.data = await process_inline_data(_this, _this.debug);
				}
			} catch (e) {
				if (_this.debug) {
					console.error(e);
					render_debug_msg(_this.shadowRoot, e);
				}
				_this.removeSsrShell();
				_this.error = true;
				_this.state.initializing = false;
				_this.state.ready = true;
				_this._initializedResolver();
				return;
			}
			await _this.initButton();
			_this.state.initializing = false;
			_this.state.initialized = true;
			_this.state.ready = true;
			_this._initializedResolver();
		}
		whenInitialized() {
			return this._initialized;
		}
		disconnectedCallback() {
			var _this$_groupOverviewA;
			super.disconnectedCallback();
			(_this$_groupOverviewA = this._groupOverviewAbort) === null || _this$_groupOverviewA === void 0 || _this$_groupOverviewA.abort();
			cleanup(this.shadowRoot, this.identifier);
			if (this.debug) console.log("Add to Calendar Button \"" + (this.identifier || this.getAttribute("identifier") || "not yet initialized") + "\" destroyed");
			if (document.querySelectorAll("add-to-calendar-button").length === 0) buttonCount = 0;
		}
		static get observedAttributes() {
			var _super$observedAttrib;
			const litObserved = (_super$observedAttrib = super.observedAttributes) !== null && _super$observedAttrib !== void 0 ? _super$observedAttrib : [];
			return [.../* @__PURE__ */ new Set([...litObserved, ...observedConfigAttributes(wcParams)])];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (!this.state.ready) return;
			if (this.debug && this.state.initialized) console.log(`${name}'s value has been changed from ${oldValue} to ${newValue}`);
			if (!this.updatePending) {
				this.updatePending = true;
				setTimeout(() => this.updateComponent(), 0);
			}
		}
		async updateComponent() {
			var _this2 = this;
			if (!_this2.updatePending) return;
			_this2.data = {};
			_this2._buttonTemplate = null;
			await _this2.updateComplete;
			const rootObj = _this2.shadowRoot.querySelector(".atcb-initialized:not([data-atcb-ssr])");
			if (rootObj) {
				Array.from(rootObj.children).forEach((child) => child.remove());
				rootObj.className = "atcb-initialized atcb-hidden";
				rootObj.removeAttribute("lang");
				rootObj.removeAttribute("style");
			}
			try {
				const proKeyVal = getConfigAttribute(_this2, "proKey");
				if (proKeyVal && proKeyVal !== "") {
					_this2.data = await get_pro_data(proKeyVal, _this2);
					if (_this2.data.proKey) _this2.prokey = _this2.data.proKey;
					if (should_render_group_overview(_this2, _this2.data)) {
						cleanup(_this2.shadowRoot, _this2.identifier);
						await _this2.initGroupOverview();
						_this2.updatePending = false;
						return;
					}
				} else _this2.data = await process_inline_data(_this2, _this2.debug);
			} catch (e) {
				if (_this2.debug) {
					console.error(e);
					render_debug_msg(_this2.shadowRoot, e);
				}
				_this2.updatePending = false;
				return;
			}
			cleanup(_this2.shadowRoot, _this2.identifier);
			await _this2.initButton();
			_this2.updatePending = false;
		}
		async initGroupOverview() {
			var _this3 = this;
			var _this$_groupOverviewA2;
			if (!_this3.isConnected) return;
			if (!_this3.identifier) _this3.identifier = "atcb-btn-" + ++buttonCount;
			_this3.data.identifier = _this3.identifier;
			_this3.setAttribute("atcb-button-id", _this3.identifier);
			_this3.style.visibility = "visible";
			_this3.style.opacity = "1";
			_this3.style.position = "relative";
			const deferred = _this3._deferLitRender;
			(_this$_groupOverviewA2 = _this3._groupOverviewAbort) === null || _this$_groupOverviewA2 === void 0 || _this$_groupOverviewA2.abort();
			const overviewAbort = new AbortController();
			_this3._groupOverviewAbort = overviewAbort;
			const input = read_attributes(_this3);
			input.prokey = _this3.data.proKey;
			input.subscribe = _this3.data.subscribe;
			let overview;
			try {
				overview = await render_group_overview(input, overviewAbort.signal, async (event, trigger) => {
					await atcb_action(_objectSpread2(_objectSpread2(_objectSpread2({}, input), event), {}, {
						prokey: event.prokey,
						groupOverview: false,
						inlineRsvp: "false",
						dev: input.dev === true || input.dev === "true",
						listStyle: "modal"
					}), trigger);
				});
			} catch (error) {
				if (!_this3.isConnected) {
					_this3.removeSsrShell();
					return;
				}
				if (deferred) {
					_this3._deferLitRender = false;
					_this3.requestUpdate();
					await _this3.updateComplete;
					_this3.removeSsrShell();
				}
				throw error;
			}
			if (!_this3.isConnected || overviewAbort.signal.aborted) {
				_this3.removeSsrShell();
				return;
			}
			if (deferred) {
				_this3._deferLitRender = false;
				_this3.requestUpdate();
				await _this3.updateComplete;
			}
			const root = _this3.shadowRoot.querySelector(".atcb-initialized:not([data-atcb-ssr])");
			_this3.shadowRoot.prepend(overview.style);
			root.append(overview.root);
			root.classList.remove("atcb-hidden");
			_this3.removeSsrShell();
		}
		async initButton() {
			var _this4 = this;
			if (!_this4.state.initialized) buttonCount = buttonCount + 1;
			if (_this4.identifier && _this4.identifier !== "") _this4.data.identifier = _this4.identifier;
			else {
				if (_this4.data.identifier && _this4.data.identifier !== "") {
					if (!/^[\w-]+$/.test(_this4.data.identifier)) {
						_this4.data.identifier = "";
						if (_this4.debug) {
							let prefix = "Add to Calendar Button";
							if (_this4.data.rsvp && Object.keys(_this4.data.rsvp).length > 0) prefix = "RSVP";
							console.warn(prefix + " generation: identifier invalid - using auto numbers instead");
						}
					} else _this4.data.identifier = "atcb-btn-" + _this4.data.identifier;
				}
				if (_this4.data.identifier == null || _this4.data.identifier == "") _this4.data.identifier = "atcb-btn-" + buttonCount;
				_this4.identifier = _this4.data.identifier;
			}
			_this4.setAttribute("atcb-button-id", _this4.data.identifier);
			try {
				_this4.style.visibility = "visible";
				_this4.style.opacity = "1";
				_this4.style.position = "relative";
				_this4.style.outline = "none";
				await _this4.buildButton();
				return true;
			} catch (e) {
				if (_this4.debug) {
					console.error(e.message ? e.message : e);
					render_debug_msg(_this4.shadowRoot, e);
				}
				return false;
			}
		}
		async buildButton() {
			var _this5 = this;
			const host = _this5.shadowRoot;
			try {
				host.host.classList.add("add-to-calendar");
				const data = await decorate_data(_this5.data);
				_this5.data = data;
				await ensure_locale(data);
				await validate(data);
				const deferred = _this5._deferLitRender;
				let rootObj = host.querySelector(".atcb-initialized:not([data-atcb-ssr])");
				set_light_mode(host, data);
				if (rootObj) rootObj.setAttribute("lang", data.language);
				await load_css(host, rootObj, data);
				if (data.loadAllStyles) prefetch_all_styles(data);
				setup_state_management(data);
				set_global_event_listener(host, data);
				init_log(data.proKey, data.hideBranding, data.debug);
				if (!data.hidden) {
					if (typeof generate_rsvp_form === "function" && data.rsvp && Object.keys(data.rsvp).length > 0) {
						if (!data.inlineRsvp) await generate_rsvp_button(host, data);
						else await generate_rsvp_form(host, data, rootObj);
					} else {
						_this5._deferLitRender = false;
						_this5._buttonTemplate = buttonTemplate(host, data);
						await _this5.updateComplete;
						rootObj = host.querySelector(".atcb-initialized:not([data-atcb-ssr])");
						if (deferred && rootObj) {
							rootObj.setAttribute("lang", data.language);
							if (data.inline) {
								rootObj.style.display = "inline-block";
								rootObj.classList.add("atcb-inline");
							} else if (data.buttonsList) rootObj.classList.add("atcb-buttons-list");
							rootObj.classList.remove("atcb-hidden");
						}
						host.querySelectorAll(".atcb-button-wrapper").forEach((wrapper) => {
							set_sizes(wrapper, data.sizes);
						});
						if (!data.subscribe) data.options.forEach((option) => {
							if (option !== "apple" && option !== "ical") return;
							const id = data.buttonsList ? data.identifier + "-" + option : data.identifier;
							const control = host.getElementById(id);
							if (control && (data.options.length === 1 || data.buttonsList)) prepare_ics_link(host, data, control, option, data.dates.length === 1 ? 0 : "all", "singleton");
						});
						if (data.debug) console.log("Add to Calendar Button \"" + data.identifier + "\" created");
					}
					if (!data.hideRichData && !data.subscribe && data.name && data.dates[0].location && data.dates[0].startDate) generate_rich_data(data, host.host);
				} else if (_this5._deferLitRender) {
					_this5._deferLitRender = false;
					_this5.requestUpdate();
					await _this5.updateComplete;
				}
				_this5.removeSsrShell();
				log_event("initialization", data.identifier, data.identifier);
				if (!data.proKey && data.hideBranding && !document.getElementById("atcb-reference")) create_atcbl(document.body, false, false, true);
				return true;
			} catch (e) {
				_this5.removeSsrShell();
				throw new Error(e.message);
			}
		}
	}
	_AddToCalendarButton = AddToCalendarButton;
	_AddToCalendarButton.properties = { _buttonTemplate: {
		state: true,
		attribute: false
	} };
	if (!customElements.get("add-to-calendar-button")) customElements.define("add-to-calendar-button", AddToCalendarButton);
}
async function process_inline_data(el, debug = false) {
	let data;
	try {
		data = read_attributes(el);
		await check_required(data);
	} catch (_unused) {
		const slotInput = el.innerHTML.trim();
		if (!slotInput) throw new Error("Add to Calendar Button generation failed: No data provided.");
		try {
			const jsonInput = strip_unsafe_keys(JSON.parse(secure_content(slotInput.replace(/(\r\n|\n|\r)/g, ""), false)));
			await check_required(jsonInput);
			data = jsonInput;
		} catch (jsonError) {
			if (debug) console.error(jsonError);
			throw new Error("Add to Calendar Button generation failed: no data provided or missing required fields - see console logs for details");
		}
	}
	return data;
}
function read_attributes(el, params = wcParams) {
	const data = {};
	for (let i = 0; i < params.length; i++) {
		const attr = params[`${i}`];
		const attributeName = resolveAttributeName(el, attr);
		if (attributeName !== null) {
			const inputVal = secure_content(el.getAttribute(attributeName).replace(/(\\r\\n|\\n|\\r)/g, ""), false);
			let val;
			if (wcBooleanParams.includes(attr)) val = !inputVal || inputVal === "" || inputVal.toLowerCase() === "true" ? true : false;
			else if (wcObjectParams.includes(attr)) {
				const cleanedInput = (function() {
					if (!inputVal || inputVal === "") return "{}";
					if (inputVal.substring(0, 1) != "{") return "{" + inputVal + "}";
					return inputVal;
				})();
				val = strip_unsafe_keys(JSON.parse(cleanedInput));
			} else if (wcObjectArrayParams.includes(attr)) {
				const cleanedInput = (function() {
					if (!inputVal || inputVal === "") return "[]";
					if (inputVal.substring(0, 1) != "[") return "[" + inputVal + "]";
					return inputVal;
				})();
				val = strip_unsafe_keys(JSON.parse(cleanedInput));
			} else if (wcArrayParams.includes(attr)) {
				let arrVal = inputVal;
				if (inputVal.includes("[")) arrVal = arrVal.substring(1, arrVal.length - 1);
				if (inputVal.includes("\"") || inputVal.includes("'")) arrVal = arrVal.substring(1, arrVal.length - 1);
				if (!inputVal.includes("|")) arrVal = arrVal.replace(/\s/g, "");
				if (arrVal.includes("','")) val = arrVal.split("','");
				else val = arrVal.split("\",\"");
			} else if (wcNumberParams.includes(attr)) val = parseInt(inputVal);
			else val = inputVal;
			if (typeof val === "object" && val !== null && Object.keys(val).length === 0 || Array.isArray(val) && (val.length === 0 || val.length === 1 && val[0] === "")) continue;
			data[`${attr}`] = val;
		}
	}
	return data;
}
function cleanup(host, identifier) {
	revoke_ics_blob_urls(identifier);
	close(host);
	unset_global_event_listener(identifier);
	const schemaEl = document.getElementById("atcb-schema-" + identifier);
	if (schemaEl) schemaEl.remove();
	Array.from(host.querySelectorAll(".atcb-debug-error-msg")).concat(Array.from(host.querySelectorAll("style"))).concat(Array.from(host.querySelectorAll("link"))).concat(Array.from(host.querySelectorAll(".atcb-placeholder"))).concat(Array.from(host.querySelectorAll(".atcb-button-wrapper"))).forEach((el) => el.remove());
	deleteButtonInstance(`${identifier}`);
}
function set_light_mode(shadowRoot, data) {
	shadowRoot.host.classList.remove("atcb-dark", "atcb-light", "atcb-bodyScheme");
	const hostLightMode = (function() {
		if (data.lightMode == "bodyScheme") {
			if (document.body.classList.contains("atcb-dark") || document.documentElement.classList.contains("atcb-dark") || document.body.classList.contains("atcp-dark") || document.documentElement.classList.contains("atcp-dark") || document.body.classList.contains("dark") || document.documentElement.classList.contains("dark")) return "dark";
			else return "light";
		}
		return data.lightMode;
	})();
	shadowRoot.host.classList.add("atcb-" + hostLightMode);
}
function csp_nonce(host) {
	const cspnonceRegex = /[`'"()[\]{}<>\s]/;
	if (!host.host.hasAttribute("cspnonce")) return null;
	if (cspnonceRegex.test(host.host.getAttribute("cspnonce"))) throw new Error("cspnonce input contains forbidden characters.");
	return host.host.getAttribute("cspnonce");
}
async function load_css(host, rootObj = null, data) {
	const nonceVal = csp_nonce(host);
	if (!document.getElementById("atcb-global-style")) {
		const cssGlobalContent = document.createElement("style");
		cssGlobalContent.id = "atcb-global-style";
		cssGlobalContent.innerText = ".atcb-modal-no-scroll{overflow-y:hidden !important;-webkit-overflow-scrolling:touch;} body.atcb-modal-no-scroll{padding-right:" + (window.innerWidth - document.documentElement.clientWidth) + "px;}.atcb-attribution{display:none;}";
		if (nonceVal) cssGlobalContent.setAttribute("nonce", nonceVal);
		document.head.append(cssGlobalContent);
	}
	const generalCssContent = document.createElement("style");
	generalCssContent.innerText = `.atcb-initialized { display: block; position: relative; width: ${data.inlineRsvp && data.rsvp && Object.keys(data.rsvp).length > 0 ? "100%" : "fit-content"}; }.atcb-initialized.atcb-inline { display: inline-block; }.atcb-initialized.atcb-buttons-list { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--buttonslist-gap); }.atcb-hidden { display: none; }`;
	if (nonceVal) generalCssContent.setAttribute("nonce", nonceVal);
	host.prepend(generalCssContent);
	const overrideDefaultCss = (function() {
		if (data.styleLight) return ":host{" + secure_content(data.styleLight.replace(/(\\r\\n|\\n|\\r)/g, ""), false) + "}";
		return "";
	})();
	const overrideDarkCss = (function() {
		if (data.styleDark) return ":host(.atcb-dark){" + secure_content(data.styleDark.replace(/(\\r\\n|\\n|\\r)/g, ""), false) + "}";
		return "";
	})();
	if (data.customCss && data.customCss !== "") {
		const cssFile = document.createElement("link");
		cssFile.setAttribute("rel", "stylesheet");
		cssFile.setAttribute("type", "text/css");
		cssFile.setAttribute("href", data.customCss);
		if (nonceVal) cssFile.setAttribute("nonce", nonceVal);
		if (!rootObj) await loadExternalCssAsynch(cssFile, host, null, nonceVal, null, false, false, overrideDefaultCss + overrideDarkCss);
		else {
			const placeholder = document.createElement("div");
			placeholder.classList.add("atcb-placeholder");
			host.prepend(placeholder);
			const placeholderCssContent = document.createElement("style");
			placeholderCssContent.innerText = ".atcb-placeholder { background-color: #777; border-radius: 200px; height: 40px; opacity: .3; width: 150px; }";
			if (nonceVal) placeholderCssContent.setAttribute("nonce", nonceVal);
			host.prepend(placeholderCssContent);
			loadExternalCssAsynch(cssFile, host, rootObj, nonceVal, placeholder, data.inline, data.buttonsList, overrideDefaultCss + overrideDarkCss);
		}
		return;
	}
	const styleCss = await ensure_style(data);
	if (styleCss) {
		const cssContent = document.createElement("style");
		if (nonceVal) cssContent.setAttribute("nonce", nonceVal);
		cssContent.innerText = styleCss + overrideDefaultCss + overrideDarkCss;
		host.prepend(cssContent);
	}
	if (rootObj) {
		if (data.inline) {
			rootObj.style.display = "inline-block";
			rootObj.classList.add("atcb-inline");
		} else if (data.buttonsList) rootObj.classList.add("atcb-buttons-list");
		rootObj.classList.remove("atcb-hidden");
	}
}
async function loadExternalCssAsynch(cssFile, host, rootObj = null, nonceVal = null, placeholder = null, inline = false, buttonsList = false, overrideCss = "") {
	if (overrideCss !== "") {
		const cssContent = document.createElement("style");
		cssContent.innerText = overrideCss;
		if (nonceVal) cssContent.setAttribute("nonce", nonceVal);
		host.prepend(cssContent);
	}
	try {
		host.prepend(cssFile);
		await new Promise((resolve) => {
			cssFile.onload = resolve;
		});
		if (rootObj) {
			if (placeholder) placeholder.remove();
			if (inline) {
				rootObj.style.display = "inline-block";
				rootObj.classList.add("atcb-inline");
			} else if (buttonsList) rootObj.classList.add("atcb-buttons-list");
			rootObj.classList.remove("atcb-hidden");
		}
	} catch (e) {
		console.log(e);
	}
}
function render_debug_msg(host, error) {
	if (host.querySelector(".atcb-debug-error-msg")) return;
	const nonceVal = csp_nonce(host);
	const errorBanner = document.createElement("div");
	errorBanner.classList.add("atcb-debug-error-msg");
	const cssContent = document.createElement("style");
	cssContent.innerText = ".atcb-debug-error-msg { color: #bf2e2e; font-size: 12px; font-weight: bold; padding: 12px 15px; border: 2px solid #bf2e2e; max-width: 180px; border-radius: 13px; }";
	if (nonceVal) cssContent.setAttribute("nonce", nonceVal);
	host.prepend(cssContent);
	errorBanner.textContent = error;
	host.append(errorBanner);
}
function setup_state_management(data) {
	const singleDates = {};
	for (let i = 0; i < data.options.length; i++) {
		singleDates[data.options[`${i}`]] = [];
		for (let id = 1; id <= data.dates.length; id++) if (data.dates[id - 1].status === "cancelled") singleDates[data.options[`${i}`]].push(1);
		else singleDates[data.options[`${i}`]].push(0);
	}
	createButtonInstance(data.identifier, data, singleDates);
}
function init_log(pro = "", hide = false, debug = false) {
	if (!initialGlobalInit) {
		const versionOutput = (function() {
			if (debug) return " (version " + atcbVersion + ")";
			return "";
		})();
		if (pro !== "") {
			if (!hide || debug) console.log("Add to Calendar PRO script initialized" + versionOutput + " | https://add-to-calendar-pro.com");
		} else {
			console.log("%c\nAdd to Calendar Button script initialized" + versionOutput + "\nsee https://add-to-calendar-button.com for details.\n", "font-weight: bold;");
			console.log("%c✨ PRO version available at https://add-to-calendar-pro.com ← check it out!", "font-weight: bold; line-height: 60px;");
		}
		initialGlobalInit = true;
	}
}
async function get_pro_data(licenseKey, el, directData = {}) {
	/*!
	*  @preserve
	*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
	*/
	if (licenseKey && licenseKey !== "") try {
		const proOverride = el ? el.proOverride : directData.proOverride;
		const dataOverrides = el ? read_attributes(el, proOverride ? wcParams : wcProParams) : directData;
		const response = await fetch(`https://${dataOverrides.dev ? "event-dev.caldn.net" : "event.caldn.net"}/${licenseKey}/config.json`);
		if (response.ok) {
			const data = strip_unsafe_keys(await response.json());
			if (proOverride) {
				const domain = (window.location.hostname || "").split(".").slice(-2).join(".");
				wcParams.forEach((key) => {
					if (Object.prototype.hasOwnProperty.call(dataOverrides, key) && ([
						"hideBranding",
						"ty",
						"rsvp"
					].indexOf(key) === -1 || domain === "caldn.net" || domain === "add-to-calendar-pro.com")) data[`${key}`] = dataOverrides[`${key}`];
				});
			} else wcProParams.forEach((key) => {
				if (Object.prototype.hasOwnProperty.call(dataOverrides, key)) data[`${key}`] = dataOverrides[`${key}`];
			});
			if (dataOverrides.rsvp && Object.prototype.hasOwnProperty.call(dataOverrides.rsvp, "none")) delete data.rsvp;
			if ((!data.name || data.name === "") && (!data.dates || data.dates[0].name === "")) throw new Error("Not possible to read prokey config from server...");
			if (data.landingpage.domain && data.landingpage.domain !== "" && secure_url(data.landingpage.domain)) {
				data.domain = data.landingpage.domain;
				delete data.landingpage;
			}
			if ((!data.proxy || data.proxy === "") && (!data.hideBranding || data.hideBranding === "")) {
				for (let i = 0; i < data.dates.length; i++) if (data.dates[`${i}`].description && data.dates[`${i}`].description !== "") data.dates[`${i}`].description += "[br][br][p]Powered by add-to-calendar-pro.com[/p]";
				else data.dates[`${i}`].description = "Powered by add-to-calendar-pro.com";
				if (data.description && data.description !== "") data.description += "Powered by add-to-calendar-pro.com";
			}
			data.proKey = licenseKey;
			data.identifier = licenseKey;
			return data;
		}
		throw new Error("Not possible to read prokey config from server...");
	} catch (originalError) {
		console.error(originalError);
		throw new Error("prokey invalid or server not responding!");
	}
	return {};
}
function set_global_event_listener(host, data) {
	if (!isBrowser()) return;
	if (data.lightMode == "bodyScheme") {
		const existingObserver = lightModeMutationObserver.get(data.identifier);
		if (existingObserver) existingObserver.disconnect();
		const observer = new MutationObserver(function(mutationsList) {
			mutationsList.forEach((mutation) => {
				if (mutation.attributeName === "class") set_light_mode(host, data);
			});
		});
		observer.observe(document.documentElement, { attributes: true });
		observer.observe(document.body, { attributes: true });
		lightModeMutationObserver.set(data.identifier, observer);
	}
	if (!initialGlobalInit) {
		document.addEventListener("keyup", global_listener_keyup);
		document.addEventListener("keydown", global_listener_keydown);
		window.addEventListener("resize", global_listener_resize);
	}
}
function global_listener_keyup(event) {
	const host = (function() {
		const root = document.querySelector("[atcb-button-id=\"" + getActiveButton() + "\"]");
		if (root) return root.shadowRoot;
		return null;
	})();
	if (host && event.key === "Escape") {
		log_event("closeList", "Ecs Hit", getActiveButton());
		toggle(host, "close", "", "", true);
	}
}
function global_listener_keydown(event) {
	const host = (function() {
		const root = document.querySelector("[atcb-button-id=\"" + getActiveButton() + "\"]");
		const rootModal = document.getElementById(getActiveButton() + "-modal-host");
		if (rootModal) return rootModal.shadowRoot;
		if (root) return root.shadowRoot;
		return null;
	})();
	if (host && !host.querySelector(".atcb-list") && host.querySelector(".atcb-modal") && event.key === "Tab") {
		event.preventDefault();
		const modals = host.querySelectorAll(".atcb-modal[data-modal-nr]");
		const topModal = modals.length > 0 ? modals[modals.length - 1] : host.querySelector(".atcb-modal");
		const focusables = Array.from(topModal.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")).filter((el) => !el.hasAttribute("disabled"));
		if (focusables.length > 0) {
			const active = host.activeElement;
			const currentIndex = focusables.findIndex((el) => el === active);
			focusables[`${(function() {
				if (event.shiftKey) return currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
				return currentIndex === -1 || currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
			})()}`].focus();
		}
		return;
	}
	if (host && host.querySelector(".atcb-list") && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Tab")) {
		event.preventDefault();
		let targetFocus = 0;
		const currFocusOption = host.activeElement;
		const optionListCount = host.querySelectorAll("[role=\"menuitem\"]").length;
		if ((currFocusOption === null || currFocusOption === void 0 ? void 0 : currFocusOption.role) === "menuitem") {
			if (event.key === "ArrowDown" && currFocusOption.dataset.optionNumber < optionListCount) targetFocus = parseInt(currFocusOption.dataset.optionNumber) + 1;
			else if (event.key === "Tab") {
				if (event.shiftKey) {
					if (currFocusOption.dataset.optionNumber > 1) targetFocus = parseInt(currFocusOption.dataset.optionNumber) - 1;
					else targetFocus = optionListCount;
				} else if (currFocusOption.dataset.optionNumber < optionListCount) targetFocus = parseInt(currFocusOption.dataset.optionNumber) + 1;
				else targetFocus = 1;
			} else if (event.key === "ArrowUp" && currFocusOption.dataset.optionNumber >= 1) targetFocus = parseInt(currFocusOption.dataset.optionNumber) - 1;
			if (targetFocus > 0) host.querySelector("[role=\"menuitem\"][data-option-number=\"" + targetFocus + "\"]").focus();
		} else switch (event.key) {
			default:
				host.querySelector("[role=\"menuitem\"][data-option-number=\"1\"]").focus();
				break;
			case "ArrowUp": host.querySelector("[role=\"menuitem\"][data-option-number=\"" + optionListCount + "\"]").focus();
		}
	}
}
function global_listener_resize() {
	const host = (function() {
		const root = document.querySelector("[atcb-button-id=\"" + getActiveButton() + "\"]");
		const rootModal = document.getElementById(getActiveButton() + "-modal-host");
		if (rootModal) return rootModal.shadowRoot;
		if (root) return root.shadowRoot;
		return null;
	})();
	if (host) {
		if (host.querySelector("#atcb-bgoverlay")) manage_body_scroll(host);
	}
}
function unset_global_event_listener(identifier) {
	const observer = lightModeMutationObserver.get(identifier);
	if (observer) {
		observer.disconnect();
		lightModeMutationObserver.delete(identifier);
	}
}
//#endregion
//#region src/ui/generate.ts
function close_modal_list_if_idle(host, data) {
	const modalHost = document.getElementById(data.identifier + "-modal-host");
	if (!modalHost || !modalHost.shadowRoot || !modalHost.shadowRoot.querySelector(".atcb-modal-box")) toggle(host, "close");
}
function generate_label(host, data, parent, type, icon = false, text = "", oneOption = false) {
	switch (type) {
		case "trigger":
		case "rsvp":
		default:
			parent.id = data.identifier;
			if (!data.blockInteraction) {
				parent.addEventListener("keyup", function(event) {
					if (event.key === "Enter" || event.code == "Space") {
						event.preventDefault();
						if (type === "rsvp" && typeof generate_rsvp_form === "function") generate_rsvp_form(host, data, parent, true);
						else toggle(host, "auto", data, parent, true, true);
					}
				});
				parent.addEventListener("touchend", debounce_leading((event) => {
					event.preventDefault();
					if (type === "rsvp" && typeof generate_rsvp_form === "function") generate_rsvp_form(host, data, parent);
					else toggle(host, "auto", data, parent, false, true);
				}));
				if (data.trigger === "click" || type === "rsvp" && typeof generate_rsvp_form === "function") parent.addEventListener("mouseup", debounce_leading((event) => {
					event.preventDefault();
					if (type === "rsvp" && typeof generate_rsvp_form === "function") generate_rsvp_form(host, data, parent);
					else toggle(host, "auto", data, parent, false, true);
				}));
				else parent.addEventListener("mouseenter", function() {
					toggle(host, "open", data, parent, false, true);
				});
			}
			break;
		case "apple":
		case "google":
		case "ical":
		case "msteams":
		case "ms365":
		case "outlookcom":
		case "yahoo":
			parent.id = data.identifier + "-" + type;
			if (!data.blockInteraction) {
				parent.addEventListener("click", debounce_leading(async () => {
					if (oneOption) {
						var _host$querySelector;
						(_host$querySelector = host.querySelector("#" + parent.id)) === null || _host$querySelector === void 0 || _host$querySelector.blur();
						log_event("openSingletonLink", parent.id, data.identifier);
					} else {
						if (data.listStyle !== "modal") toggle(host, "close");
						log_event("openCalendarLink", parent.id, data.identifier);
					}
					await generate_links(host, type, data);
					if (!oneOption && data.listStyle === "modal") close_modal_list_if_idle(host, data);
				}));
				parent.addEventListener("keyup", async function(event) {
					if (event.key === "Enter") {
						event.preventDefault();
						if (oneOption) {
							var _host$querySelector2;
							(_host$querySelector2 = host.querySelector("#" + parent.id)) === null || _host$querySelector2 === void 0 || _host$querySelector2.blur();
							log_event("openSingletonLink", parent.id, data.identifier);
						} else {
							if (data.listStyle !== "modal") toggle(host, "close");
							log_event("openCalendarLink", parent.id, data.identifier);
						}
						await generate_links(host, type, data, "all", true);
						if (!oneOption && data.listStyle === "modal") close_modal_list_if_idle(host, data);
					}
				});
			}
			break;
		case "close":
			parent.id = data.identifier + "-close";
			parent.addEventListener("click", debounce(() => {
				log_event("closeList", "List Close Button", getActiveButton());
				toggle(host, "close", data, "all", true);
			}));
			parent.addEventListener("keyup", function(event) {
				if (event.key === "Enter") {
					event.preventDefault();
					log_event("closeList", "List Close Button", getActiveButton());
					toggle(host, "close", data, "all", true);
				}
			});
	}
	generate_label_content(data, parent, type, icon, text, oneOption);
}
function generate_label_content(data, parent, type, icon, text, oneOption) {
	if (!data.buttonsList && oneOption) type = "trigger";
	const defaultTriggerText = (function() {
		if (data.pastDateHandling != "none") {
			let allOverdue = true;
			for (let i = 0; i < data.dates.length; i++) if (!data.dates[`${i}`].overdue) {
				allOverdue = false;
				break;
			}
			if (allOverdue) return translate_hook("expired", data);
		}
		return translate_hook("label.addtocalendar", data);
	})();
	if (text === "") {
		if (data.options.length === 1 || type === "trigger") text = defaultTriggerText;
		else if (type === "close") text = translate_hook("close", data);
		else text = translate_hook(type, data);
	}
	if (data.buttonStyle === "date" && (type === "trigger" || oneOption)) return;
	parent.setAttribute("aria-label", oneOption ? translate_hook("label.addtocalendar", data) + " (" + translate_hook(type, data) + "): " + data.name : type === "trigger" ? text + ": " + data.name : text);
	if (icon) {
		const iconEl = document.createElement("div");
		iconEl.classList.add("atcb-icon");
		iconEl.setAttribute("part", type === "trigger" ? "atcb-button-icon" : "atcb-list-icon");
		iconEl.classList.add(`atcb-icon-${type}`);
		iconEl.innerHTML = icons[`${type}`];
		parent.append(iconEl);
	}
	if ((type === "trigger" || oneOption) && !data.hideTextLabelButton || !oneOption && type !== "trigger" && !data.hideTextLabelList) {
		const textEl = document.createElement("span");
		textEl.classList.add("atcb-text");
		textEl.setAttribute("part", type === "trigger" ? "atcb-button-text" : "atcb-list-text");
		textEl.textContent = text;
		parent.append(textEl);
	}
}
function generate_dropdown_list(host, data) {
	const optionsList = document.createElement("div");
	optionsList.classList.add("atcb-list");
	optionsList.setAttribute("part", "atcb-list");
	optionsList.role = "menu";
	if (data.rtl) optionsList.classList.add("atcb-rtl");
	if (data.hideTextLabelList) optionsList.classList.add("atcb-no-text");
	let listHeader = null;
	if (data.listStyle === "modal") {
		listHeader = document.createElement("div");
		listHeader.classList.add("atcb-list-modal-header");
		const listHeadline = document.createElement("div");
		listHeadline.classList.add("atcb-list-modal-headline");
		listHeadline.setAttribute("part", "atcb-list-modal-headline");
		listHeadline.textContent = translate_hook("label.addtocalendar", data);
		listHeader.append(listHeadline);
		optionsList.append(listHeader);
	}
	let listCount = 0;
	data.options.forEach(function(option) {
		const optionItem = document.createElement("div");
		optionItem.classList.add("atcb-list-item");
		optionItem.setAttribute("part", "atcb-list-item");
		optionItem.role = "menuitem";
		optionItem.tabIndex = 0;
		listCount++;
		optionItem.dataset.optionNumber = `${listCount}`;
		optionsList.append(optionItem);
		generate_label(host, data, optionItem, option, !data.hideIconList);
		prepare_ics_link(host, data, optionItem, option, data.dates.length === 1 ? 0 : "all", "list");
	});
	if (data.listStyle === "modal") {
		const optionItem = document.createElement("div");
		optionItem.classList.add("atcb-list-item-close");
		optionItem.setAttribute("part", "atcb-list-item-close");
		optionItem.role = "menuitem";
		optionItem.tabIndex = 0;
		listCount++;
		optionItem.dataset.optionNumber = `${listCount}`;
		listHeader.append(optionItem);
		generate_label(host, data, optionItem, "close", true);
	}
	return optionsList;
}
function generate_bg_overlay(host, trigger = "", modal = false, darken = true, closable = true) {
	const bgOverlay = (function() {
		if (modal) return document.createElement("dialog");
		return document.createElement("div");
	})();
	bgOverlay.id = "atcb-bgoverlay";
	if (!darken) bgOverlay.classList.add("atcb-no-bg");
	if (!modal) bgOverlay.role = "presentation";
	bgOverlay.tabIndex = -1;
	if (closable) {
		bgOverlay.addEventListener("mouseup", debounce_leading((e) => {
			if (e.target !== e.currentTarget) return;
			log_event("closeList", "Background Hit", getActiveButton());
			toggle(host, "close");
		}));
		let fingerMoved = false;
		bgOverlay.addEventListener("touchstart", debounce_leading(() => fingerMoved = false), { passive: true });
		bgOverlay.addEventListener("touchmove", debounce_leading(() => fingerMoved = true), { passive: true });
		bgOverlay.addEventListener("touchend", debounce((e) => {
			if (fingerMoved !== false || e.target !== e.currentTarget) return;
			log_event("closeList", "Background Hit", getActiveButton());
			toggle(host, "close");
		}), { passive: true });
		if (trigger !== "click") bgOverlay.addEventListener("mousemove", debounce_leading((e) => {
			if (e.target !== e.currentTarget) return;
			log_event("closeList", "Background Hit", getActiveButton());
			toggle(host, "close");
		}));
		else bgOverlay.classList.add("atcb-click");
	}
	return bgOverlay;
}
/*!
*  @preserve
*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
*/
function create_atcbl(host, atList = true, returnEl = false, licenseNoteOnly = false) {
	const list = document.createElement("div");
	list.id = "atcb-reference";
	if (!licenseNoteOnly) {
		setTimeout(() => {
			list.innerHTML = "<a href=\"https://add-to-calendar-pro.com\" target=\"_blank\" rel=\"noopener\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 52.916 2.8305\"><path d=\"M51.446 1.2565c.0708-.2518.293-.4511.5555-.4783.2211-.042.4641.0128.622.18.2474.2472.3045.6146.2916.9503v.8594h-.8307l-.0027-1.0447c-.0079-.1547-.1075-.343-.2868-.3238-.2049.0128-.3115.2421-.295.4257v.9428h-.823l-.0027-1.0435c-.0076-.1569-.1131-.3412-.2918-.3252-.2069.008-.311.2351-.2939.4188v.9499h-.8307V.8237h.8307v.4019c.0906-.2264.2876-.4188.5368-.449.2878-.0533.6071.0705.7509.3331.0279.0465.0509.0959.0699.1468zm-3.9843.5228c-.0102.1874.107.3914.3024.424.1869.0419.3799-.0941.4215-.2776.0535-.1967-.0023-.4493-.2015-.5411-.1767-.0892-.4107.0032-.483.1865-.0297.0649-.0391.1374-.0392.2082zm-.7691 0c.0037-.2984.1395-.5957.3792-.7774.3035-.2327.7168-.2798 1.0829-.2005.3299.0729.6352.3018.7481.6275.1337.3797.0441.8526-.2795 1.1099-.3184.2561-.7624.3092-1.152.2184-.3379-.0788-.6426-.3312-.7369-.6717a1.092 1.092 0 0 1-.0417-.3063zm-.2351-.3308c-.1638-.0482-.3406-.0889-.5104-.0492s-.2742.2154-.2664.3837c-.0082.1705.0998.3468.2712.3876.1657.0389.3389.0016.4979-.0492l.0769.5499c-.2369.1272-.5165.1434-.7791.1149-.3236-.0401-.6353-.2311-.7805-.529-.1237-.2511-.139-.5539-.0485-.8181.108-.3075.3782-.5432.6902-.6287.2064-.058.4286-.0585.6371-.0119.1027.0253.198.0732.2884.1269l-.0769.523zm-2.6877.9806c-.003-.1221.066-.2371.1643-.3062.1303-.0934.3092-.1186.4572-.0533.132.054.2426.1752.2607.3197s-.0575.2836-.1746.3603c-.1633.1093-.3947.1063-.5517-.0135-.0951-.0715-.1577-.187-.1559-.307zm-3.046-1.0111c-.0091-.4276.1794-.8577.5181-1.1231.3714-.2958.8865-.3488 1.3384-.2477.4065.0946.7695.3811.9242.7731.2302.553.1173 1.2562-.3406 1.6606-.4021.3563-.9997.4264-1.5018.273-.4407-.1312-.7876-.5106-.8926-.9564a1.565 1.565 0 0 1-.0458-.3795zm1.4499.6961c.2631.014.4813-.2093.5326-.4557.0785-.3033.0224-.6834-.2491-.8753-.2182-.159-.5514-.1019-.704.1211-.1692.2437-.1902.5756-.088.8501.0775.2087.2816.3661.5085.3597zm-1.631.6458c-.1978.0602-.4078.0938-.6123.0464-.2697-.0443-.5044-.2371-.6009-.4927-.0701-.1852-.1026-.3819-.154-.5728h-.1846v1.0268h-.8614V.0601l1.3192.0034c.3398.0217.7177.1323.9118.434.152.2456.127.584-.0389.8163-.0979.1284-.2387.2162-.3846.2807.0316.1513.0475.3167.1461.4418.1193.1187.3064.1031.4596.0812v.6422zm-.871-1.8651c.0103-.138-.1243-.231-.25-.2384-.1427-.0193-.2871-.0088-.4307-.0115v.5422c.1905-.0038.3947.0138.5678-.0796a.234.234 0 0 0 .1128-.2126zM35.573.0603l1.1424.0047c.3439.0209.7218.1098.9446.3944.2252.2934.2163.7545-.0512 1.0195-.279.2859-.698.3701-1.0838.362-.0329.0105-.1126-.0258-.102.0281v.8987h-.8499V.0603zm1.0192 1.2345c.1672.0054.3805-.0562.4233-.2409.0425-.1434-.0225-.3102-.1619-.3724-.1328-.0705-.2859-.0537-.4306-.0559v.6615c.0561.0073.1128.0073.1692.0077zm-2.5176.2226h1.0576v.4653h-1.0576zM32.3311.8234h.8307v.4019q.0942-.2384.25-.348.1577-.1115.3615-.1115l.1154.6442q-.375 0-.5519.0808-.175.0788-.175.2538v1.023h-.8307zm-1.2257 1.5791c-.0937.2116-.2986.3716-.5319.3897-.3887.0533-.7844-.1743-.9578-.5217-.2044-.381-.1519-.892.1543-1.2049.2461-.2614.6627-.389.9973-.2285.1574.0799.2779.2236.3381.3886V.7662h.8268v2.0017h-.8268v-.3653zm0-.6345c-.0052-.2449-.2747-.4425-.5088-.3585-.217.0615-.3402.3271-.243.5316.0896.2161.3875.3078.5783.1678.1106-.0747.179-.2073.1735-.3408zM27.7118.7662c.2401-.008.4923.1021.6064.3222.0351.0816.045.0806.0397.0023V.1721l.8307-.1231v2.7189h-.8307v-.3653c-.0907.2158-.3003.3744-.5356.39-.3605.0507-.7279-.1432-.9123-.4525-.2569-.3983-.1992-.9693.1456-1.2985.173-.1702.412-.2772.6563-.2754zm.6461 1.0018c-.0048-.2526-.2909-.4519-.5276-.3518-.2324.0782-.3309.3933-.1843.5898.1239.1938.425.2285.5871.0636.0811-.0768.1287-.1897.1248-.3015zM24.139.8233h.7922v.4019c.1006-.2169.2949-.397.5347-.4408.2696-.0572.58.0085.76.2293.2045.2403.2438.5692.2358.8734v.8802h-.8268l-.0022-1.1213c-.004-.1252-.0677-.2748-.2066-.2939-.2045-.0306-.3739.1457-.4412.3226-.0292.0785-.0098.1646-.0154.2467v.8459h-.8306V.8233zm-1.0416 1.4236c.2011-.0002.3981-.0574.5807-.1384l.0961.5288c-.3198.1421-.6806.1894-1.027.145-.3369-.0473-.6587-.2545-.8007-.5699-.1588-.3469-.1132-.7886.1413-1.0788.2741-.3191.7406-.4335 1.1413-.3308.2768.0734.5008.3019.5751.5779.0429.146.0624.3015.043.453l-1.1806.1538c.0368.134.158.2311.2944.2482.0449.0082.0907.0114.1363.0114zm.1461-.7557c-.0268-.1234-.1257-.237-.2578-.244-.143-.0241-.2868.0725-.325.2111-.0103.0527-.0737.2029.0271.1552l.5558-.1223zm-1.4939 1.1721c-.2463.1208-.5356.1686-.805.1092-.227-.0527-.3993-.2481-.4518-.4712-.0545-.2125-.0296-.4333-.0353-.6502V.1714l.8307-.1231.0011 1.9292c.002.1378.1537.1938.2711.1813.0651.0169.1819-.1.162.0152l.0274.4893zm-2.5115-.2609c-.0937.2116-.2986.3716-.5319.3897-.3887.0533-.7844-.1743-.9578-.5217-.2044-.381-.1519-.892.1543-1.2049.2461-.2614.6627-.389.9973-.2285.1574.0799.2779.2236.3381.3886V.7661h.8268v2.0017h-.8268v-.3653zm0-.6345c-.0052-.2449-.2747-.4425-.5088-.3585-.217.0615-.3402.3271-.243.5316.0896.2161.3875.3078.5783.1678.1106-.0747.179-.2073.1735-.3408zm-2.3726.35c.1696.0054.3334-.0479.4884-.1115l.1077.6249c-.5137.3026-1.2229.2625-1.6732-.1399-.2959-.2444-.4693-.6191-.4819-1.0009-.0323-.4791.181-.9792.5853-1.2496.4565-.3128 1.0898-.3142 1.5659-.0438l-.1038.6115c-.2721-.1029-.5957-.168-.8667-.0274-.2291.1239-.3077.4039-.2984.6481-.0043.2465.1061.5161.3427.6212.1037.0495.2198.0676.3339.0676zm-2.923-.6005h1.0576v.4653h-1.0576zm-1.7829.2619c-.0102.1874.107.3914.3024.424.1869.0419.3799-.0941.4215-.2776.0535-.1967-.0023-.4493-.2015-.5411-.1767-.0892-.4107.0032-.4831.1865-.0297.0649-.0391.1374-.0392.2082zm-.7691 0c.0037-.2984.1395-.5957.3792-.7774.3035-.2327.7168-.2798 1.0829-.2005.33.0729.6352.3018.7481.6275.1337.3797.0441.8526-.2795 1.1099-.3184.2561-.7624.3092-1.152.2184-.3379-.0788-.6426-.3312-.7369-.6717a1.092 1.092 0 0 1-.0417-.3063zm-.1976.8841c-.2463.1208-.5356.1686-.805.1092-.227-.0527-.3993-.2481-.4518-.4712-.0557-.2169-.0286-.4422-.0334-.6635l.0019-.3551h-.25V.7943h.3115l.3653-.7461h.4v.7461h.4538v.4884h-.4538l.0011.6943c.0034.1365.1541.1943.2715.1818.0768.006.1848-.0959.1624.0301l.0265.4744zm-2.7861-1.146h1.0575v.4653H8.4068zM6.5412.7662c.2401-.008.4923.1021.6064.3223.0351.0816.045.0806.0397.0023V.172l.8307-.1231v2.7189h-.8307v-.3653c-.0907.2158-.3003.3744-.5356.39-.3605.0507-.7279-.1432-.9123-.4525-.2569-.3983-.1992-.9693.1456-1.2985.173-.1702.412-.2772.6563-.2754zm.6461 1.0018c-.0048-.2526-.2909-.4519-.5276-.3518-.2324.0782-.3308.3933-.1843.5898.1239.1938.425.2285.5871.0636.0811-.0768.1287-.1897.1248-.3015zM3.7956.7662c.2401-.008.4923.1021.6064.3222.0351.0816.045.0806.0397.0023V.172l.8307-.1231v2.7189h-.8307v-.3653c-.0907.2158-.3003.3744-.5356.39-.3605.0507-.7279-.1432-.9123-.4525-.2569-.3983-.1992-.9693.1456-1.2985.173-.1702.4119-.2772.6563-.2754zm.6461 1.0018c-.0048-.2526-.2909-.4519-.5276-.3518-.2324.0782-.3308.3933-.1843.5898.1239.1938.425.2285.5871.0636.0811-.0768.1287-.1897.1248-.3015zM.7498.0603h1.196l.7845 2.7074h-.9268l-.1038-.5192H.9997l-.1115.5192h-.8883zm.8576 1.7037L1.3497.5795 1.0843 1.764z\"/></svg></a>";
		}, 500);
		if (atList) host.querySelector(".atcb-initialized .atcb-list-wrapper").append(list);
		else if (returnEl) return list;
		else if (window.innerHeight > 1e3 || window.innerWidth > 1e3) {
			host.append(list);
			list.classList.add("fixed-ref");
		}
	} else {
		list.innerHTML = "Using the <a href=\"https://add-to-calendar-pro.com\" target=\"_blank\" rel=\"noopener referrer\">Add to Calendar Button</a>, licensed under the Elastic License 2.0 (ELv2).";
		list.style.display = "none !important";
		list.classList.add("atcb-attribution");
		host.append(list);
	}
	if (returnEl) return null;
}
function place_modal_reference(host, overlay) {
	let reference = host.getElementById("atcb-reference");
	if (!reference) reference = create_atcbl(host, false, true);
	if (!reference) return;
	reference.classList.add("fixed-ref");
	overlay.append(reference);
}
async function create_modal(mainHost, data, icon = "", headline, content = "", buttons = [], subEvents = [], keyboardTrigger = false, goto = {}, closable = true) {
	if (resultChannel.active()) return;
	setActiveButton(data.identifier);
	const noHeadline = !headline || headline === "" || headline === void 0;
	const modalHost = await generate_modal_host(mainHost, data, false);
	const bgOverlay = (function() {
		const el = modalHost.getElementById("atcb-bgoverlay");
		if (!el) {
			const newOverlay = generate_bg_overlay(mainHost, "click", true, !data.hideBackground, closable);
			modalHost.querySelector(".atcb-modal-host-initialized").append(newOverlay);
			newOverlay.showModal();
			return newOverlay;
		}
		return el;
	})();
	const outgoingList = bgOverlay.querySelector(".atcb-list.atcb-modal");
	const modalWrapper = document.createElement("div");
	modalWrapper.classList.add("atcb-modal");
	modalWrapper.classList.add("atcb-modal-appear");
	bgOverlay.append(modalWrapper);
	const modalCount = modalHost.querySelectorAll(".atcb-modal[data-modal-nr]").length + 1;
	modalWrapper.dataset.modalNr = `${modalCount}`;
	modalWrapper.tabIndex = -1;
	const parentButton = (function() {
		var _originalHost$shadowR;
		const hostEl = mainHost.getElementById(data.identifier);
		if (hostEl) return hostEl;
		const originalHost = document.querySelector("[atcb-button-id=\"" + data.identifier + "\"]");
		const originalTrigger = originalHost === null || originalHost === void 0 || (_originalHost$shadowR = originalHost.shadowRoot) === null || _originalHost$shadowR === void 0 ? void 0 : _originalHost$shadowR.getElementById(data.identifier);
		if (originalTrigger) return originalTrigger;
		return document.getElementById(data.identifier);
	})();
	if (parentButton) parentButton.classList.add("atcb-active-modal");
	const modal = document.createElement("div");
	modal.classList.add("atcb-modal-box");
	if (icon !== "" && !data.hideIconModal) modal.classList.add("atcb-modal-box-with-icon");
	modal.setAttribute("part", "atcb-modal-box");
	if (data.rtl) modal.classList.add("atcb-rtl");
	modalWrapper.append(modal);
	set_sizes(modal, data.sizes);
	const modalCloseButton = document.createElement("button");
	modalCloseButton.type = "button";
	modalCloseButton.classList.add("atcb-modal-close");
	modalCloseButton.setAttribute("aria-label", translate_hook("close", data));
	modalCloseButton.innerHTML = icons["close"];
	modalCloseButton.addEventListener("click", debounce(() => {
		log_event("closeList", "Modal Close Button", getActiveButton());
		close(mainHost);
	}));
	modal.append(modalCloseButton);
	if (icon !== "" && !data.hideIconModal) {
		const modalIcon = document.createElement("div");
		modalIcon.classList.add("atcb-modal-icon");
		modalIcon.innerHTML = icons[`${icon}`];
		modal.append(modalIcon);
	}
	const dialogEl = modalHost.getElementById("atcb-bgoverlay");
	if (dialogEl) dialogEl.setAttribute("aria-modal", "true");
	if (!noHeadline) {
		const modalHeadline = document.createElement("div");
		modalHeadline.classList.add("atcb-modal-headline");
		modalHeadline.id = "atcb-modal-headline-" + modalCount;
		modalHeadline.textContent = headline;
		modal.append(modalHeadline);
		if (dialogEl) dialogEl.setAttribute("aria-labelledby", modalHeadline.id);
	} else if (dialogEl && data.rsvp) dialogEl.setAttribute("aria-label", translate_hook("label.rsvp.title", data));
	else if (dialogEl && content !== "") dialogEl.setAttribute("aria-label", content.replace(/<[^<>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 100));
	else if (dialogEl) dialogEl.setAttribute("aria-label", translate_hook("label.addtocalendar", data));
	if (content !== "") {
		const modalContent = document.createElement("div");
		modalContent.classList.add("atcb-modal-content");
		if (noHeadline) modalContent.classList.add("no-headline");
		modalContent.innerHTML = content;
		modal.append(modalContent);
	}
	modalWrapper.focus({ preventScroll: true });
	if (!data.hideBranding) place_modal_reference(modalHost, bgOverlay);
	if (subEvents.length > 1) {
		var _Object$entries$find;
		const calendarType = String(subEvents.find((_entry, index) => index === 0));
		const optionStates = (_Object$entries$find = Object.entries(getOptionStates(data.identifier)).find(([option]) => option === calendarType)) === null || _Object$entries$find === void 0 ? void 0 : _Object$entries$find[1];
		const modalsubEventsContentWrapper = document.createElement("div");
		modalsubEventsContentWrapper.classList.add("atcb-modal-content");
		modal.append(modalsubEventsContentWrapper);
		const modalsubEventsContent = document.createElement("div");
		modalsubEventsContent.classList.add("atcb-modal-content-subevents");
		modalsubEventsContentWrapper.append(modalsubEventsContent);
		for (let i = 1; i < subEvents.length; i++) {
			const subEvent = subEvents.find((_entry, index) => index === i);
			const stateIndex = subEvent === "all" ? 0 : parseInt(subEvent) - 1;
			const dateEntry = data.dates.find((_entry, index) => index === stateIndex);
			const modalSubEventButton = document.createElement("button");
			modalSubEventButton.type = "button";
			modalSubEventButton.id = data.identifier + "-" + calendarType + "-" + i;
			if (subEvent !== "all" && ((optionStates === null || optionStates === void 0 ? void 0 : optionStates.find((_state, index) => index === stateIndex)) || 0) > 0) modalSubEventButton.classList.add("atcb-saved");
			modalSubEventButton.classList.add("atcb-subevent-btn");
			modalsubEventsContent.append(modalSubEventButton);
			renderDateButtonContent(data, modalSubEventButton, subEvent, false, true);
			if (!dateEntry.overdue || data.pastDateHandling === "none") {
				if (i === 1 && keyboardTrigger) modalSubEventButton.focus();
				modalSubEventButton.addEventListener("click", debounce(async () => {
					log_event("openSubEventLink", modalSubEventButton.id, data.identifier);
					modalSubEventButton.blur();
					await generate_links(mainHost, calendarType, data, subEvent, keyboardTrigger, true);
				}));
				prepare_ics_link(mainHost, data, modalSubEventButton, calendarType, subEvent === "all" ? "all" : stateIndex, "subevent");
			} else modalSubEventButton.setAttribute("disabled", true);
		}
	}
	const actionButtons = buttons.filter((button) => button.type && button.type !== "close");
	if (actionButtons.length === 0) modal.classList.add("atcb-modal-box-no-buttons");
	const modalButtons = actionButtons.length > 0 ? document.createElement("div") : null;
	if (modalButtons) {
		modalButtons.classList.add("atcb-modal-buttons");
		modal.append(modalButtons);
	}
	actionButtons.forEach((button, index) => {
		let modalButton;
		if (button.href && button.href !== "") {
			modalButton = document.createElement("a");
			modalButton.setAttribute("target", defaultTarget);
			modalButton.setAttribute("href", button.href);
			modalButton.setAttribute("rel", "noopener");
		} else {
			modalButton = document.createElement("button");
			modalButton.type = "button";
		}
		if (button.id && button.id !== "") modalButton.id = button.id;
		modalButton.classList.add("atcb-modal-btn");
		if (button.primary) modalButton.classList.add("atcb-modal-btn-primary");
		if (button.small) modalButton.classList.add("btn-small");
		if (!button.label || button.label === "") button.label = translate_hook("modal.button.default", data);
		modalButton.textContent = button.label;
		modalButtons.append(modalButton);
		if (index === 0 && subEvents.length < 2 && keyboardTrigger) modalButton.focus();
		switch (button.type) {
			default: break;
			case "2timeslink":
				modalButton.addEventListener("click", debounce(async () => {
					close(mainHost);
					await generate_links(mainHost, goto.type, data, goto.id, keyboardTrigger, false, true);
				}));
				modalButton.addEventListener("keyup", async function(event) {
					if (event.key === "Enter" || event.code == "Space") {
						toggle(mainHost, "close", "", "", true);
						await generate_links(mainHost, goto.type, data, goto.id, keyboardTrigger, false, true);
					}
				});
				break;
			case "none":
		}
	});
	if (keyboardTrigger && subEvents.length < 2 && actionButtons.length === 0) modalCloseButton.focus();
	if (modalCount > 1) {
		const prevModal = modalHost.querySelector(".atcb-modal[data-modal-nr=\"" + (modalCount - 1) + "\"]");
		prevModal === null || prevModal === void 0 || prevModal.classList.add("atcb-hidden");
	}
	if (outgoingList) outgoingList.remove();
	manage_body_scroll(modalHost, modalWrapper);
}
async function generate_modal_host(host, data, reset = true) {
	const existingModalHost = document.getElementById(data.identifier + "-modal-host");
	if (existingModalHost) {
		if (!reset) return existingModalHost.shadowRoot;
		existingModalHost.remove();
	}
	const newModalHost = document.createElement("div");
	newModalHost.id = data.identifier + "-modal-host";
	if (host.host.hasAttribute("cspnonce")) newModalHost.setAttribute("cspnonce", host.host.getAttribute("cspnonce"));
	newModalHost.setAttribute("atcb-button-id", data.identifier);
	newModalHost.classList.add("add-to-calendar");
	newModalHost.style.visibility = "visible";
	newModalHost.style.opacity = "1";
	newModalHost.style.position = "fixed";
	newModalHost.style.top = "0";
	newModalHost.style.left = "0";
	newModalHost.style.width = "100%";
	newModalHost.style.height = "100%";
	newModalHost.style.display = "flex";
	newModalHost.style.zIndex = "13999998";
	document.body.append(newModalHost);
	newModalHost.attachShadow({
		mode: "open",
		delegatesFocus: true
	});
	const elem = document.createElement("template");
	elem.innerHTML = "<div class=\"atcb-modal-host-initialized\"></div>";
	newModalHost.shadowRoot.append(elem.content.cloneNode(true));
	set_light_mode(newModalHost.shadowRoot, data);
	await load_css(newModalHost.shadowRoot, null, data);
	return newModalHost.shadowRoot;
}
async function generate_overlay_dom(host, data) {
	const newHost = await generate_modal_host(host, data);
	Array.from(host.children).forEach((node) => {
		if (node.tagName != "STYLE") newHost.querySelector(".atcb-modal-host-initialized").append(node.cloneNode(true));
	});
	const triggerCopy = newHost.querySelector(".atcb-button");
	triggerCopy.removeAttribute("id");
	triggerCopy.setAttribute("aria-hidden", "true");
	triggerCopy.setAttribute("tabindex", "-1");
	host.host.classList.add("atcb-shadow-hide");
	host.querySelector(".atcb-initialized").style.opacity = "0";
	position_shadow_button(host, newHost);
	window.addEventListener("scroll", position_shadow_button_listener);
	window.addEventListener("resize", position_shadow_button_listener);
	return newHost.querySelector(".atcb-modal-host-initialized");
}
//#endregion
//#region src/ui/pro.ts
function mark_invalid_input(input, currentFirstInvalid) {
	input.classList.add("error");
	input.setAttribute("aria-invalid", "true");
	return currentFirstInvalid || input;
}
function clear_invalid_input(input) {
	input.classList.remove("error");
	input.removeAttribute("aria-invalid");
}
function show_submit_error(form, errorEl, msg, firstInvalid = null) {
	errorEl.textContent = msg;
	form.classList.add("form-error");
	if (firstInvalid) {
		firstInvalid.focus();
		return;
	}
	errorEl.focus();
}
async function generate_ty(hostEl, dataObj) {
	let host = hostEl;
	let data = dataObj;
	if (!hostEl.host) {
		host = hostEl.shadowRoot;
		data = await decorate_data(data);
	}
	const copyIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z\" /></svg>";
	const copiedIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75\" /></svg>";
	const mailIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75\" /></svg>";
	/*!
	*  @preserve
	*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
	*/
	if ((!data.proKey || data.proKey === "") && !window.location.hostname.match(/^(localhost|.*\.add-to-calendar-pro.com)$/)) return;
	const tyHost = await generate_modal_host(host, data);
	const tyData = data.ty;
	if ((tyData.type === "link" || tyData.type === "form") && (!tyData.url || tyData.url === "" || !/^https?:\/\//i.test(tyData.url) || !secure_url(tyData.url, false))) tyData.type = "text";
	if (!tyData.headline || tyData.headline === "") tyData.headline = translate_hook("thankyou", data) + "!";
	let tyContent = "<div class=\"pro\"><p id=\"ty-success-msg\">" + translate_hook("form.success.title", data) + "</p><div id=\"ty-content\">";
	if (tyData.text && tyData.text !== "") tyContent += "<div class=\"pro-intro\">" + safe_html(tyData.text) + "</div>";
	if (tyData.type === "share") tyContent += `<p class="pro-pt pro-share-buttons">
    <a href="mailto:?subject=${encodeURIComponent(translate_hook("label.share.email_subject", data))}&body=%0A&#10142;%20${encodeURIComponent(tyData.url)}%0A%0A" target="_blank" rel="noopener" class="atcb-modal-btn atcb-modal-btn-primary atcb-modal-btn-border btn-flex">
      ${mailIcon}
      ${translate_hook("label.share.email", data)}
    </a>
    <button id="atcb-ty-share-copy" class="atcb-modal-btn atcb-modal-btn-primary atcb-modal-btn-border btn-flex">
      ${copyIcon}
      ${translate_hook("label.share.copy", data)}
    </button>
    </p>`;
	let header = {};
	if (tyData.type === "form") {
		const noIntro = !tyData.text || tyData.text === "" || tyData.text === void 0;
		const label = (function() {
			if (tyData.button_label && tyData.button_label !== "") return safe_html(tyData.button_label);
			return translate_hook("submit", data);
		})();
		tyContent += "<form id=\"" + escape_html(data.identifier) + "-ty-form\" class=\"pro-form" + (noIntro ? " no-intro" : "") + "\">";
		if (tyData.fields && tyData.fields.length > 0) {
			const headerField = tyData.fields.find((field) => field.name === "header" && field.type === "hidden");
			if (headerField && headerField.default && headerField.default !== "" && headerField.default.startsWith("{")) try {
				header = JSON.parse(headerField.default);
				if (Object.keys(header).length === 0) header.atcb = true;
				tyData.fields = tyData.fields.filter((field) => field.name !== "header");
			} catch (_unused) {}
			const customForm = build_form(tyData.fields, data.identifier + "-ty");
			tyData.fields = customForm.fields;
			tyContent += customForm.html;
		}
		tyContent += "<p id=\"submit-error\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"true\" tabindex=\"-1\"></p>";
		tyContent += "<p class=\"pro-pt\"><button type=\"submit\" id=\"pro-form-submit\" class=\"atcb-modal-btn atcb-modal-btn-primary atcb-modal-btn-border\">" + label + "</button><span id=\"pro-form-submitting\" class=\"pro-waiting\" role=\"status\" aria-live=\"polite\" aria-hidden=\"true\"><span>.</span><span>.</span><span>.</span><span class=\"atcb-sr-only\">" + translate_hook("submit", data) + "</span></span></p>";
		tyContent += "</form>";
	}
	if (tyData.type === "link") {
		const label = (function() {
			if (tyData.button_label && tyData.button_label !== "") return safe_html(tyData.button_label);
			return translate_hook("continue", data);
		})();
		tyContent += "<p class=\"pro-pt\"><a href=\"" + escape_html(tyData.url) + "\" target=\"_blank\" rel=\"noopener\" class=\"atcb-modal-btn atcb-modal-btn-primary atcb-modal-btn-border\">" + label + "</a></p>";
	}
	tyContent += "</div></div>";
	await create_modal(tyHost, data, "", tyData.headline, tyContent);
	if (tyData.type === "share") {
		const copyBtn = tyHost.getElementById("atcb-ty-share-copy");
		copyBtn.addEventListener("click", async function() {
			try {
				await copy_to_clipboard(tyData.url);
				copyBtn.innerHTML = copiedIcon + translate_hook("label.share.copied", data) + "!";
				setTimeout(function() {
					copyBtn.innerHTML = copyIcon + translate_hook("label.share.copy", data);
				}, 3e3);
			} catch (error) {
				console.error("Error copying to clipboard:", error);
			}
		});
		copyBtn.addEventListener("keyup", function(event) {
			if (event.key === "Enter") {
				event.preventDefault();
				copyBtn.click();
			}
		});
	}
	if (tyData.type === "form") {
		const tyForm = tyHost.getElementById(data.identifier + "-ty-form");
		const errorMsg = tyHost.getElementById("submit-error");
		const tyFormSubmit = tyHost.getElementById("pro-form-submit");
		const tyFormSubmitting = tyHost.getElementById("pro-form-submitting");
		tyForm.addEventListener("submit", async function(e) {
			e.preventDefault();
			tyForm.classList.remove("form-error");
			errorMsg.textContent = "";
			tyFormSubmitting.setAttribute("aria-hidden", "false");
			tyFormSubmitting.style.display = "block";
			tyFormSubmit.style.display = "none";
			const validation = validate_form(tyHost, tyData.fields);
			const valid = validation.valid;
			if (!valid) show_submit_error(tyForm, errorMsg, translate_hook("form.error.required", data) + ".", validation.firstInvalid);
			if (valid) {
				const bodyData = [];
				let skipRadio = false;
				tyData.fields.forEach((field) => {
					if (field.type !== "label") {
						if (field.type === "radio") {
							if (!skipRadio) {
								tyHost.querySelectorAll("[name=\"" + CSS.escape(field.name) + "\"]").forEach(function(radio) {
									if (radio.checked) bodyData.push({
										name: field.name,
										value: radio.value
									});
								});
								skipRadio = true;
							}
						} else if (field.type === "checkbox") {
							bodyData.push({
								name: field.name,
								value: tyHost.getElementById(field.fieldId).checked
							});
							skipRadio = false;
						} else {
							bodyData.push({
								name: field.name,
								value: tyHost.getElementById(field.fieldId).value
							});
							skipRadio = false;
						}
					}
				});
				if (await sendPostRequest(tyData.url, bodyData, header) === true) {
					tyHost.getElementById("ty-success-msg").style.display = "block";
					tyHost.getElementById("ty-content").style.display = "none";
					return;
				}
				show_submit_error(tyForm, errorMsg, translate_hook("form.error.sending", data) + ".");
			}
			tyFormSubmitting.setAttribute("aria-hidden", "true");
			tyFormSubmitting.style.display = "none";
			tyFormSubmit.style.display = "block";
		});
	}
}
async function generate_rsvp_form(host, data, hostEl, keyboardTrigger = false) {
	var _rsvpData$fields;
	/*!
	*  @preserve
	*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
	*/
	const rsvpData = data.rsvp;
	const noIntro = !rsvpData.text || rsvpData.text === "" || rsvpData.text === void 0;
	const noHeadline = !rsvpData.headline || rsvpData.headline === "" || rsvpData.headline === void 0;
	let hiddenContent = "";
	let rsvpContent = "<div class=\"pro\">";
	const sentStatus = localStorage.getItem(data.proKey + "-rsvp-sent") === "true" || null;
	if (sentStatus) {
		rsvpContent += "<div id=\"rsvp-sent-content\">";
		rsvpContent += "<p>" + translate_hook("form.success.already", data) + "</p>";
		if (!data.hideButton) rsvpContent += "<div id=\"rsvp-atcb\"></div>";
		if (data.inlineRsvp) rsvpContent += "<button id=\"pro-form-restart\" " + (data.disabled && "disabled") + " class=\"atcb-modal-btn atcb-modal-btn btn-small atcb-modal-btn-border\">" + translate_hook("label.rsvp.restart", data) + "</button>";
		rsvpContent += "</div>";
	}
	rsvpContent += "<div id=\"rsvp-success-msg\"><p>" + translate_hook("form.success.sent", data) + "</p><p id=\"rsvp-success-msg-email\">" + translate_hook("form.success.email", data) + "</p><p id=\"rsvp-success-msg-doi\">" + translate_hook("form.success.doi", data) + "</p></div>";
	rsvpContent += "<div id=\"rsvp-success-msg-demo\">" + translate_hook("form.success.demo", data) + "</div>";
	rsvpContent += "<div id=\"rsvp-content\">";
	if (rsvpData.text && rsvpData.text !== "") rsvpContent += "<div class=\"pro-intro\">" + safe_html(rsvpData.text) + "</div>";
	rsvpContent += "<form id=\"" + escape_html(data.identifier) + "-rsvp-form\" class=\"pro-form" + (noIntro ? " no-intro" : "") + (noHeadline ? " no-headline" : "") + "\">";
	const staticID = data.proKey || "demo-rsvp";
	if (rsvpData.initial_confirmation === false) {
		rsvpContent += "<div id=\"rsvp-status-group\" role=\"radiogroup\" aria-labelledby=\"" + escape_html(data.identifier) + "-rsvp-status-title\">";
		rsvpContent += "<p id=\"" + escape_html(data.identifier) + "-rsvp-status-title\">" + translate_hook("form.status.title", data) + "</p>";
		rsvpContent += "<div class=\"pro-field pro-field-type-radio\"><div><input type=\"radio\" name=\"" + escape_html(staticID) + "-status\" id=\"" + escape_html(data.identifier) + "-rsvp-status-confirmed\" aria-label=\"" + escape_html(translate_hook("form.status.confirmed", data)) + "\" checked value=\"confirmed\" " + (data.disabled && "disabled") + " /><label for=\"" + escape_html(data.identifier) + "-rsvp-status-confirmed\" class=\"status-confirmed\"><span>" + translate_hook("form.status.confirmed", data) + "</span></label></div>";
		if (rsvpData.maybe_option === true) rsvpContent += "<div><input type=\"radio\" name=\"" + escape_html(staticID) + "-status\" id=\"" + escape_html(data.identifier) + "-rsvp-status-undecided\" aria-label=\"" + escape_html(translate_hook("form.status.undecided", data)) + "\" value=\"undecided\" " + (data.disabled && "disabled") + " /><label for=\"" + escape_html(data.identifier) + "-rsvp-status-undecided\" class=\"status-undecided\"><span>" + translate_hook("form.status.undecided", data) + "</span></label></div>";
		rsvpContent += "<div><input type=\"radio\" name=\"" + escape_html(staticID) + "-status\" id=\"" + escape_html(data.identifier) + "-rsvp-status-declined\" aria-label=\"" + escape_html(translate_hook("form.status.declined", data)) + "\" value=\"declined\" " + (data.disabled && "disabled") + " /><label for=\"" + escape_html(data.identifier) + "-rsvp-status-declined\" class=\"status-declined\"><span>" + translate_hook("form.status.declined", data) + "</span></label></div></div>";
		rsvpContent += "</div>";
	} else hiddenContent += "<input type=\"hidden\" name=\"" + escape_html(staticID) + "-status\" id=\"" + escape_html(data.identifier) + "-rsvp-status-confirmed\" value=\"confirmed\" />";
	const maxAmount = rsvpData.maxpp || 1;
	if (maxAmount === 1) hiddenContent += "<input type=\"hidden\" name=\"" + escape_html(staticID) + "-amount\" id=\"" + escape_html(data.identifier) + "-rsvp-amount\" value=\"1\" />";
	else {
		rsvpContent += "<div class=\"pro-field\"><label for=\"" + escape_html(data.identifier) + "-rsvp-amount\">" + translate_hook("form.amount", data) + " (" + translate_hook("form.max", data) + " " + escape_html(String(maxAmount)) + ")<span>*</span></label>";
		rsvpContent += "<input type=\"number\" name=\"" + escape_html(staticID) + "-amount\" min=\"1\" max=\"" + escape_html(String(maxAmount)) + "\" id=\"" + escape_html(data.identifier) + "-rsvp-amount\" " + (data.disabled && "disabled") + " required aria-required=\"true\" aria-label=\"" + escape_html(translate_hook("form.amount", data)) + "\" value=\"1\" /></div>";
	}
	const attendee = (function() {
		if (data.dates[0].attendee && data.dates[0].attendee !== "") {
			const attendeeParts = data.dates[0].attendee.split("|");
			if (attendeeParts.length > 1) return attendeeParts[1];
			return attendeeParts[0];
		}
		return null;
	})();
	const customEmailField = (_rsvpData$fields = rsvpData.fields) === null || _rsvpData$fields === void 0 ? void 0 : _rsvpData$fields.find((field) => field.name === "email");
	if (!customEmailField) {
		if (attendee) hiddenContent += "<input type=\"hidden\" name=\"email\" id=\"" + escape_html(data.identifier) + "-rsvp-email\" value=\"" + escape_html(attendee) + "\" />";
		else {
			rsvpContent += "<div class=\"pro-field\"><label for=\"" + escape_html(data.identifier) + "-rsvp-email\">" + translate_hook("form.email", data) + "<span>*</span></label>";
			rsvpContent += "<input type=\"email\" name=\"email\" id=\"" + escape_html(data.identifier) + "-rsvp-email\" " + (data.disabled && "disabled") + " required aria-required=\"true\" autocomplete=\"email\" aria-label=\"" + escape_html(translate_hook("form.email", data)) + "\" value=\"\" /></div>";
		}
	} else rsvpData.fields = rsvpData.fields.map((field) => {
		if (field.name === "email") return _objectSpread2(_objectSpread2({}, field), {}, {
			required: true,
			type: "email",
			default: attendee !== "" ? attendee : field.default
		});
		return field;
	});
	if (rsvpData.fields && rsvpData.fields.length > 0) {
		const customForm = build_form(rsvpData.fields, data.identifier + "-rsvp", data.disabled);
		rsvpData.fields = customForm.fields;
		rsvpContent += customForm.html;
	}
	rsvpContent += hiddenContent;
	rsvpContent += "<p id=\"submit-error\" role=\"alert\" aria-live=\"assertive\" aria-atomic=\"true\" tabindex=\"-1\"></p>";
	rsvpContent += "<p class=\"pro-pt\"><button type=\"submit\" id=\"pro-form-submit\" " + (data.disabled && "disabled") + " class=\"atcb-modal-btn atcb-modal-btn-primary atcb-modal-btn-border\">" + translate_hook("submit", data) + "</button><span id=\"pro-form-submitting\" class=\"pro-waiting\" role=\"status\" aria-live=\"polite\" aria-hidden=\"true\"><span>.</span><span>.</span><span>.</span><span class=\"atcb-sr-only\">" + translate_hook("submit", data) + "</span></span></p>";
	if (rsvpData.seatsLeft && rsvpData.seatsLeft > 0) rsvpContent += "<p class=\"pro-form-fine\">" + translate_hook("form.seatsleft", data) + ": <b>" + escape_html(String(rsvpData.seatsLeft)) + "</b></p>";
	rsvpContent += "</form>";
	rsvpContent += "</div></div>";
	let rsvpHost = null;
	if (!data.inlineRsvp) {
		rsvpHost = await generate_modal_host(host, data);
		await create_modal(rsvpHost, data, void 0, rsvpData.headline, rsvpContent, [{
			type: "none",
			label: translate_hook("label.rsvp.restart", data),
			small: true,
			primary: true,
			id: "pro-form-restart"
		}], [], keyboardTrigger, {}, false);
	} else {
		rsvpHost = host;
		const rsvpInlineWrapper = document.createElement("div");
		rsvpInlineWrapper.classList.add("atcb-modal-box", "rsvp-inline-wrapper");
		rsvpInlineWrapper.setAttribute("part", "atcb-modal-box");
		if (data.rtl) rsvpInlineWrapper.classList.add("atcb-rtl");
		hostEl.append(rsvpInlineWrapper);
		if (rsvpData.headline) {
			const rsvpInlineHeadline = document.createElement("div");
			rsvpInlineHeadline.classList.add("atcb-modal-headline");
			rsvpInlineWrapper.append(rsvpInlineHeadline);
			rsvpInlineHeadline.innerHTML = safe_html(rsvpData.headline);
		}
		const rsvpInlineContent = document.createElement("div");
		rsvpInlineContent.classList.add("atcb-modal-content");
		rsvpInlineWrapper.append(rsvpInlineContent);
		if (!data.hideBranding) {
			const list = create_atcbl(rsvpHost, false, true);
			rsvpInlineWrapper.append(list);
		}
		if (rsvpData.expired) {
			rsvpInlineContent.innerHTML = "<div class=\"pro\"><p>" + translate_hook("label.rsvp.expired", data) + "</p></div>";
			return;
		} else if (rsvpData.bookedOut) {
			rsvpInlineContent.innerHTML = "<div class=\"pro\"><p>" + translate_hook("label.rsvp.bookedout", data) + "</p></div>";
			return;
		} else rsvpInlineContent.innerHTML = rsvpContent;
	}
	if (sentStatus) rsvpHost.getElementById("rsvp-content").style.display = "none";
	const restartBtn = rsvpHost.getElementById("pro-form-restart");
	const hideRestartButton = () => {
		if (!restartBtn) return;
		restartBtn.style.display = "none";
		if (restartBtn.parentElement) restartBtn.parentElement.style.display = "none";
	};
	log_event("openRSVP", data.identifier, data.identifier);
	if (data.debug) console.log("RSVP form for \"" + data.identifier + "\" created");
	if (sentStatus) {
		const buttonHost = rsvpHost.getElementById("rsvp-atcb");
		if (buttonHost && !data.hideButton) {
			const buttonData = JSON.parse(JSON.stringify(data));
			buttonData.hideTextLabelButton = true;
			buttonData.hideIconButton = false;
			buttonData.buttonsList = true;
			renderButton(host, buttonHost, buttonData);
		}
	} else hideRestartButton();
	const rsvpForm = rsvpHost.getElementById(data.identifier + "-rsvp-form");
	const errorMsg = rsvpHost.getElementById("submit-error");
	const rsvpFormSubmit = rsvpHost.getElementById("pro-form-submit");
	const rsvpFormSubmitting = rsvpHost.getElementById("pro-form-submitting");
	const rsvpRestart = rsvpHost.getElementById("pro-form-restart");
	if (rsvpFormSubmit) rsvpForm.addEventListener("submit", async function(e) {
		e.preventDefault();
		rsvpForm.classList.remove("form-error");
		errorMsg.textContent = "";
		rsvpFormSubmitting.setAttribute("aria-hidden", "false");
		rsvpFormSubmitting.style.display = "block";
		rsvpFormSubmit.style.display = "none";
		const staticFields = [{
			type: "number",
			name: data.proKey + "-amount",
			fieldId: data.identifier + "-rsvp-amount",
			required: true
		}];
		if (!customEmailField) staticFields.push({
			type: "email",
			name: "email",
			fieldId: data.identifier + "-rsvp-email",
			required: true
		});
		const dynamicFields = Array.isArray(rsvpData.fields) ? rsvpData.fields : [];
		const validation = validate_form(rsvpHost, [...staticFields, ...dynamicFields]);
		let valid = validation.valid;
		let firstInvalid = validation.firstInvalid;
		const amountEl = rsvpHost.getElementById(data.identifier + "-rsvp-amount");
		const amount = parseInt(amountEl.value) || 1;
		if (rsvpData.maxpp && rsvpData.maxpp > 0 && amount > rsvpData.maxpp) {
			firstInvalid = mark_invalid_input(amountEl, firstInvalid);
			valid = false;
		}
		if (!valid) show_submit_error(rsvpForm, errorMsg, translate_hook("form.error.required", data) + ".", firstInvalid);
		if (valid) {
			if (!data.proKey || data.proKey === "") {
				rsvpHost.getElementById("rsvp-success-msg-demo").style.display = "block";
				rsvpHost.getElementById("rsvp-content").style.display = "none";
				log_event("successRSVP", data.identifier, data.identifier);
				return;
			}
			let fieldsCopy = rsvpData.fields ? JSON.parse(JSON.stringify(rsvpData.fields)) : [];
			const bodyData = [];
			bodyData.push({
				name: "prokey",
				value: data.proKey
			});
			bodyData.push({
				name: "language",
				value: data.language
			});
			const statusValEl = rsvpHost.querySelector("[name=\"" + data.proKey + "-status\"]:checked");
			bodyData.push({
				name: "status",
				value: statusValEl ? statusValEl.value : "confirmed"
			});
			bodyData.push({
				name: "amount",
				value: amount
			});
			if (!customEmailField) bodyData.push({
				name: "email",
				value: rsvpHost.getElementById(data.identifier + "-rsvp-email").value
			});
			else {
				var _fieldsCopy$find;
				const emailFieldId = (_fieldsCopy$find = fieldsCopy.find((field) => field.name === "email")) === null || _fieldsCopy$find === void 0 ? void 0 : _fieldsCopy$find.fieldId;
				bodyData.push({
					name: "email",
					value: rsvpHost.getElementById(emailFieldId).value
				});
				fieldsCopy = fieldsCopy.filter((field) => field.fieldId !== emailFieldId);
			}
			const bodyData_payload = {};
			let skipRadio = false;
			fieldsCopy.forEach((field) => {
				if (field.type !== "label") {
					if (field.type === "radio") {
						if (!skipRadio) {
							rsvpHost.querySelectorAll("[name=\"" + CSS.escape(field.name) + "\"]").forEach(function(radio) {
								if (radio.checked) bodyData_payload[field.name] = radio.value;
							});
							skipRadio = true;
						}
					} else if (field.type === "checkbox") {
						bodyData_payload[field.name] = rsvpHost.getElementById(field.fieldId).checked;
						skipRadio = false;
					} else {
						bodyData_payload[field.name] = rsvpHost.getElementById(field.fieldId).value;
						skipRadio = false;
					}
				}
			});
			if (Object.keys(bodyData_payload).length > 0) bodyData.push({
				name: "payload",
				value: bodyData_payload
			});
			const request = await sendPostRequest(`https://api${data.dev ? "-dev" : ""}.add-to-calendar-pro.com/24586219-9910-41fe-9b59-df53de9db7af`, bodyData, { rsvp: true });
			if (request === "doi" || request === true) {
				rsvpHost.getElementById("rsvp-success-msg").style.display = "block";
				if (request === "doi") rsvpHost.getElementById("rsvp-success-msg-doi").style.display = "block";
				else rsvpHost.getElementById("rsvp-success-msg-email").style.display = "block";
				rsvpHost.getElementById("rsvp-content").style.display = "none";
				log_event("successRSVP", data.identifier, data.identifier);
				localStorage.setItem(data.proKey + "-rsvp-sent", true);
				return;
			}
			const requestResult = request;
			if (requestResult.error && requestResult.error === 2) show_submit_error(rsvpForm, errorMsg, translate_hook("form.error.email", data) + ".");
			else if (requestResult.error && requestResult.error === 5) show_submit_error(rsvpForm, errorMsg, translate_hook("label.rsvp.expired", data) + ".");
			else if (requestResult.error && requestResult.error === 6) {
				if (amount > 1) show_submit_error(rsvpForm, errorMsg, translate_hook("form.error.bookedoutmany", data) + ".");
				else show_submit_error(rsvpForm, errorMsg, translate_hook("label.rsvp.bookedout", data) + ".");
			} else show_submit_error(rsvpForm, errorMsg, translate_hook("form.error.sending", data) + ".");
		}
		rsvpFormSubmitting.setAttribute("aria-hidden", "true");
		rsvpFormSubmitting.style.display = "none";
		rsvpFormSubmit.style.display = "block";
	});
	if (rsvpRestart) {
		rsvpRestart.addEventListener("click", function(e) {
			e.preventDefault();
			rsvpHost.getElementById("rsvp-sent-content").style.display = "none";
			rsvpHost.getElementById("rsvp-content").style.display = "block";
			hideRestartButton();
		});
		rsvpRestart.addEventListener("keyup", function(event) {
			if (event.key === "Enter") {
				event.preventDefault();
				rsvpRestart.click();
			}
		});
	}
}
async function generate_rsvp_button(host, data) {
	const btnHostEl = host.querySelector(".atcb-initialized");
	const buttonTriggerWrapper = document.createElement("div");
	buttonTriggerWrapper.classList.add("atcb-button-wrapper");
	if (data.rtl) buttonTriggerWrapper.classList.add("atcb-rtl");
	btnHostEl.append(buttonTriggerWrapper);
	set_sizes(buttonTriggerWrapper, data.sizes);
	const buttonTrigger = document.createElement("button");
	buttonTrigger.classList.add("atcb-button", "atcb-click", "atcb-single");
	if (data.disabled) buttonTrigger.setAttribute("disabled", true);
	if (data.hideTextLabelButton) buttonTrigger.classList.add("atcb-no-text");
	buttonTrigger.type = "button";
	buttonTrigger.setAttribute("aria-expanded", false);
	buttonTriggerWrapper.append(buttonTrigger);
	const rsvpData = data.rsvp;
	const label = (function() {
		if (rsvpData.expired) return translate_hook("label.rsvp.expired", data);
		if (rsvpData.bookedOut) return translate_hook("label.rsvp.bookedout", data);
		return translate_hook("label.rsvp.title", data);
	})();
	generate_label(host, data, buttonTrigger, "rsvp", !data.hideIconButton, label, true);
	if (data.buttonStyle !== "date") buttonTrigger.setAttribute("aria-label", label + ": " + data.name);
	if (data.debug) console.log("Add to Calendar RSVP Button \"" + data.identifier + "\" created");
	return true;
}
async function check_bookings(proKey, dev = false) {
	try {
		const response = await fetch(`https://api${dev ? "-dev" : ""}.add-to-calendar-pro.com/dffb8bbd-ee5e-4a4f-a7ea-503af98ca468?prokey=${proKey}`, { method: "GET" });
		if (!response.ok) throw new Error("Network response was not ok");
		const responseJson = await response.json();
		return parseInt(responseJson.total);
	} catch (error) {
		console.error("Error:", error);
	}
	return 0;
}
function build_form(fields, identifier = "", disabled = false) {
	/*!
	*  @preserve
	*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
	*/
	let form = "";
	let hiddenForm = "";
	let n = 0;
	let prevType = "";
	let prevSkipped;
	for (let i = 1; i <= fields.length; i++) {
		prevSkipped = false;
		const field = fields[i - 1];
		if (field.type !== "label" && (!field.name || field.name === "")) {
			prevSkipped = true;
			continue;
		}
		if (prevType === "radio" && field.type !== "radio" || prevType !== "radio") n = i;
		fields[i - 1].fieldId = identifier + "-" + i;
		const fieldValue = field.type === "radio" ? field.placeholder || "" : field.default || "";
		const fieldLabel = field.label || "";
		const fieldPlaceholder = field.type === "radio" ? "" : field.placeholder || "";
		let fieldHtml = "";
		if (prevType !== "hidden" && i === n && i !== 1) fieldHtml += "</div>";
		if (field.type !== "hidden" && i === n) fieldHtml += "<div class=\"pro-field pro-field-type-" + escape_html(String(field.type)) + "\">";
		if (field.type === "label") fieldHtml += "<p>" + safe_html(fieldLabel) + "</p>";
		else {
			if (field.type === "radio") fieldHtml += "<div>";
			if (field.type === "hidden") hiddenForm += "<input type=\"hidden\" name=\"" + escape_html(field.name) + "\" id=\"" + escape_html(field.fieldId) + "\" value=\"" + escape_html(String(fieldValue)) + "\" />";
			else fieldHtml += create_field_html(field.type, field.name, fieldLabel, field.fieldId, field.required, fieldValue, field.default, fieldPlaceholder, disabled);
			if (field.type === "radio") fieldHtml += "</div>";
		}
		form += fieldHtml;
		prevType = field.type;
	}
	if (prevType !== "hidden" || prevSkipped) form += "</div>";
	form += hiddenForm;
	return {
		html: form,
		fields
	};
}
function create_field_html(type, name, fieldLabel, fieldId, required = false, fieldValue, defaultVal = null, fieldPlaceholder = "", disabled = false) {
	let fieldHtml = "";
	const accessibleLabel = fieldLabel !== "" ? fieldLabel : fieldPlaceholder !== "" ? fieldPlaceholder : name;
	if ((type === "text" || type === "email" || type === "number") && fieldLabel !== "") fieldHtml += "<label for=\"" + escape_html(fieldId) + "\">" + safe_html(fieldLabel) + (required ? "<span>*</span>" : "") + "</label>";
	fieldHtml += "<input type=\"" + escape_html(String(type)) + "\"" + (type === "number" ? " min=\"0\"" : "") + (required ? " required aria-required=\"true\"" : "") + (type === "email" ? " autocomplete=\"email\"" : "") + ((type === "checkbox" || type === "radio") && defaultVal && (defaultVal === "true" || defaultVal === true) ? " checked" : "") + " name=\"" + escape_html(name) + "\" id=\"" + escape_html(fieldId) + "\" placeholder=\"" + escape_html(fieldPlaceholder) + "\" " + (disabled && "disabled") + " aria-label=\"" + escape_html(accessibleLabel) + "\" value=\"" + escape_html(String(fieldValue)) + "\" />";
	if ((type === "checkbox" || type === "radio") && (fieldLabel !== "" || required)) fieldHtml += "<label for=\"" + escape_html(fieldId) + "\">" + safe_html(fieldLabel) + (required ? "<span>*</span>" : "") + "</label>";
	return fieldHtml;
}
function validate_form(host, fields) {
	/*!
	*  @preserve
	*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
	*/
	let state = true;
	let firstInvalid = null;
	fields.forEach(function(field) {
		if (field.type !== "label" && field.type !== "radio") {
			const input = host.getElementById(field.fieldId);
			if (field.type !== "checkbox") {
				input.value = secure_content(input.value.trim());
				if (field.type === "number") input.value = input.value.replace(/\D/g, "");
				if (field.type === "email" && input.value !== "" && !validEmail(input.value)) {
					firstInvalid = mark_invalid_input(input, firstInvalid);
					state = false;
					return;
				}
				if (field.required && input.value === "") {
					firstInvalid = mark_invalid_input(input, firstInvalid);
					state = false;
					return;
				} else clear_invalid_input(input);
			} else if (field.required && input.checked === false) {
				firstInvalid = mark_invalid_input(input, firstInvalid);
				state = false;
				return;
			} else clear_invalid_input(input);
		}
		if (field.type === "radio") {
			const radioGroup = host.querySelectorAll("[name=\"" + CSS.escape(field.name) + "\"]");
			let checked = false;
			radioGroup.forEach(function(radio) {
				if (radio.checked) checked = true;
			});
			if (checked === false) {
				firstInvalid = mark_invalid_input(radioGroup[0], firstInvalid);
				state = false;
				return;
			} else clear_invalid_input(radioGroup[0]);
		}
	});
	return {
		valid: state,
		firstInvalid
	};
}
async function sendPostRequest(url, fields, header = {}) {
	/*!
	*  @preserve
	*  PER LICENSE AGREEMENT, YOU ARE NOT ALLOWED TO REMOVE OR CHANGE THIS FUNCTION!
	*/
	const formData = new FormData();
	const data = {};
	let requestData;
	if (Object.keys(header).length === 0) {
		fields.forEach((field) => {
			formData.append(field.name, field.value);
		});
		requestData = {
			method: "POST",
			body: formData
		};
	} else {
		header["Cache-Control"] = "no-cache";
		header["Content-Type"] = "application/json";
		header["Accept"] = "*/*";
		fields.forEach((field) => {
			data[field.name] = field.value;
		});
		requestData = {
			method: "POST",
			headers: header,
			body: JSON.stringify(data)
		};
	}
	try {
		const response = await fetch(url, requestData);
		const responseJson = await response.json();
		if (!response.ok) {
			console.error("Network response was not ok");
			if (responseJson.error) return responseJson;
			return false;
		}
		if (responseJson.status && responseJson.status === "doi") return "doi";
		return true;
	} catch (error) {
		console.error("Error:", error);
		return false;
	}
}
//#endregion
//#region src/core/decorate.ts
async function decorate_data(data) {
	let cfg = data;
	cfg = decorate_data_boolean(cfg);
	cfg = decorate_data_defaults(cfg);
	cfg = decorate_data_options(cfg);
	cfg = decorate_data_style(cfg);
	cfg.sizes = decorate_sizes(cfg.size);
	cfg.lightMode = decorate_light_mode(cfg.lightMode);
	cfg = decorate_data_i18n(cfg);
	cfg = decorate_data_dates(cfg);
	cfg = await decorate_data_rsvp(cfg);
	return cfg;
}
function decorate_data_boolean(data) {
	for (let i = 0; i < wcBooleanParams.length; i++) {
		const attr = wcBooleanParams[`${i}`];
		if (data[`${attr}`]) {
			if (typeof data[`${attr}`] !== "boolean") {
				const val = data[`${attr}`].toString().trim().toLowerCase() || "";
				data[`${attr}`] = val === "" || val === "true" ? true : false;
			}
		} else data[`${attr}`] = false;
	}
	return data;
}
function set_date_defaults(dateEntry) {
	if (!dateEntry.timeZone || dateEntry.timeZone === "") dateEntry.timeZone = "GMT";
	if (!dateEntry.status || dateEntry.status === "") dateEntry.status = "confirmed";
	if (!dateEntry.sequence || dateEntry.sequence === "") dateEntry.sequence = 0;
	else {
		dateEntry.sequence = parseInt(dateEntry.sequence);
		if (isNaN(dateEntry.sequence) || dateEntry.sequence < 0) dateEntry.sequence = 0;
	}
}
function decorate_data_defaults(data) {
	if (data.dates) for (let i = 0; i < data.dates.length; i++) set_date_defaults(data.dates[`${i}`]);
	else set_date_defaults(data);
	if (!data.language || data.language === "") data.language = "en";
	else if (!availableLanguages.includes(String(data.language).length > 2 ? String(data.language).substring(0, 2) : String(data.language))) data.language = "en";
	return data;
}
function decorate_data_style(data) {
	if (data.inlineRSVP) data.inline = true;
	if (!data.listStyle || data.listStyle === "") data.listStyle = "dropdown";
	if (data.listStyle === "modal") data.trigger = "click";
	if (data.buttonStyle && data.buttonStyle !== "" && data.buttonStyle != "default") {
		if (data.buttonStyle == "simple" || data.buttonStyle == "round" || data.buttonStyle == "text" || data.buttonStyle == "date" || data.buttonStyle == "neumorphism") data.trigger = "click";
	} else data.buttonStyle = "default";
	if ((data.buttonStyle == "default" || data.buttonStyle == "3d" || data.buttonStyle == "flat") && !data.hideTextLabelList && data.hideTextLabelButton && (data.listStyle == "dropdown" || data.listStyle == "dropdown-static" || data.listStyle == "dropup-static")) data.listStyle = "overlay";
	if (data.buttonsList && data.buttonStyle == "date") data.buttonsList = false;
	return data;
}
function decorate_light_mode(lightMode = "") {
	if (lightMode == "system" && isBrowser()) return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	if (lightMode != "bodyScheme" && lightMode != "dark") return "light";
	return lightMode;
}
function decorate_data_i18n(data) {
	const raw = String(data.language || "en");
	let region = "";
	if (raw.length > 2) {
		const match = raw.match(/^([a-z]{2})[-_]([a-z]{2})$/i);
		if (match) region = match[2].toUpperCase();
		data.language = raw.substring(0, 2);
	}
	const browserRegion = (function() {
		if (typeof navigator === "undefined" || !navigator.language) return "";
		const parts = navigator.language.split("-");
		const last = parts[parts.length - 1] || "";
		return parts.length > 1 && /^[a-z]{2}$/i.test(last) ? last.toUpperCase() : "";
	})();
	const effectiveRegion = region || browserRegion;
	data.formatLocale = effectiveRegion ? data.language + "-" + effectiveRegion : data.language;
	data.translationLocale = region ? data.language + "_" + region : data.language;
	if (rtlLanguages.includes(data.language)) data.rtl = true;
	else data.rtl = false;
	return data;
}
async function decorate_data_rsvp(data) {
	if (typeof check_bookings !== "function" || !data.rsvp || !data.proKey || Object.keys(data.rsvp).length === 0) return data;
	data.rsvp.expired = (function() {
		if (data.rsvp && data.rsvp.expires && new Date(data.rsvp.expires) < /* @__PURE__ */ new Date()) return true;
		return false;
	})();
	if (data.rsvp.max) {
		const bookings = await check_bookings(data.proKey, data.dev);
		data.rsvp.seatsLeft = data.rsvp.max - bookings;
		if (data.rsvp.seatsLeft < 1) data.rsvp.bookedOut = true;
		if (data.rsvp.expired || data.rsvp.bookedOut) data.blockInteraction = true;
		if (data.blockInteraction) data.disabled = true;
	}
	return data;
}
//#endregion
//#region src/action/index.ts
/**
* atcb_action - the imperative API for custom triggers (no web component markup needed).
*/
async function atcb_action(inputData, triggerElement, keyboardTrigger = false) {
	const sinkMode = inputData.sink === true;
	if (!isBrowser() && !sinkMode) return;
	let data;
	try {
		data = await (async function() {
			const cleanedInput = secure_content(inputData);
			const internalInput = cleanedInput;
			if (cleanedInput.prokey && cleanedInput.prokey !== "") internalInput.proKey = cleanedInput.prokey;
			if (internalInput.proKey && internalInput.proKey !== "") try {
				return await get_pro_data(internalInput.proKey, void 0, internalInput);
			} catch (e) {
				throw new Error(e.message);
			}
			else return internalInput;
		})();
	} catch (e) {
		console.error(e);
		return;
	}
	data.debug = data.debug === "true";
	try {
		await check_required(data);
	} catch (e) {
		if (data.debug) console.error(e);
		throw new Error("Add to Calendar Button generation failed: no data provided or missing required fields - see console logs for details");
	}
	data = await decorate_data(data);
	await ensure_locale(data);
	if (sinkMode) {
		await validate(data);
		if (!data.options || data.options.length !== 1) throw new Error("Add to Calendar Button generation failed: exactly one option required");
		if (data.options[0] === "apple" || data.options[0] === "ical") {
			if (data.dates.length > 1 && !can_group_ics(data)) throw new Error("Add to Calendar Button generation failed: option does not resolve to a single value");
			const subEvent = data.dates.length === 1 ? 0 : "all";
			const action = generate_ical(null, data, data.options[0], subEvent, false, true);
			if (!action) throw new Error("Add to Calendar Button generation failed: option does not resolve to a single value");
			return action.content || action.href;
		}
		resultChannel.open();
		try {
			await generate_links(null, data.options[0], data, "all", false, false, true);
		} catch (e) {
			resultChannel.close();
			throw e instanceof Error ? e : new Error(String(e));
		}
		const value = resultChannel.close();
		if (!value) throw new Error("Add to Calendar Button generation failed: option does not resolve to a single value");
		return value;
	}
	let root = document.body;
	data.trigger = "click";
	if (triggerElement) {
		root = triggerElement;
		if (triggerElement.id && triggerElement.id !== "") data.identifier = triggerElement.id;
		else {
			if (data.identifier && data.identifier != "" && /^[\w-]+$/.test(data.identifier)) data.identifier = "atcb-btn-" + data.identifier;
			else data.identifier = "atcb-btn-custom";
			triggerElement.id = data.identifier;
		}
		if (data.listStyle === "dropdown" || data.listStyle === "dropdown-static" || data.listStyle === "dropup-static") data.listStyle = "modal";
	} else {
		data.identifier = "atcb-btn-custom";
		data.listStyle = "modal";
	}
	try {
		await validate(data);
	} catch (e) {
		console.error(e);
		return false;
	}
	const oneOption = (function() {
		if (data.options.length === 1) return true;
		return false;
	})();
	const potentialExistingHost = document.getElementById("atcb-customTrigger-" + data.identifier + "-host");
	if (potentialExistingHost) {
		revoke_ics_blob_urls(data.identifier);
		close(potentialExistingHost.shadowRoot, false);
		if (getButtonInstance(getActiveButton())) deleteButtonInstance(getActiveButton());
		potentialExistingHost.remove();
	}
	log_event("initialization", data.identifier, data.identifier);
	if (!data.blockInteraction && !data.hidden) {
		const host = document.createElement("div");
		if (data.cspnonce && data.cspnonce !== "") host.setAttribute("cspnonce", data.cspnonce);
		host.id = "atcb-customTrigger-" + data.identifier + "-host";
		if (root === document.body) document.body.append(host);
		else root.after(host);
		if (triggerElement) {
			const btnDim = triggerElement.getBoundingClientRect();
			host.style.position = "relative";
			host.style.left = -btnDim.width + "px";
			host.style.top = btnDim.height + "px";
		}
		host.setAttribute("atcb-button-id", data.identifier);
		host.attachShadow({
			mode: "open",
			delegatesFocus: true
		});
		const elem = document.createElement("template");
		elem.innerHTML = template;
		host.shadowRoot.append(elem.content.cloneNode(true));
		const rootObj = host.shadowRoot.querySelector(".atcb-initialized");
		setup_state_management(data);
		set_light_mode(host.shadowRoot, data);
		host.shadowRoot.querySelector(".atcb-initialized").setAttribute("lang", data.language);
		await load_css(host.shadowRoot, rootObj, data);
		set_global_event_listener(host.shadowRoot, data);
		if (typeof generate_rsvp_form === "function" && data.rsvp && Object.keys(data.rsvp).length > 0) generate_rsvp_form(host.shadowRoot, data, triggerElement, keyboardTrigger);
		else if (oneOption) {
			const option = data.options[0];
			if ((option === "apple" || option === "ical") && static_ics_file(host.shadowRoot, data, data.dates.length === 1 ? 0 : "all") === "" && (isIOS() || data.fakeIOS)) {
				const subEvents = [option];
				if (data.dates.length === 1 || can_group_ics(data)) subEvents.push(data.dates.length === 1 ? 1 : "all");
				else for (let i = 0; i < data.dates.length; i++) subEvents.push(i + 1);
				await create_modal(host.shadowRoot, data, option, "", "", [], subEvents, keyboardTrigger);
			} else {
				await generate_links(host.shadowRoot, option, data, "all", keyboardTrigger);
				log_event("openSingletonLink", data.identifier, data.identifier);
			}
		} else toggle(host.shadowRoot, "open", data, triggerElement !== null && triggerElement !== void 0 ? triggerElement : null, keyboardTrigger);
	}
	init_log(data.proKey, data.hideBranding, data.debug);
	if (data.debug) console.log("Add to Calendar Button \"" + data.identifier + "\" triggered");
	return data.identifier;
}
//#endregion
export { atcb_action, decorate_data_dates as atcb_decorate_data_dates, generate_timestring as atcb_generate_timestring, generate_ty as atcb_generate_ty, register_locale as atcb_register_locale, register_style as atcb_register_style, atcbCssTemplate as cssStyles, i18nStrings };
