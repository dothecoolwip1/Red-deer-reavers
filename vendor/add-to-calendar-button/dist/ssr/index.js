import { tzlib_get_offset } from "timezones-ical-library";
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
var isBrowser = () => {
	if (typeof window === "undefined") return false;
	else return true;
};
(isBrowser() ? () => {
	if (/; ?wv|(?:iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent)) return true;
	else return false;
} : () => {
	return false;
})();
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
//#endregion
//#region src/core/text.ts
function escape_html_text(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escape_html(value) {
	return escape_html_text(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
({ ...flatten_translations(en_default) });
(() => {
	try {
		if (typeof import.meta !== "undefined" && import.meta.url) {
			const src = String(import.meta.url);
			if (src.indexOf("data:") !== 0 && src.lastIndexOf("/") > -1) return resolve_script_base(src);
		}
	} catch {}
	try {
		if (typeof document !== "undefined" && document.currentScript && document.currentScript.src) {
			const src = document.currentScript.src;
			return resolve_script_base(src);
		}
	} catch {}
	return "";
})();
function flatten_translations(strings, prefix = "") {
	const flat = {};
	for (const [key, value] of Object.entries(strings)) if (typeof value === "string") flat[prefix + key] = value;
	else Object.assign(flat, flatten_translations(value, prefix + key + "."));
	return flat;
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
//#endregion
//#region src/ssr/index.ts
var atcbSsrCssTemplate = {
	"core": ":host(.atcb-dark){--accent-color:#7ab0ff;--btn-text:#f2f4f7;--list-text:#f2f4f7;--modal-text:#f1f1f1;--modal-background:#242424;--modal-btn-background:#181819;--modal-btn-secondary-background:#2e2d30;--modal-btn-hover-background:#434246;--modal-btn-text:#dbdbdb;--modal-btn-hover-text:#fff;--modal-btn-secondary-text:#b8b8b8;--input-background:#434246;--status-active-text:#000;--form-error:#db8680;--form-success:#99de9c;--date-btn-text:#f2f4f7;--date-btn-text-secondary:#98a2b3;--date-btn-cal-day-text:#101216;--date-btn-cal-background:#c9ccd2;--date-badge-ink:#0b0d10;--date-btn-hover-background:#2b2f35;--icon-yahoo-color:#bebebe}:host{--modal-border-radius:0px}:where(a.atcb-button,a.atcb-list-item,a.atcb-subevent-btn){all:unset;box-sizing:border-box}.atcb-button-wrapper,.atcb-list,.atcb-modal-box{font-size:var(--base-font-size-l)}@media (width <= 991px){.atcb-button-wrapper,.atcb-list,.atcb-modal-box{font-size:var(--base-font-size-m)}}@media (width <= 575px){.atcb-button-wrapper,.atcb-list,.atcb-modal-box{font-size:var(--base-font-size-s)}}.atcb-button-wrapper{display:block;padding:var(--wrapper-padding);position:relative}.atcb-rtl .atcb-button{direction:rtl;text-align:right}.atcb-icon svg{fill:currentcolor;height:100%;width:100%}.atcb-chevron svg[fill=none],.atcb-date-btn-content-icon svg[fill=none],.atcb-date-btn-plus svg[fill=none],.atcb-icon svg[fill=none]{fill:none}.atcb-text{overflow-wrap:anywhere}[part=atcb-button-text]{text-align:left}.atcb-rtl [part=atcb-button-text]{text-align:right}.atcb-button .atcb-icon+.atcb-text{margin-top:.07em}.atcb-rtl .atcb-list-item{direction:rtl;text-align:right}.atcb-list-item .atcb-icon+.atcb-text{width:100%}.atcb-list-modal-header{align-items:center;display:flex;gap:40px;justify-content:space-between;padding-block:.6em;padding-inline:1em .6em}.atcb-list-modal-headline{flex:1 1 auto;font-weight:700;font-size:1.05em;padding-top:.1em;text-align:left}.atcb-list.atcb-rtl .atcb-list-modal-headline{text-align:right}.atcb-list.atcb-modal .atcb-list-item-close{flex:0 0 auto;position:static}.atcb-list.atcb-modal .atcb-list-item-close .atcb-text{display:none}.atcb-list.atcb-modal .atcb-list-item-close .atcb-icon{height:100%;width:100%;margin:0}.atcb-modal{display:block;margin:auto;width:auto;min-width:auto;position:relative;z-index:14000090}.atcb-list.atcb-modal{min-width:auto;overflow:hidden}@media (width <= 575px){.atcb-list.atcb-modal{border:0;border-radius:0;box-shadow:none;margin:0;min-height:100dvh;min-width:100%;width:100%}}.atcb-modal-box.atcb-rtl{text-align:right;direction:rtl;padding:1.25em 1em 1.25em 2em}.atcb-modal-icon svg{fill:currentcolor;height:100%;width:100%}.atcb-modal-content ol,.atcb-modal-content ul{margin:1em 0;text-align:left;width:fit-content}.atcb-rtl .atcb-modal-content ol,.atcb-rtl .atcb-modal-content ul{text-align:right}.atcb-modal-content-subevents{max-width:320px}@media (width <= 575px){.atcb-modal-content-subevents{margin:auto;max-width:380px}}.atcb-modal-clipboard-input{background-color:transparent;border:1px solid currentcolor;border-radius:6px;box-sizing:border-box;color:inherit;cursor:text;direction:ltr;font-family:monospace;font-size:.9em;margin:.5em 0;max-width:100%;padding:.5em .6em;width:100%}a.atcb-modal-btn.btn-small,button.atcb-modal-btn.btn-small{padding:.6em .8em}a.atcb-modal-btn.atcb-modal-btn-primary,button.atcb-modal-btn.atcb-modal-btn-primary{background-color:var(--modal-btn-background);color:var(--modal-btn-text)}a.atcb-modal-btn:focus-visible,button.atcb-modal-btn:focus-visible{background-color:var(--modal-btn-hover-background);outline:2px solid var(--accent-color)}a.atcb-modal-btn:disabled,button.atcb-button:disabled,button.atcb-modal-btn:disabled,button.atcb-subevent-btn:disabled{cursor:not-allowed;opacity:.75;filter:brightness(95%);border-style:dashed;box-shadow:none}.atcb-subevent-btn+.atcb-subevent-btn{margin-top:30px}.atcb-date-btn-day{color:var(--date-btn-cal-day-text);font-weight:600;font-size:1.7em;line-height:1.15;word-break:keep-all}.atcb-initialized[lang=ja] .atcb-date-btn-day,.atcb-initialized[lang=ko] .atcb-date-btn-day,.atcb-initialized[lang=zh] .atcb-date-btn-day{font-size:1.3em}.atcb-date-btn-month{color:var(--date-btn-cal-month-text);font-weight:700;font-size:.68em;letter-spacing:.14em;text-transform:uppercase}.atcb-date-btn-right{position:relative;color:var(--date-btn-text);min-width:13.5em;overflow-wrap:anywhere}@media (width <= 414px){.atcb-date-btn-day{font-size:1.7em}.atcb-date-btn-month{font-size:.8em}.atcb-date-btn-right{min-width:10em}}.atcb-date-btn-right-centered{align-self:center}.atcb-subevent-btn .atcb-date-btn-right{width:100%}.atcb-rtl .atcb-date-btn-details{text-align:right}.atcb-date-btn-hover{position:absolute;top:0;left:0;width:100%;opacity:0;height:100%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:1em;padding:.4em 1.2em .4em .7em;box-sizing:border-box}.atcb-date-btn-content{display:flex;align-items:flex-start;font-size:.8em;color:var(--date-btn-text-secondary)}.atcb-date-btn-content-clamped{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2}.atcb-date-btn-content.atcb-date-btn-cancelled{color:var(--form-error);font-weight:700}.atcb-date-btn-content-location{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.atcb-date-btn-content-icon{display:inline-block;height:.9em;margin:.075em .4em 0 0;width:.9em;flex-shrink:0}.atcb-rtl .atcb-date-btn-content-icon{margin-right:0;margin-left:.4em}.atcb-initialized[lang=ja] .atcb-date-btn-content:not(.atcb-date-btn-content-location) .atcb-date-btn-content-icon,.atcb-initialized[lang=ko] .atcb-date-btn-content:not(.atcb-date-btn-content-location) .atcb-date-btn-content-icon,.atcb-initialized[lang=zh] .atcb-date-btn-content:not(.atcb-date-btn-content-location) .atcb-date-btn-content-icon{margin-top:.15em}.atcb-date-btn-content-icon svg{height:100%;fill:currentcolor;width:100%}.atcb-date-btn-content-text span:not(.atcb-icon-ical){padding-right:.3em;display:inline-block}.atcb-button:focus-visible .atcb-date-btn-plus,.atcb-subevent-btn:focus-visible .atcb-date-btn-plus{background-color:var(--accent-color)}.atcb-checkmark{display:none}.atcb-modal-host-initialized{width:100%;height:100%}#atcb-bgoverlay.atcb-no-bg{animation:none;backdrop-filter:none;-webkit-backdrop-filter:none;opacity:1;background-color:transparent}@keyframes atcb-bgoverlay-animate{0%{opacity:0}100%{opacity:1}}@keyframes atcb-modal-appear{0%{opacity:0}100%{opacity:1}}.atcb-modal.atcb-modal-appear{animation:atcb-modal-appear .15s ease 0s 1 normal both}.atcb-icon.atcb-icon-ms365 svg{fill:var(--icon-ms365-color)}.atcb-icon.atcb-icon-yahoo svg{fill:var(--icon-yahoo-color)}.atcb-icon.atcb-icon-google svg,.atcb-icon.atcb-icon-msteams svg,.atcb-icon.atcb-icon-outlookcom svg{filter:var(--icon-filter)}.pro{text-align:left}.atcb-modal-box.atcb-rtl .pro{text-align:right}.pro .pro-intro{text-align:inherit}.pro a:not(.atcb-modal-btn),.pro a:not(.atcb-modal-btn):active,.pro a:not(.atcb-modal-btn):visited{color:var(--modal-btn-text);text-decoration:underline;text-decoration-thickness:2px;text-decoration-color:var(--accent-color)}.pro a:not(.atcb-modal-btn):hover{color:var(--accent-color);text-decoration:none}.pro .pro-share-buttons{display:flex;flex-wrap:wrap;justify-content:center}.pro-field+.pro-field{padding-top:1.3em}.pro-field-type-label+.pro-field-type-radio{padding-top:0}.pro-field-type-checkbox,.pro-field-type-radio div{align-items:center;display:flex}.pro-field-type-checkbox input,.pro-field-type-radio input{cursor:pointer}.pro-field label{display:block;font-size:.9em;opacity:.7}.pro-field-type-checkbox label,.pro-field-type-radio label{cursor:pointer;opacity:.8;padding-left:.3em}.pro-field input[type=checkbox],.pro-field input[type=radio]{accent-color:var(--accent-color);height:1.2rem;opacity:.8;transition:all .1s ease-in-out;width:1.2em}.pro-field input:disabled,.pro-field input:disabled+label{cursor:not-allowed;opacity:.75;filter:brightness(95%)}.pro-field input:not([disabled]):hover{opacity:1}.pro-field input[type=checkbox]:focus,.pro-field input[type=radio]:focus{outline-color:var(--accent-color);outline-width:2px}#submit-error{color:var(--form-error);display:none;font-weight:700;padding-top:1.5em;text-align:center}#submit-error:focus{outline:2px solid var(--accent-color);outline-offset:2px}.pro-form.form-error #submit-error{display:block}.pro-field input.error{accent-color:var(--form-error);border:2px solid var(--form-error)}.pro-field input.error+label,.pro-field:has(input.error) label{color:var(--form-error);opacity:1}.pro-form.form-error .pro-form-fine{opacity:0}@media (width > 575px){#pro-form-submit,.pro-waiting{min-width:200px}}.pro-waiting span:not(.atcb-icon-ical):not(.atcb-sr-only){animation-name:blink;animation-duration:1s;animation-iteration-count:infinite;animation-fill-mode:both;font-size:2.5em}.pro-field label span:not(.atcb-icon-ical){color:var(--form-error);font-weight:700;padding-left:2px}.pro-waiting span:not(.atcb-icon-ical):not(.atcb-sr-only):nth-child(2){animation-delay:.15s}.pro-waiting span:not(.atcb-icon-ical):not(.atcb-sr-only):nth-child(3){animation-delay:.3s}.atcb-sr-only{border:0;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px}@keyframes blink{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}.atcb-modal-content .pro p:not(.pro-form-fine){margin:0}.atcb-modal-content .pro p.pro-pt{margin-top:1.5em}.atcb-modal-content .pro .pro-field p{font-size:.9em}.pro .btn-flex{align-items:center;display:flex}.pro .atcb-modal-btn svg{fill:none;height:1.5em;margin-right:.5em;stroke:currentcolor;width:auto}#atcb-reference{box-sizing:border-box;color:#000;filter:drop-shadow( 1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow( 0 1px 0 #fff) drop-shadow( 0 -1px 0 #fff);height:auto;padding:8px 0;text-align:center;transform:translate3d(0,0,0);width:100%;z-index:15000000}#atcb-reference.fixed-ref{position:fixed;bottom:10px;right:40px;width:auto}.atcb-modal-host-initialized #atcb-reference.atcb-dropup{text-align:left}:host(.atcb-dark) #atcb-reference{color:#fff;filter:drop-shadow( 1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow( 0 1px 0 #000) drop-shadow( 0 -1px 0 #000)}#atcb-reference a,#atcb-reference a:active,#atcb-reference a:visited{opacity:.8;width:150px;max-width:100%;margin:auto;display:inline-block;text-decoration:none}#atcb-reference a:hover{opacity:1;text-decoration:none}#atcb-reference svg{fill:var(--list-text)}:host{width:fit-content;--font:arial,helvetica,\"Twemoji Mozilla\",\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"EmojiOne Color\",\"Android Emoji\",sans-serif;--accent-color:#2f6fed;--input-background:#fff;--status-active-text:#fff;--form-error:#c5372c;--form-success:#338a36;--modal-background:#f5f5f5;--modal-btn-secondary-background:#e2e1e6;--modal-btn-font-weight:600;--modal-btn-text:#2e2e2e;--date-btn-text:#1d1d1e;--date-btn-cal-day-text:#fff;--date-btn-cal-month-text:#c9ccd2;--date-btn-cal-background:#2f3134;--date-badge-ink:#fff;--date-btn-hover-background:#fff;--date-btn-headline-line-clamp:1;--icon-ms365-color:#ea3e23;--icon-yahoo-color:#5f01d1;--icon-filter:none}.atcb-button{gap:.55em;position:relative;z-index:1}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay){z-index:15000000}.atcb-button.atcb-active.atcb-dropoverlay{z-index:14000090}.atcb-icon{flex-grow:0;flex-shrink:0;line-height:1em}.atcb-chevron{flex-grow:0;flex-shrink:0;height:.8em;width:.8em;opacity:.55;transition:transform .16s ease}.atcb-chevron svg{display:block;height:100%;width:100%}.atcb-button.atcb-active .atcb-chevron{transform:rotate(180deg)}@media (prefers-reduced-motion:reduce){.atcb-chevron{transition:none}}.atcb-dropdown-anchor{width:100%;opacity:0;position:absolute}.atcb-list-wrapper{box-sizing:border-box;position:absolute}.atcb-list{box-sizing:border-box;color:var(--list-text);display:block;font-family:var(--font);position:relative;user-select:none;-webkit-user-select:none;width:fit-content}.atcb-list-item{align-items:center;background-color:var(--list-background);box-sizing:border-box;cursor:pointer;display:flex;gap:.8em;font-size:1em;margin:.2em 0;line-height:1.75em;text-align:left;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.atcb-list-item:hover{background-color:var(--list-hover-background);color:var(--list-hover-text)}.atcb-list-item:focus-visible{background-color:var(--list-hover-background);color:var(--accent-color);outline:0}.atcb-list-item .atcb-icon{margin:0 auto}.atcb-list.atcb-no-text .atcb-list-item:not(.atcb-list-item-close) .atcb-icon{margin-left:0;margin-right:auto}.atcb-list.atcb-rtl.atcb-no-text .atcb-list-item:not(.atcb-list-item-close) .atcb-icon{margin-left:auto;margin-right:0}.atcb-modal-box{background-color:var(--modal-background);border-radius:var(--modal-border-radius);color:var(--modal-text);cursor:default;box-sizing:border-box;font-family:var(--font);line-height:1.5em;text-align:left;user-select:none;-webkit-user-select:none;touch-action:manipulation;width:100%;margin-bottom:20px;-webkit-tap-highlight-color:transparent;overflow:hidden;position:relative}.atcb-modal-box-with-icon{column-gap:1.5em;display:grid;grid-template-columns:auto minmax(0,1fr)}.atcb-modal-box-with-icon.atcb-rtl{grid-template-columns:minmax(0,1fr) auto}.atcb-modal-box-with-icon>:not(.atcb-modal-icon,.atcb-modal-close){grid-column:2}.atcb-modal-box-with-icon.atcb-rtl>:not(.atcb-modal-icon,.atcb-modal-close){grid-column:1}.atcb-modal-box-with-icon.atcb-rtl>.atcb-modal-buttons,.atcb-modal-box-with-icon>.atcb-modal-buttons{grid-column:1/-1}.atcb-list-item-close,.atcb-modal-close{align-items:center;background:0 0;border:0;border-radius:100%;box-sizing:border-box;color:var(--modal-btn-text);cursor:pointer;display:flex;height:2.2em;justify-content:center;padding:.65em;touch-action:manipulation;width:2.2em;-webkit-tap-highlight-color:transparent;z-index:1}.atcb-modal-close{inset-inline-end:.7em;position:absolute;top:.7em}.atcb-list-item-close:focus-visible,.atcb-list-item-close:hover,.atcb-modal-close:focus-visible,.atcb-modal-close:hover{background-color:var(--modal-btn-hover-background);color:var(--modal-btn-hover-text);outline:1px solid var(--modal-btn-hover-text)}.atcb-list-item-close:focus-visible,.atcb-modal-close:focus-visible{outline:2px solid var(--accent-color)}.atcb-list-item-close svg,.atcb-modal-close svg{fill:currentcolor;height:100%;width:100%}:host(.atcb-dark) .atcb-list-item-close,:host(.atcb-dark) .atcb-modal-close{color:var(--modal-text)}:host(.atcb-dark) .atcb-list-item-close:focus-visible,:host(.atcb-dark) .atcb-list-item-close:hover,:host(.atcb-dark) .atcb-modal-close:focus-visible,:host(.atcb-dark) .atcb-modal-close:hover{color:var(--modal-btn-hover-text)}@media (width > 575px){.atcb-modal-box{width:32em}}@media (width <= 575px){.atcb-modal-box{border-radius:0;display:flex;filter:none;flex-direction:column;margin-bottom:0;min-height:100%;overflow:visible}}@media (width <= 575px){.atcb-modal-host-initialized #atcb-bgoverlay{padding:0;background-color:var(--modal-background)}}@media (width <= 575px){.atcb-modal{width:100%;min-height:100dvh;margin:0}}@media (width <= 575px){.atcb-modal-buttons{border-radius:0;margin-top:auto}}.atcb-modal-icon{height:2.5em;grid-column:1;grid-row:1/span 20;margin-block-start:1.8em;margin-inline-start:2em;width:2.5em}.atcb-modal-box.atcb-rtl .atcb-modal-icon{grid-column:2}.atcb-modal-headline{font-size:1.3em;font-weight:600;line-height:1.5em;padding:1.8em 1.5em 1.3em;text-transform:var(--modal-headline-text-transform);text-align:left}.atcb-modal-box.atcb-rtl .atcb-modal-headline{text-align:right}.atcb-modal-content{font-size:1em;padding:.3em 2em 2.2em}.atcb-modal-box-with-icon .atcb-modal-content,.atcb-modal-box-with-icon .atcb-modal-headline{padding-inline-start:0}@media (width <= 575px){.atcb-modal-icon{margin:1.8em auto 0}.atcb-modal-box.atcb-rtl .atcb-modal-icon{margin-inline:auto}}@media (width <= 575px){.atcb-modal-box.atcb-rtl .atcb-modal-headline,.atcb-modal-headline{padding:1.8em 1em 1em;text-align:center}.atcb-modal-box-with-icon .atcb-modal-headline{padding-inline:1em}}@media (width <= 575px){.atcb-modal-content{padding:.3em 1.5em 1.5em;text-align:center}.atcb-modal-box-with-icon .atcb-modal-content{padding-inline:1.5em}.atcb-modal-content .pro,.atcb-modal-content .pro-form,.atcb-modal-content .pro-intro{text-align:left}.atcb-modal-box.atcb-rtl .atcb-modal-content .pro,.atcb-modal-box.atcb-rtl .atcb-modal-content .pro-form,.atcb-modal-box.atcb-rtl .atcb-modal-content .pro-intro{text-align:right}}.atcb-modal-buttons{background-color:var(--modal-btn-bar);box-sizing:border-box;padding:.6em;text-align:center;width:100%;display:flex;justify-content:center;flex-flow:row-reverse wrap;align-items:center}a.atcb-modal-btn,button.atcb-modal-btn{background-color:var(--modal-btn-secondary-background);color:var(--modal-btn-secondary-text);cursor:pointer;display:inline-block;font-family:var(--font);font-weight:var(--modal-btn-font-weight);line-height:1em;padding:1em 1.25em;position:relative;text-align:center;text-decoration:none;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{background-color:var(--modal-btn-hover-background);color:var(--modal-btn-hover-text);text-decoration:none}.atcb-subevent-btn{width:100%}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{background-color:var(--date-btn-hover-background)}.atcb-date-btn-left{align-self:stretch;background-color:var(--date-btn-cal-background);padding:.6em .5em;width:3.2em;align-items:center;justify-content:center;text-align:center;display:flex;flex-direction:column;flex-shrink:0;box-sizing:border-box}@media (width <= 414px){.atcb-date-btn-left{width:fit-content}}@media (width <= 575px){dialog .atcb-list.atcb-modal{display:flex;flex-direction:column}}@media (width <= 575px){dialog .atcb-list-item{padding:1.3em}}.atcb-date-btn-details{opacity:1;text-align:left}.atcb-date-btn-headline{font-weight:600;overflow:hidden;display:-webkit-box;-webkit-line-clamp:var(--date-btn-headline-line-clamp);line-clamp:var(--date-btn-headline-line-clamp)}.atcb-date-btn-headline-two-lines{-webkit-line-clamp:2;line-clamp:2}.atcb-date-btn-headline-centered{text-align:center}.atcb-date-btn-content+.atcb-date-btn-content{padding-right:.6em}.atcb-date-btn-plus{position:absolute;right:-.7em;top:50%;transform:translateY(-50%);background:var(--accent-color);border-radius:100%;box-shadow:0 0 0 .14em var(--date-btn-background);color:var(--date-badge-ink,#fff);display:flex;font-size:.9em;font-weight:400;height:1.5em;width:1.5em;justify-content:center;align-items:center;transition:transform .16s ease}.atcb-date-btn-plus svg{height:.75em;width:.75em}.atcb-rtl .atcb-date-btn-plus{right:auto;left:-.7em}.atcb-button:not(.atcb-active):hover .atcb-date-btn-plus,.atcb-subevent-btn:hover .atcb-date-btn-plus{transform:translateY(-50%) scale(1.12)}.atcb-button.atcb-active .atcb-date-btn-plus{transform:translateY(-50%) rotate(45deg)}@media (prefers-reduced-motion:reduce){.atcb-date-btn-plus{transition:none}.atcb-button:not(.atcb-active):hover .atcb-date-btn-plus,.atcb-subevent-btn:hover .atcb-date-btn-plus{transform:translateY(-50%)}}.atcb-saved .atcb-checkmark{box-sizing:content-box;color:var(--btn-text);display:block;position:absolute;padding:.5em;border-radius:100%}.atcb-checkmark svg{height:100%;width:auto}#atcb-bgoverlay{background-color:var(--overlay-background);border:0;box-sizing:border-box;display:flex;height:100dvh;inset-inline:0;left:0;right:0;top:0;min-height:100%;min-width:100%;overflow-y:auto;padding:20px;position:fixed;width:100dvw;z-index:14000000}.pro-form{text-align:left}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{background-color:var(--input-background);border-radius:var(--input-border-radius);box-sizing:border-box;caret-color:var(--accent-color);color:var(--modal-text);font-size:.9em;opacity:.8;padding:.7em;transition:all .1s ease-in-out;width:100%}#pro-form-submit{display:block;margin:auto;min-width:150px}.pro-form-fine{font-size:.8em;opacity:.5;text-align:center}.pro-waiting{background-color:var(--modal-btn-background);border-radius:var(--btn-border-radius);box-sizing:border-box;color:var(--modal-btn-text);cursor:wait;display:none;line-height:.5em;margin:auto;min-width:150px;padding:.5em 1.25em 1.2em;text-align:center;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:fit-content}#atcb-reference.atcb-dropup{position:absolute}:host:has(.atcb-group-overview){box-sizing:border-box;display:block;max-width:100%!important;width:min(600px,100%)!important}:host:has(.atcb-group-overview.atcb-group-overview-cards){width:min(1200px,100%)!important}.atcb-group-overview{box-sizing:border-box;color:#1b1f24;display:block;font-family:Arial,Helvetica,sans-serif;max-width:100%;width:100%}.atcb-group-overview.atcb-group-overview-cards{container-name:atcb-group-overview-cards;container-type:inline-size}.atcb-group-overview *{box-sizing:border-box}.atcb-group-overview-controls{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 1.25em;width:100%}.atcb-group-overview-results{display:block;width:100%}.atcb-group-overview-select{appearance:none;background-color:#fff;background-image:linear-gradient(45deg,transparent 50%,#1b1f24 50%),linear-gradient(135deg,#1b1f24 50%,transparent 50%);background-position:calc(100% - .8em) 50%,calc(100% - .55em) 50%;background-repeat:no-repeat;background-size:.25em .25em;border:1px solid #111;border-radius:4px;color:#1b1f24;cursor:pointer;font:inherit;font-weight:700;padding:.55em 2.3em .55em .85em}.atcb-group-overview-select:focus:not(:focus-visible){outline:0}.atcb-group-overview-select:focus-visible{outline:2px solid #111;outline-offset:2px}.atcb-group-overview-month{font-size:1.15em;margin:24px 0 10px}.atcb-group-overview-items{display:flex;flex-direction:column;gap:.7em;list-style:none;margin:0;padding:0}.atcb-group-overview-items:has(> .atcb-group-overview-item-with-add){padding-right:1.35em}.atcb-group-overview-items.atcb-group-overview-list{max-width:600px;width:100%}.atcb-group-overview-items.atcb-group-overview-list>.atcb-group-overview-item{width:100%}.atcb-group-overview-items.atcb-group-overview-cards{display:grid;gap:1.4em;grid-template-columns:minmax(0,1fr);max-width:1200px;width:100%}.atcb-group-overview-items.atcb-group-overview-cards>.atcb-group-overview-item{min-width:0}@container atcb-group-overview-cards (width >= 600px){.atcb-group-overview-items.atcb-group-overview-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@container atcb-group-overview-cards (width >= 1000px){.atcb-group-overview-items.atcb-group-overview-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}.atcb-group-overview-item{background:#fff;border:1px solid #d7dbe0;border-radius:4px;box-shadow:rgb(16 24 40 / 9%) 0 1px 3px;min-height:4.5em;min-width:0;padding:0;position:relative;transition:border-color .15s ease,box-shadow .15s ease}.atcb-group-overview-event-link{align-items:stretch;color:inherit;display:flex;min-height:inherit;text-decoration:none;width:100%}.atcb-group-overview-event-link:focus-visible{border-radius:2px;outline:2px solid #111;outline-offset:2px}.atcb-group-overview-items:not(.atcb-group-overview-compact)>.atcb-group-overview-item-no-details:hover,.atcb-group-overview-items:not(.atcb-group-overview-compact)>.atcb-group-overview-item:hover:not(.atcb-group-overview-item-no-add):not(:has(.atcb-group-overview-add:hover)){border-color:#bfc5cd;box-shadow:rgb(16 24 40 / 15%) 0 .4em 1em}.atcb-group-overview-day{align-items:center;background:#282a2e;clip-path:inset(0 round 3px 0 0 3px);color:#fff;display:flex;flex:0 0 3.2em;justify-content:center;padding:.6em .8em;text-align:center;min-width:56px}.atcb-group-overview-day-value{font-size:1.7em;font-weight:600;line-height:1.15}.atcb-group-overview-content{min-width:0;padding:.7em 1.4em .7em .8em;width:100%}.atcb-group-overview-title{color:inherit;display:-webkit-box;font-size:.95em;font-weight:600;overflow:hidden;text-decoration:none;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2}.atcb-group-overview-meta{display:flex;flex-direction:column;align-items:flex-start;color:#667085;font-size:.78em;gap:3px;margin:10px 0}.atcb-group-overview-meta-item{align-items:center;display:inline-flex;gap:.35em}.atcb-group-overview-meta-icon{display:inline-flex;flex:0 0 1em;height:1em;width:1em}.atcb-group-overview-meta-icon svg{height:100%;width:100%}.atcb-group-overview-description{color:#667085;display:-webkit-box;font-size:.8em;line-height:1.35;margin:.45em 0 0;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2}.atcb-group-overview-cards .atcb-group-overview-description{-webkit-line-clamp:3;line-clamp:3}.atcb-group-overview-add{align-items:center;background:#fff;border:1px solid #d7dbe0;border-radius:50%;color:#111;cursor:pointer;display:inline-flex;box-shadow:rgb(16 24 40 / 14%) 0 2px 5px;flex:0 0 1.8em;font-size:1em;height:1.8em;justify-content:center;line-height:1;padding:0;position:absolute;right:-.9em;text-decoration:none;top:calc(50% - .9em);touch-action:manipulation;width:1.8em;z-index:2;transition:background-color .15s ease,border-color .15s ease,color .15s ease}.atcb-group-overview-add:focus-visible,.atcb-group-overview-add:hover{background:#111;border-color:#111;color:#fff}.atcb-group-overview-item-no-details .atcb-group-overview-event-link:focus-visible .atcb-group-overview-add,.atcb-group-overview-item-no-details:hover .atcb-group-overview-add{background:#111;border-color:#111;color:#fff}.atcb-group-overview-add:focus-visible{outline:2px solid #111;outline-offset:2px}.atcb-group-overview-cards .atcb-group-overview-content{padding:1em}.atcb-group-overview-cards .atcb-group-overview-meta-datetime{color:#111;font-size:1em;font-weight:600;margin-bottom:.5em}.atcb-group-overview-cards .atcb-group-overview-title{border-bottom:1px solid #d7dbe0;border-top:1px solid #d7dbe0;padding:.65em 0}.atcb-group-overview-compact.atcb-group-overview-items{display:list-item;list-style-type:disc;gap:10px}.atcb-group-overview-compact>.atcb-group-overview-item{background:0 0;border:0;border-radius:0;box-shadow:none;min-height:0;margin:0 0 10px 20px}.atcb-group-overview-compact-row{align-items:center;display:inline-flex;max-width:100%;gap:6px}.atcb-group-overview-compact>:is(.atcb-group-overview-compact-with-add,.atcb-group-overview-compact-with-marker){list-style:none}.atcb-group-overview-compact:has(:is(.atcb-group-overview-compact-with-add,.atcb-group-overview-compact-with-marker))>.atcb-group-overview-item{margin-left:0}.atcb-group-overview-compact .atcb-group-overview-add{flex:0 0 1.8em;margin-right:.4em;position:static}.atcb-group-overview-compact-marker{align-items:center;display:inline-flex;flex:0 0 1.8em;height:1.8em;justify-content:center;line-height:1;margin-right:.4em;width:1.8em}.atcb-group-overview-empty{font-size:.9em;margin:12px 0}@media (width <= 414px){.atcb-group-overview-day{flex-basis:auto;width:fit-content;min-width:43px;padding:.6em .5em}.atcb-group-overview-day-value{font-size:1.5em}}@media (width <= 575px){.atcb-group-overview-meta-location{max-width:100%;width:100%}.atcb-group-overview-meta-location .atcb-group-overview-meta-text{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}",
	"default": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-background:#fff;--btn-hover-background:#f7f8fa;--btn-hover-border:#bfc5cd;--btn-border:#d7dbe0;--btn-border-radius:10px;--btn-padding-x:1.09em;--btn-padding-y:.7em;--btn-font-weight:600;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--btn-shadow:rgb(16 24 40 / 7%) 0 1px 2px;--btn-hover-shadow:rgb(16 24 40 / 11%) 0 3px 8px;--btn-active-shadow:rgb(16 24 40 / 13%) 0 4px 10px -1px;--list-background:#fff;--list-border-color:#e4e7ec;--list-hover-background:#f2f4f7;--list-text:#1b1f24;--list-font-weight:400;--list-hover-text:#1b1f24;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-radius:12px;--list-padding:.6em .75em;--list-shadow:rgb(16 24 40 / 25%) 0 12px 32px -8px,rgb(16 24 40 / 8%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) 0 4px 34px -3px,rgb(0 0 0 / 14%) 0 2px 12px -2px;--input-border-radius:6px;--modal-text:#000;--modal-border-radius:6px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-border:#d2d2d2;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(0 0 0 / 08%) 0 4px 14px -2px,rgb(0 0 0 / 08%) 0 2px 6px -1px;--modal-btn-hover-shadow:rgb(0 0 0 / 14%) 0 5px 17px -2px,rgb(0 0 0 / 12%) 0 3px 8px -2px;--modal-headline-text-transform:none;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--date-btn-shadow:rgb(16 24 40 / 9%) 0 1px 3px;--date-btn-hover-shadow:rgb(16 24 40 / 15%) 0 6px 16px -4px;--checkmark-background:drop-shadow(0 0 4px #fff);--overlay-background:rgb(20 20 20 / 25%)}:host(.atcb-dark){--btn-background:#24272c;--btn-hover-background:#2b2f35;--btn-hover-border:#4a5058;--btn-border:#3b4046;--btn-hover-text:#f2f4f7;--btn-shadow:rgb(0 0 0 / 35%) 0 1px 2px;--btn-hover-shadow:rgb(0 0 0 / 45%) 0 3px 8px;--btn-active-shadow:rgb(0 0 0 / 50%) 0 4px 10px -1px;--list-background:#24272c;--list-border-color:#373c43;--list-hover-background:#2f343b;--list-hover-text:#f2f4f7;--list-close-background:#282828;--list-close-text:#777;--list-shadow:rgb(0 0 0 / 60%) 0 12px 32px -8px,rgb(0 0 0 / 30%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) -1px 3px 34px 2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--modal-btn-shadow:rgb(255 255 255 / 3%) -2px -2px 14px,rgb(0 0 0 / 10%) 3px 3px 14px -2px,rgb(0 0 0 / 12%) 1px 2px 10px -1px;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--date-btn-shadow:rgb(0 0 0 / 40%) 0 1px 3px;--checkmark-background:drop-shadow(0 0 4px #0a0a0a);--overlay-background:rgb(20 20 20 / 60%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:1px solid var(--btn-border);border-radius:var(--btn-border-radius);box-shadow:var(--btn-shadow);box-sizing:content-box;color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:0;max-width:300px;padding:var(--btn-padding-y) var(--btn-padding-x);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button:not(.atcb-no-text,.atcb-modal-style,.atcb-dropoverlay,.atcb-single){min-width:calc(11.6em - 2 * var(--btn-padding-x))}.atcb-button.atcb-no-text{display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-hover-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button.atcb-single:not([disabled]):focus,.atcb-button.atcb-single:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-active-shadow);color:var(--btn-hover-text)}.atcb-button:not([disabled]).atcb-no-text.atcb-active,.atcb-button:not([disabled]).atcb-no-text:focus,.atcb-button:not([disabled]).atcb-no-text:hover{height:3em;width:3em;padding:0!important}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:4px;height:1px}.atcb-list-wrapper{font-weight:var(--list-font-weight);padding:0;z-index:14000090}.atcb-list-wrapper.atcb-dropoverlay{z-index:15000000;max-width:max-content}.atcb-list{background-color:var(--list-background);border:1px solid var(--list-border-color);border-radius:var(--list-border-radius);box-shadow:var(--list-shadow);min-width:100%;padding:.3em}.atcb-list-wrapper.atcb-dropdown:not(.atcb-dropup,.atcb-dropoverlay) .atcb-list{margin-top:.7em}.atcb-list-wrapper.atcb-dropup .atcb-list{margin-bottom:.7em}.atcb-list-item{background-color:transparent;border-radius:8px;padding:var(--list-padding)}.atcb-dropoverlay .atcb-list,.atcb-list.atcb-modal{border-radius:var(--list-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:1px solid var(--modal-btn-border)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-checkmark,.atcb-button.atcb-single:focus .atcb-checkmark,.atcb-button.atcb-single:hover .atcb-checkmark{top:-.77em;right:-.37em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-trigger{padding-bottom:.05em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:1px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:1px solid var(--modal-btn-text);border-radius:var(--input-border-radius);box-shadow:var(--btn-shadow);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);box-shadow:var(--btn-hover-shadow);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{box-shadow:var(--btn-hover-shadow);opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}",
	"simple": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-background:transparent;--btn-hover-background:rgb(27 31 36 / 6%);--btn-hover-border:rgb(27 31 36 / 70%);--btn-border-width:1px;--btn-border:rgb(27 31 36 / 42%);--btn-border-radius:8px;--btn-padding-x:1.09em;--btn-padding-y:.7em;--btn-font-weight:600;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--list-background:#fff;--list-border:#e4e7ec;--list-hover-background:#f2f4f7;--list-text:#1b1f24;--list-font-weight:400;--list-hover-text:#1b1f24;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-width:1px;--list-border:#333;--list-border-radius:10px;--list-padding:.8em 1.2em;--list-min-width:100%;--list-modal-shadow:rgb(0 0 0 / 12%) 0 4px 33px -3px,rgb(0 0 0 / 10%) 0 2px 8px -2px;--modal-text:#000;--modal-border-radius:0px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 14%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#fff;--modal-btn-hover-background:#eef4f6;--modal-btn-border:#d2d2d2;--modal-btn-border-width:1px;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-headline-text-transform:none;--input-border-radius:3px;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--checkmark-background:drop-shadow(0 0 3px #fff);--overlay-background:rgb(20 20 20 / 40%);--icon-hover-ms365-color:#ea3e23;--icon-hover-yahoo-color:#5f01d1}:host(.atcb-dark){--btn-background:transparent;--btn-hover-background:rgb(242 244 247 / 9%);--btn-hover-border:rgb(242 244 247 / 75%);--btn-border:rgb(242 244 247 / 45%);--btn-hover-text:#f2f4f7;--list-background:#24272c;--list-border:#373c43;--list-hover-background:#2f343b;--list-hover-text:#f2f4f7;--list-close-background:#121213;--list-close-text:#cacaca;--list-border:#373c43;--list-modal-shadow:rgb(0 0 0 / 14%) -1px 3px 33px 2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 16%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--checkmark-background:drop-shadow(0 0 3px #0a0a0a);--overlay-background:rgb(20 20 20 / 50%);--icon-ms365-color:#bebebe;--icon-hover-ms365-color:#bebebe;--icon-hover-yahoo-color:#bebebe;--icon-filter:grayscale(.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:var(--btn-border-width) solid var(--btn-border);border-radius:var(--btn-border-radius);color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:.13em;max-width:350px;padding:var(--btn-padding-y) var(--btn-padding-x);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button.atcb-no-text{min-width:0;border-radius:100%;display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button.atcb-active.atcb-no-text:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-no-text),.atcb-button.atcb-single.atcb-no-text:not([disabled]):focus,.atcb-button.atcb-single.atcb-no-text:not([disabled]):hover,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):focus,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):hover,.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);color:var(--btn-hover-text)}.atcb-button.atcb-dropup::after,.atcb-button:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{content:\"\";width:0;height:0;position:absolute;left:0;right:0;margin:0 auto}.atcb-button:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{top:100%;border:0 solid transparent;border-bottom:none;border-top-color:var(--btn-hover-border)}.atcb-button.atcb-dropup::after{bottom:100%;border:0 solid transparent;border-top:none;border-bottom-color:var(--btn-hover-border)}.atcb-button.atcb-active.atcb-dropup::after,.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{border-width:0}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:-15px;height:0}.atcb-list-wrapper{font-weight:var(--list-font-weight);z-index:14000090;width:auto}.atcb-list-wrapper:not(.atcb-dropup,.atcb-dropoverlay){animation:list-entrance-bottom .2s ease 0s 1 normal forwards}.atcb-list-wrapper.atcb-dropup{animation:list-entrance-top .2s ease 0s 1 normal forwards}.atcb-list-wrapper.atcb-dropoverlay{animation:list-entrance-center .2s ease 0s 1 normal forwards;z-index:15000000}@keyframes list-entrance-bottom{0%{opacity:0;transform:translateY(250px)}100%{opacity:1;transform:translateY(0)}}@keyframes list-entrance-top{0%{opacity:0;transform:translateY(-250px)}100%{opacity:1;transform:translateY(0)}}@keyframes list-entrance-center{0%{opacity:0;transform:scaleY(1)}1%{opacity:1;transform:scaleY(0)}100%{opacity:1;transform:scaleY(1)}}.atcb-list{background-color:var(--list-background);border:var(--list-border-width) solid var(--list-border);border-radius:var(--list-border-radius);min-width:var(--list-min-width)}.atcb-list-item{padding:var(--list-padding)}.atcb-list-item:last-child{border-radius:0 0 var(--list-border-radius) var(--list-border-radius)}.atcb-list-item:first-child{border-radius:var(--list-border-radius) var(--list-border-radius) 0 0}.atcb-list-item:only-child{border-radius:var(--list-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:var(--modal-btn-border-width) solid var(--modal-btn-border)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-checkmark,.atcb-button:focus .atcb-checkmark,.atcb-button:hover .atcb-checkmark{top:-.77em;right:-.37em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical,.atcb-icon.atcb-icon-trigger{padding-bottom:.05em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg,.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.atcb-list-item:focus-visible .atcb-icon.atcb-icon-ms365 svg,.atcb-list-item:hover .atcb-icon.atcb-icon-ms365 svg{fill:var(--icon-hover-ms365-color)}.atcb-list-item:focus-visible .atcb-icon.atcb-icon-yahoo svg,.atcb-list-item:hover .atcb-icon.atcb-icon-yahoo svg{fill:var(--icon-hover-yahoo-color)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-no-text) .atcb-icon.atcb-icon-ms365 svg,.atcb-button:not([disabled]):focus .atcb-icon.atcb-icon-ms365 svg,.atcb-button:not([disabled]):hover .atcb-icon.atcb-icon-ms365 svg{fill:var(--icon-hover-ms365-color)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-no-text) .atcb-icon.atcb-icon-yahoo svg,.atcb-button:not([disabled]):focus .atcb-icon.atcb-icon-yahoo svg,.atcb-button:not([disabled]):hover .atcb-icon.atcb-icon-yahoo svg{fill:var(--icon-hover-yahoo-color)}.atcb-button.atcb-active.atcb-no-text:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-icon.atcb-icon-ms365 svg,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):focus .atcb-icon.atcb-icon-ms365 svg,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):hover .atcb-icon.atcb-icon-ms365 svg{fill:var(--icon-hover-ms365-color)}.atcb-button.atcb-active.atcb-no-text:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-icon.atcb-icon-yahoo svg,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):focus .atcb-icon.atcb-icon-yahoo svg,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):hover .atcb-icon.atcb-icon-yahoo svg{fill:var(--icon-hover-yahoo-color)}.atcb-button.atcb-single.atcb-no-text:not([disabled]):focus .atcb-icon.atcb-icon-ms365 svg,.atcb-button.atcb-single.atcb-no-text:not([disabled]):hover .atcb-icon.atcb-icon-ms365 svg{fill:var(--icon-hover-ms365-color)}.atcb-button.atcb-single.atcb-no-text:not([disabled]):focus .atcb-icon.atcb-icon-yahoo svg,.atcb-button.atcb-single.atcb-no-text:not([disabled]):hover .atcb-icon.atcb-icon-yahoo svg{fill:var(--icon-hover-yahoo-color)}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:var(--modal-btn-border-width) solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:var(--modal-btn-border-width) solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:var(--modal-btn-border-width) solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:1px solid var(--modal-btn-text);border-radius:var(--input-border-radius);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:var(--modal-btn-border-width) solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}",
	"3d": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-background:#fff;--btn-edge:#c9ced6;--btn-hover-background:#f7f8fa;--btn-hover-border:#bfc5cd;--btn-border:#d7dbe0;--btn-border-radius:10px;--btn-padding-x:1.09em;--btn-padding-y:.7em;--btn-font-weight:600;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--btn-shadow:0 .22em 0 var(--btn-edge),rgb(16 24 40 / 12%) 0 .35em .65em;--btn-hover-shadow:0 .35em 0 var(--btn-edge),rgb(16 24 40 / 16%) 0 .6em 1em -.1em;--btn-active-shadow:0 .06em 0 var(--btn-edge);--btn-active-shadow-up:0 -.06em 0 var(--btn-edge);--list-background:#fff;--list-border-color:#e4e7ec;--list-hover-background:#f2f4f7;--list-text:#1b1f24;--list-hover-text:#1b1f24;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-radius:10px;--list-padding:.8em;--list-shadow:0 .22em 0 var(--btn-edge),rgb(16 24 40 / 30%) 0 .75em 2em -.5em;--list-modal-shadow:rgb(0 0 0 / 18%) 0 4px 34px -3px,rgb(0 0 0 / 14%) 0 2px 12px -2px;--modal-text:#000;--modal-border-radius:6px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-border:#d2d2d2;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(0 0 0 / 08%) 0 4px 14px -2px,rgb(0 0 0 / 08%) 0 2px 6px -1px;--modal-btn-hover-shadow:rgb(0 0 0 / 14%) 0 5px 17px -2px,rgb(0 0 0 / 12%) 0 3px 8px -2px;--modal-headline-text-transform:none;--input-border-radius:6px;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--date-btn-shadow:rgb(0 0 0 / 08%) 0 4px 14px -2px,rgb(0 0 0 / 12%) 0 2px 6px -1px;--date-btn-hover-shadow:rgb(0 0 0 / 14%) 0 5px 16px -2px,rgb(0 0 0 / 14%) 0 3px 8px -2px;--checkmark-background:drop-shadow(0 0 4px #fff);--overlay-background:rgb(20 20 20 / 25%)}:host(.atcb-dark){--btn-background:#24272c;--btn-edge:#14161a;--btn-hover-background:#2b2f35;--btn-hover-border:#4a5058;--btn-border:#3b4046;--btn-hover-text:#f2f4f7;--btn-shadow:0 .22em 0 var(--btn-edge),rgb(0 0 0 / 45%) 0 .35em .65em;--btn-hover-shadow:0 .35em 0 var(--btn-edge),rgb(0 0 0 / 55%) 0 .6em 1em -.1em;--btn-active-shadow:0 .06em 0 var(--btn-edge);--btn-active-shadow-up:0 -.06em 0 var(--btn-edge);--list-background:#24272c;--list-border-color:#373c43;--list-hover-background:#2f343b;--list-hover-text:#f2f4f7;--list-close-background:#282828;--list-close-text:#777;--list-shadow:0 .22em 0 var(--btn-edge),rgb(0 0 0 / 65%) 0 .75em 2em -.5em;--list-modal-shadow:rgb(0 0 0 / 18%) -1px 3px 34px 2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--modal-btn-shadow:rgb(255 255 255 / 3%) -2px -2px 14px,rgb(0 0 0 / 10%) 3px 3px 14px -2px,rgb(0 0 0 / 12%) 1px 2px 10px -1px;--modal-btn-hover-shadow:none;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--date-btn-shadow:rgb(0 0 0 / 10%) 0 0 24px -2px,rgb(0 0 0 / 12%) 1px 2px 8px -1px;--date-btn-hover-shadow:none;--checkmark-background:drop-shadow(0 0 4px #0a0a0a);--overlay-background:rgb(20 20 20 / 60%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:1px solid var(--btn-border);border-radius:var(--btn-border-radius);box-shadow:var(--btn-shadow);box-sizing:content-box;color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:0;max-width:300px;padding:var(--btn-padding-y) var(--btn-padding-x);touch-action:manipulation;transform:translate3d(0,0,-12px);user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button:not(.atcb-no-text,.atcb-modal-style,.atcb-dropoverlay,.atcb-single){min-width:calc(11.6em - 2 * var(--btn-padding-x))}.atcb-button.atcb-no-text{display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-hover-shadow);color:var(--btn-hover-text);transform:translate3d(0,0,-12px) translateY(-.15em);transition:transform .1s linear,box-shadow .1s linear}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay){background-color:var(--btn-hover-background);border-color:var(--btn-hover-border)}.atcb-button.atcb-single:not([disabled]):focus,.atcb-button.atcb-single:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-hover-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay){box-shadow:var(--btn-hover-shadow);transform:translate3d(0,0,-12px) translateY(-.15em);transition:transform .1s linear,box-shadow .1s linear}.atcb-button:not([disabled],.atcb-active):active{box-shadow:var(--btn-active-shadow);transform:translate3d(0,0,-12px) translateY(.16em);transition:transform 60ms linear,box-shadow 60ms linear}@media (prefers-reduced-motion:reduce){.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button:not([disabled]):active,.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{transform:translate3d(0,0,-12px);transition:none}.atcb-list-wrapper.atcb-dropdown:not(.atcb-dropup,.atcb-dropoverlay),.atcb-list-wrapper.atcb-dropoverlay,.atcb-list-wrapper.atcb-dropup:not(.atcb-dropoverlay){animation:none;opacity:1}}.atcb-button.atcb-active.atcb-dropoverlay{transform:translate3d(0,0,0)}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:6px;height:1px}.atcb-list-wrapper{padding:0;transform:translate3d(0,0,0);z-index:14000090}.atcb-list{background-color:var(--list-background);border:1px solid var(--list-border-color);border-radius:var(--list-border-radius);box-shadow:var(--list-shadow);min-width:100%;padding:.3em}.atcb-list-wrapper.atcb-dropdown:not(.atcb-dropup,.atcb-dropoverlay) .atcb-list{margin-top:1.1em}.atcb-list-wrapper.atcb-dropup .atcb-list{margin-bottom:1.1em}.atcb-list-wrapper.atcb-dropoverlay{transform:translate3d(0,0,2px);z-index:15000000}.atcb-list-item{background-color:transparent;border-radius:8px;padding:var(--list-padding)}.atcb-dropoverlay .atcb-list,.atcb-list.atcb-modal{border-radius:var(--list-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:1px solid var(--modal-btn-border)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-trigger{padding-bottom:.05em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:1px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:1px solid var(--modal-btn-text);border-radius:var(--input-border-radius);box-shadow:var(--btn-shadow);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);box-shadow:var(--btn-hover-shadow);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{box-shadow:var(--btn-hover-shadow);opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}",
	"flat": ":host{--wrapper-padding:0px;--buttonslist-gap:8px;--btn-background:#fff;--btn-hover-background:#f2f4f7;--btn-hover-border:#1b1f24;--btn-border:#1b1f24;--btn-padding-x:1.09em;--btn-padding-y:.7em;--btn-shadow:#1b1f24;--btn-font-weight:600;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--list-background:#fff;--list-hover-background:#f2f4f7;--list-border:#1b1f24;--list-text:#1b1f24;--list-font-weight:400;--list-hover-text:#1b1f24;--list-close-background:#545454;--list-close-text:#b0b0b0;--list-close-text-hover:#777;--list-padding:.8em;--modal-text:#000;--modal-btn-bar:#bababa;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-border:#545454;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#676767;--modal-headline-text-transform:none;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--overlay-background:rgb(20 20 20 / 40%)}:host(.atcb-dark){--btn-background:#24272c;--btn-hover-background:#2b2f35;--btn-hover-border:#fff;--btn-border:#e6e9ef;--btn-shadow:#e6e9ef;--btn-hover-text:#f2f4f7;--list-background:#24272c;--list-hover-background:#2f343b;--list-border:#e6e9ef;--list-hover-text:#f2f4f7;--list-close-background:#111;--list-close-text:#777;--list-close-text-hover:#f1f1f1;--modal-btn-bar:#313131;--modal-btn-border:#434246;--date-btn-cal-month-text:#414141;--date-btn-background:#24272c;--overlay-background:rgb(20 20 20 / 75%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(0.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:2px solid var(--btn-border);box-sizing:content-box;color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:0;max-width:300px;padding:var(--btn-padding-y) var(--btn-padding-x);top:-.18em;left:-.18em;box-shadow:.18em .18em 0 0 var(--btn-shadow);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button:not(.atcb-no-text,.atcb-modal-style,.atcb-dropoverlay,.atcb-single){min-width:calc(11.6em - 2 * var(--btn-padding-x))}.atcb-button.atcb-no-text{display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button.atcb-click:not([disabled]){top:0;left:0;box-shadow:0 0 0 0 var(--btn-shadow)}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);top:-.24em;left:-.24em;box-shadow:.24em .24em 0 0 var(--btn-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button.atcb-single:not([disabled]):focus,.atcb-button.atcb-single:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);top:-.18em;left:-.18em;box-shadow:.18em .18em 0 0 var(--btn-shadow);color:var(--btn-hover-text)}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:0;height:0}.atcb-list-wrapper{font-weight:var(--list-font-weight);padding:0;z-index:16000090}.atcb-list-wrapper.atcb-no-text.atcb-dropdown{padding:0}.atcb-list-wrapper.atcb-dropoverlay{z-index:15000000}.atcb-list{background:var(--list-background);border:2px solid var(--list-border);box-shadow:.3em .3em 0 0 var(--btn-shadow);min-width:100%}.atcb-list-wrapper.atcb-dropdown:not(.atcb-dropup,.atcb-dropoverlay) .atcb-list{margin-top:.7em}.atcb-list-wrapper.atcb-dropup .atcb-list{margin-bottom:.7em}.atcb-list-item{background-color:transparent;border-radius:0;padding:var(--list-padding)}.atcb-list-item .atcb-icon{height:1.15em;width:1.15em}.atcb-modal-box{border:2px solid var(--btn-border);background-color:var(--modal-background)}a.atcb-modal-btn,button.atcb-modal-btn{border:2px solid var(--btn-border);font-size:.9em;margin:.625em;top:-.18em;left:-.18em;box-shadow:.18em .18em 0 0 var(--btn-shadow)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{top:-.24em;left:-.24em;box-shadow:.24em .24em 0 0 var(--btn-shadow)}a.atcb-modal-btn:not([disabled]):active,button.atcb-modal-btn:not([disabled]):active{top:0;left:0;box-shadow:0 0 0 0 var(--btn-shadow)}.atcb-subevent-btn{border:2px solid var(--btn-border);display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;background-color:var(--date-btn-background);padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;top:0;left:0;box-shadow:0 0 0 0 var(--btn-shadow)}.atcb-subevent-btn:hover{align-items:center;top:-3px;left:-3px;box-shadow:3px 3px 0 0 var(--btn-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-saved .atcb-checkmark{top:-2.1em;right:-2em;height:1.5em}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{background-color:transparent;border:0;filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:2px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:2px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:2px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:2px solid var(--modal-btn-text);border-radius:var(--input-border-radius);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);color:var(--status-active-text);opacity:1;transform:scale(1.1)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);font-size:.8em;padding-top:1em}.pro-form-fine{padding:.5em .5em 1em}.pro-waiting{border:.2em solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-5px}",
	"round": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-background:#fff;--btn-hover-background:#f7f8fa;--btn-hover-border:#bfc5cd;--btn-border:#d7dbe0;--btn-border-radius:500px;--btn-padding-x:1.34em;--btn-padding-y:.7em;--btn-font-weight:600;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--btn-shadow:rgb(16 24 40 / 18%) 0 1px 2px;--btn-hover-shadow:rgb(16 24 40 / 22%) 0 4px 10px;--btn-active-shadow:rgb(16 24 40 / 25%) 0 5px 12px;--list-background:#fff;--list-hover-background:#f2f4f7;--list-text:#1b1f24;--list-font-weight:400;--list-hover-text:#1b1f24;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-radius:14px;--list-padding:.7em 1.1em;--list-min-width:100%;--list-shadow:rgb(16 24 40 / 25%) 0 12px 32px -8px,rgb(16 24 40 / 8%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) 0 4px 34px -3px,rgb(0 0 0 / 14%) 0 2px 12px -2px;--modal-text:#000;--modal-border-radius:9px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-border:#d2d2d2;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(0 0 0 / 08%) 2px 3px 14px -3px,rgb(0 0 0 / 12%) 1px 1px 12px -4px;--modal-btn-hover-shadow:rgb(0 0 0 / 18%) 3px 5px 18px -2px,rgb(0 0 0 / 14%) 2px 4px 28px -6px;--modal-headline-text-transform:none;--input-border-radius:6px;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--date-btn-shadow:rgb(0 0 0 / 08%) 0 4px 14px -2px,rgb(0 0 0 / 12%) 0 2px 6px -1px;--date-btn-hover-shadow:rgb(0 0 0 / 14%) 0 5px 16px -2px,rgb(0 0 0 / 14%) 0 3px 8px -2px;--checkmark-background:drop-shadow(0 0 4px #fff);--overlay-background:rgb(20 20 20 / 25%)}:host(.atcb-dark){--btn-background:#24272c;--btn-hover-background:#2b2f35;--btn-hover-border:#4a5058;--btn-border:#3b4046;--btn-hover-text:#f2f4f7;--btn-shadow:rgb(0 0 0 / 40%) 0 1px 2px;--btn-hover-shadow:rgb(0 0 0 / 50%) 0 4px 10px;--btn-active-shadow:rgb(0 0 0 / 55%) 0 5px 12px;--list-background:#24272c;--list-hover-background:#2f343b;--list-hover-text:#f2f4f7;--list-close-background:#282828;--list-close-text:#777;--list-shadow:rgb(0 0 0 / 60%) 0 12px 32px -8px,rgb(0 0 0 / 30%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) -1px 3px 34px 2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 30%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--modal-btn-shadow:rgb(255 255 255 / 3%) -2px -2px 14px,rgb(0 0 0 / 10%) 3px 3px 14px -2px,rgb(0 0 0 / 12%) 1px 2px 10px -1px;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--date-btn-shadow:rgb(0 0 0 / 10%) 0 0 24px -2px,rgb(0 0 0 / 12%) 1px 2px 8px -1px;--checkmark-background:drop-shadow(0 0 4px #0a0a0a);--overlay-background:rgb(20 20 20 / 60%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:1px solid var(--btn-border);border-radius:var(--btn-border-radius);box-shadow:var(--btn-shadow);color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:0;max-width:350px;padding:var(--btn-padding-y) var(--btn-padding-x);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button.atcb-no-text{min-width:0;border-radius:100%;display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-hover-shadow);color:var(--btn-hover-text)}.atcb-button:not([disabled]).atcb-no-text.atcb-active,.atcb-button:not([disabled]).atcb-no-text:focus,.atcb-button:not([disabled]).atcb-no-text:hover{height:3.26em;margin:-.13em;width:3.26em;padding:0}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-no-text),.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):focus,.atcb-button.atcb-single:not(.atcb-no-text,[disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-active-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-active.atcb-no-text:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button.atcb-single.atcb-no-text:not([disabled]):focus,.atcb-button.atcb-single.atcb-no-text:not([disabled]):hover{background-color:var(--btn-hover-background);border-color:var(--btn-hover-border);box-shadow:var(--btn-active-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-dropup::after,.atcb-button:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{content:\"\";width:0;height:0;position:absolute;left:0;right:0;margin:0 auto}.atcb-button:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{top:100%;border:0 solid transparent;border-bottom:none;border-top-color:var(--btn-hover-border)}.atcb-button.atcb-dropup::after{bottom:100%;border:0 solid transparent;border-top:none;border-bottom-color:var(--btn-hover-border)}.atcb-button.atcb-active.atcb-dropup::after,.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{border-width:0}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:-15px;height:0}.atcb-list-wrapper{font-weight:var(--list-font-weight);z-index:14000090;width:auto}.atcb-list-wrapper:not(.atcb-dropup,.atcb-dropoverlay){animation:list-entrance-bottom .2s ease 0s 1 normal forwards}.atcb-list-wrapper.atcb-dropup{animation:list-entrance-top .2s ease 0s 1 normal forwards}.atcb-list-wrapper.atcb-dropoverlay{animation:list-entrance-center .2s ease 0s 1 normal forwards;z-index:15000000}@keyframes list-entrance-bottom{0%{opacity:0;transform:translateY(250px)}100%{opacity:1;transform:translateY(0)}}@keyframes list-entrance-top{0%{opacity:0;transform:translateY(-250px)}100%{opacity:1;transform:translateY(0)}}@keyframes list-entrance-center{0%{opacity:0;transform:scaleY(1)}1%{opacity:1;transform:scaleY(0)}100%{opacity:1;transform:scaleY(1)}}.atcb-list{background-color:var(--list-background);border-radius:var(--list-border-radius);box-shadow:var(--list-shadow);min-width:var(--list-min-width)}.atcb-list-item{padding:var(--list-padding)}.atcb-list-item:last-child{border-radius:0 0 var(--list-border-radius) var(--list-border-radius)}.atcb-list-item:first-child{border-radius:var(--list-border-radius) var(--list-border-radius) 0 0}.atcb-list-item:only-child{border-radius:var(--list-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:1px solid var(--modal-btn-border)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-checkmark,.atcb-button:focus .atcb-checkmark,.atcb-button:hover .atcb-checkmark{top:-.77em;right:-.37em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-trigger{padding-bottom:.05em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:1px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:1px solid var(--modal-btn-text);border-radius:var(--input-border-radius);box-shadow:var(--btn-shadow);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);box-shadow:var(--btn-hover-shadow);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{box-shadow:var(--btn-hover-shadow);opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}",
	"neumorphism": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-background:#e8ebf1;--btn-hover-background:#eceff4;--btn-font-weight:600;--btn-text:#3a4150;--btn-hover-text:#3a4150;--btn-border-radius:14px;--btn-padding-x:1.2em;--btn-padding-y:1em;--btn-shadow:#c6cbd5 .3em .3em .6em,#fff -.3em -.3em .6em;--btn-hover-shadow:#c2c7d2 .38em .38em .75em,#fff -.38em -.38em .75em;--btn-active-shadow:inset #c6cbd5 .22em .22em .5em,inset #fff -.22em -.22em .5em;--neu-item-pop:#c6cbd5 .22em .22em .45em,#fff -.22em -.22em .45em;--neu-item-inset:inset #c6cbd5 .18em .18em .4em,inset #fff -.18em -.18em .4em;--list-background:#e8ebf1;--list-hover-background:#e8ebf1;--list-text:#3a4150;--list-font-weight:400;--list-hover-text:#3a4150;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-radius:14px;--list-padding:.85em 1em;--list-min-width:100%;--list-shadow:#c2c7d2 .5em .5em 1.1em,#fff -.5em -.5em 1.1em;--modal-text:#111;--modal-border-radius:9px;--modal-shadow:drop-shadow(5px 8px 30px rgb(0 0 0 / 70%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-hover-text:#222;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(40 40 40 / 15%) 0.2em 0.2em 0.4em,rgb(255 255 255 / 30%) -0.1em -0.1em 0.3em;--modal-btn-hover-shadow:rgb(40 40 40 / 40%) 0.4em 0.4em 0.7em,rgb(255 255 255 / 70%) -0.2em -0.2em 0.5em;--modal-headline-text-transform:none;--input-border-radius:6px;--date-btn-text-secondary:#667085;--date-btn-background:#e8ebf1;--date-btn-shadow:rgb(0 0 0 / 10%) 0 4px 10px -2px,rgb(0 0 0 / 15%) 0 2px 3px -1px;--date-btn-hover-shadow:rgb(0 0 0 / 20%) 0 5px 12px -2px,rgb(0 0 0 / 20%) 0 3px 4px -2px;--checkmark-background:drop-shadow(0 0 3px #fff);--overlay-background:#dcdcdc}:host(.atcb-dark){--btn-background:#2b2f36;--btn-text:#e6e9ef;--btn-hover-background:#2e323a;--btn-hover-text:#e6e9ef;--btn-shadow:#1f2228 .3em .3em .6em,#373c45 -.3em -.3em .6em;--btn-hover-shadow:#1c1f24 .38em .38em .75em,#3a3f49 -.38em -.38em .75em;--btn-active-shadow:inset #1f2228 .22em .22em .5em,inset #373c45 -.22em -.22em .5em;--neu-item-pop:#1c1f24 .22em .22em .45em,#3a3f49 -.22em -.22em .45em;--neu-item-inset:inset #1f2228 .18em .18em .4em,inset #373c45 -.18em -.18em .4em;--list-background:#2b2f36;--list-text:#e6e9ef;--list-hover-background:#2b2f36;--list-hover-text:#e6e9ef;--list-close-background:#282828;--list-close-text:#777;--list-shadow:#1c1f24 .5em .5em 1.1em,#3a3f49 -.5em -.5em 1.1em;--modal-shadow:drop-shadow(5px 8px 35px rgb(0 0 0 / 90%));--modal-btn-bar:#38383a;--modal-btn-shadow:rgb(0 0 0 / 60%) 0.2em 0.2em 0.6em,rgb(230 230 230 / 15%) -0.1em -0.1em 0.4em;--modal-btn-hover-shadow:rgb(0 0 0 / 80%) 0.3em 0.3em 0.8em,rgb(230 230 230 / 15%) -0.1em -0.1em 0.6em;--date-btn-cal-month-text:#4a5058;--date-btn-background:#2b2f36;--date-btn-shadow:rgb(0 0 0 / 70%) 0.2em 0.2em 0.8em,rgb(230 230 230 / 15%) -0.1em -0.1em 0.5em;--date-btn-hover-shadow:rgb(0 0 0) 0.3em 0.4em 1em,rgb(230 230 230 / 15%) -0.2em -0.2em 0.8em;--checkmark-background:drop-shadow(0 0 3px #0a0a0a);--overlay-background:#141414;--icon-ms365-color:#ea3e23;--icon-filter:grayscale(0.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{align-items:center;background-color:var(--btn-background);border:0;border-radius:var(--btn-border-radius);box-shadow:var(--btn-shadow);color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.5em;margin:0;max-width:350px;padding:var(--btn-padding-y) var(--btn-padding-x);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto;transition:box-shadow .1s ease-in-out,background-color .1s ease-in-out}.atcb-button.atcb-no-text{min-width:0;border-radius:100%;display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);box-shadow:var(--btn-hover-shadow);color:var(--btn-hover-text)}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay),.atcb-button.atcb-single:not([disabled]):focus,.atcb-button.atcb-single:not([disabled]):hover{background-color:var(--btn-hover-background);box-shadow:var(--btn-active-shadow);color:var(--btn-hover-text)}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:-15px;height:0}.atcb-list-wrapper{font-weight:var(--list-font-weight);width:auto;animation:list-entrance .6s ease 0s 1 normal forwards;z-index:15000000}@keyframes list-entrance{0%{opacity:0}100%{opacity:1}}.atcb-list{background-color:var(--list-background);border-radius:var(--list-border-radius);box-shadow:var(--list-shadow);min-width:var(--list-min-width);padding:.55em}.atcb-list-item{border-radius:10px;box-shadow:none;padding:var(--list-padding);transition:box-shadow .15s ease-in-out}.atcb-list-item:hover{box-shadow:var(--neu-item-pop);border-radius:10px;position:relative;z-index:15000010}.atcb-list-item:active{box-shadow:var(--neu-item-inset);border-radius:10px}.atcb-list-item:focus-visible{outline:2px solid var(--accent-color);outline-offset:-2px;border-radius:10px;position:relative;z-index:15000010}.atcb-modal-box{animation:list-entrance .6s ease 0s 1 normal forwards;filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em .8em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay) .atcb-checkmark,.atcb-button.atcb-single:focus .atcb-checkmark,.atcb-button.atcb-single:hover .atcb-checkmark{top:-.77em;right:-.37em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .1s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-trigger{padding-bottom:.05em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border);box-shadow:var(--btn-shadow)}.pro-field input:not([disabled],[type=checkbox],[type=radio]):hover{box-shadow:var(--btn-active-shadow)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{box-shadow:var(--btn-active-shadow)}.pro-field input[type=email]:focus-visible,.pro-field input[type=number]:focus-visible,.pro-field input[type=text]:focus-visible{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:1px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;background-color:var(--input-background);border-radius:var(--input-border-radius);box-shadow:var(--btn-shadow);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{color:var(--form-success)}#rsvp-status-group label.status-declined{color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);box-shadow:var(--btn-hover-shadow);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{box-shadow:var(--btn-hover-shadow);opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}#pro-form-submit{background-color:var(--btn-hover-background)}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}",
	"text": ":host{--wrapper-padding:0px;--buttonslist-gap:5px;--btn-underline:transparent;--btn-border:#a8a8a8;--btn-padding-x:.7em;--btn-padding-y:.55em;--btn-background:rgb(47 111 237 / 16%);--btn-hover-background:rgb(47 111 237 / 9%);--btn-font-weight:600;--btn-text:#2456c4;--btn-hover-text:#2456c4;--btn-hover-shadow:none;--btn-text-shadow:transparent;--list-background:#fff;--list-hover-background:rgb(47 111 237 / 9%);--list-text:#2456c4;--list-font-weight:400;--list-hover-text:#2456c4;--list-close-background:#e5e5e5;--list-close-text:#777;--list-border-radius:9px;--list-padding:.7em 1em;--list-min-width:100%;--list-shadow:rgb(16 24 40 / 20%) 0 .5em 1.6em -.3em;--list-modal-shadow:rgb(0 0 0 / 18%) 0 4px 33px -3px,rgb(0 0 0 / 14%) 0 2px 8px -2px;--modal-text:#000;--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-border-radius:9px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 16%));--modal-btn-hover-background:#fff;--modal-btn-border:#d2d2d2;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(0 0 0 / 8%) 0 4px 14px -2px,rgb(0 0 0 / 10%) 0 2px 3px -1px;--modal-btn-hover-shadow:rgb(0 0 0 / 12%) 0 5px 17px -2px,rgb(0 0 0 / 12%) 0 3px 5px -2px;--modal-headline-text-transform:none;--input-border-radius:6px;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--date-btn-shadow:rgb(0 0 0 / 8%) 0 4px 14px -2px,rgb(0 0 0 / 10%) 0 2px 3px -1px;--date-btn-hover-shadow:rgb(0 0 0 / 10%) 0 5px 16px -2px,rgb(0 0 0 / 10%) 0 3px 4px -2px;--checkmark-background:drop-shadow(0 0 3px #fff);--overlay-background:rgb(200 200 200 / 25%)}:host(.atcb-dark){--btn-underline:transparent;--btn-border:#888;--btn-background:rgb(122 176 255 / 22%);--btn-hover-background:rgb(122 176 255 / 13%);--btn-text:#8ab6ff;--btn-hover-text:#8ab6ff;--btn-text-shadow:transparent;--list-background:#24272c;--list-text:#8ab6ff;--list-hover-background:rgb(122 176 255 / 13%);--list-hover-text:#8ab6ff;--list-close-background:#282828;--list-close-text:#777;--list-shadow:rgb(255 255 255 / 5%) -12px -5px 23px -8px,rgb(255 255 255 / 6%) -7px -5px 18px -3px,rgb(0 0 0 / 16%) 2px 5px 21px -1px,rgb(0 0 0 / 14%) 3px 3px 23px -3px;--list-modal-shadow:rgb(255 255 255 / 8%) -12px -5px 33px -8px,rgb(255 255 255 / 8%) -7px -5px 18px -3px,rgb(0 0 0 / 16%) 4px 6px 53px -4px,rgb(0 0 0 / 18%) 8px 12px 43px -2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 18%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--modal-btn-shadow:rgb(255 255 255 / 5%) -2px -2px 10px,rgb(0 0 0 / 14%) 3px 3px 14px -2px,rgb(0 0 0 / 14%) 1px 2px 5px -1px;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--date-btn-shadow:rgb(0 0 0 / 16%) 0 0 23px -2px,rgb(0 0 0 / 14%) 1px 2px 3px -1px;--checkmark-background:drop-shadow(0 0 3px #0a0a0a);--overlay-background:rgb(20 20 20 / 60%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(0.2)}.atcb-initialized.atcb-buttons-list{gap:var(--buttonslist-gap)}.atcb-button{background-color:transparent;border:0;border-radius:0;transition:background-size .1s ease-in,border-radius .2s ease-in,box-shadow .1s ease-in;align-items:center;color:var(--btn-text);cursor:pointer;display:flex;font-family:var(--font);font-size:1em;font-weight:var(--btn-font-weight);justify-content:center;line-height:1.2em;margin:0 .2em;padding:var(--btn-padding-y) var(--btn-padding-x);text-align:left;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;width:auto}.atcb-button.atcb-no-text{min-width:0;display:flex;place-content:center center;align-items:center;height:3em;width:3em;padding:0}.atcb-button:focus-visible{outline:2px solid var(--accent-color);outline-offset:.15em}.atcb-button:not([disabled]):focus,.atcb-button:not([disabled]):hover{background-color:var(--btn-hover-background);color:var(--btn-hover-text);border-radius:6px}.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay){background-color:var(--btn-background);border-radius:6px;color:var(--btn-text)}.atcb-button.atcb-single:not([disabled]):focus,.atcb-button.atcb-single:not([disabled]):hover{background-color:var(--btn-background);border-radius:6px;color:var(--btn-text)}.atcb-button.atcb-dropup::after,.atcb-button:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{content:\"\";width:0;height:0;position:absolute;left:0;right:0;margin:0 auto}.atcb-button:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{top:100%;border:0 solid transparent;border-bottom:none;border-top-color:var(--btn-background)}.atcb-button.atcb-dropup::after{bottom:100%;border:0 solid transparent;border-top:none;border-bottom-color:var(--btn-background)}.atcb-button.atcb-active.atcb-dropup::after,.atcb-button.atcb-active:not(.atcb-modal-style,.atcb-dropoverlay,.atcb-dropup)::before{border-width:0}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:-15px;height:0}.atcb-list-wrapper{font-weight:var(--list-font-weight);z-index:14000090;width:auto}.atcb-list-wrapper:not(.atcb-dropup,.atcb-dropoverlay){animation:list-entrance-bottom .2s ease 0s 1 normal forwards}.atcb-list-wrapper.atcb-dropup{animation:list-entrance-top .2s ease 0s 1 normal forwards}.atcb-list-wrapper.atcb-dropoverlay{animation:list-entrance-center .2s ease 0s 1 normal forwards;z-index:15000000}@keyframes list-entrance-bottom{0%{opacity:0;transform:translateY(250px)}100%{opacity:1;transform:translateY(0)}}@keyframes list-entrance-top{0%{opacity:0;transform:translateY(-250px)}100%{opacity:1;transform:translateY(0)}}@keyframes list-entrance-center{0%{opacity:0;transform:scaleY(1)}1%{opacity:1;transform:scaleY(0)}100%{opacity:1;transform:scaleY(1)}}.atcb-list{background-color:var(--list-background);border-radius:var(--list-border-radius);box-shadow:var(--list-shadow);min-width:var(--list-min-width)}.atcb-list-item{padding:var(--list-padding)}.atcb-list-item:last-child{border-radius:0 0 var(--list-border-radius) var(--list-border-radius)}.atcb-list-item:first-child{border-radius:var(--list-border-radius) var(--list-border-radius) 0 0}.atcb-list-item:only-child{border-radius:var(--list-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-list-item .atcb-icon{height:1.15em;width:1.15em}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:21px;box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:1px solid var(--modal-btn-border)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:0;border-radius:7px 4px 4px 7px;padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-date-btn-left{border-radius:4px 0 0 4px}.atcb-rtl .atcb-date-btn-left{border-radius:0 4px 4px 0}.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.8}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.5em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-rsvp{height:1.5em;width:1.5em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.rsvp-inline-wrapper{filter:none;min-width:100%;margin-bottom:0}.atcb-modal-content.no-headline{padding-top:1.8em}.rsvp-inline-wrapper .atcb-modal-content,.rsvp-inline-wrapper .atcb-modal-headline,.rsvp-inline-wrapper.atcb-modal-box{background-color:transparent;border-radius:0;box-sizing:border-box;padding:0;width:100%}.rsvp-inline-wrapper.atcb-modal-box{padding:.2em .2em 1.5em}.rsvp-inline-wrapper .atcb-modal-headline{padding-bottom:1.5em}.pro #rsvp-atcb{display:flex;flex-wrap:wrap;gap:.4em;justify-content:center}.pro-form:not(.no-intro){border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-form.no-intro:not(.no-headline){padding-top:.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#rsvp-status-group{border-bottom:1px solid var(--modal-btn-border);font-weight:700;margin-bottom:1.5em;padding-bottom:2em;text-align:center}#rsvp-status-group .pro-field{align-items:center;display:flex;flex-wrap:wrap;gap:3%;justify-content:center;margin-top:1em}@media (width <= 575px){#rsvp-status-group .pro-field{flex-direction:column;gap:1.2em}#rsvp-status-group .pro-field div{width:80%}}#rsvp-status-group .pro-field div{min-width:28%;position:relative}#rsvp-status-group input{opacity:0;position:absolute;top:0;left:0;height:100%;width:100%;margin:0;cursor:pointer}#rsvp-status-group label{align-items:center;border:1px solid var(--modal-btn-text);border-radius:var(--input-border-radius);color:var(--modal-btn-text);display:flex;flex-direction:column;font-weight:700;text-transform:uppercase;justify-content:center;opacity:.6;padding:.8em;transition:all .1s ease-in-out;width:100%}#rsvp-status-group label.status-confirmed{border-color:var(--form-success);color:var(--form-success)}#rsvp-status-group label.status-declined{border-color:var(--form-error);color:var(--form-error)}#rsvp-status-group input:checked+label{background-color:var(--modal-text);box-shadow:var(--btn-hover-shadow);color:var(--status-active-text);opacity:1;transform:scale(1.08)}#rsvp-status-group input:focus-visible+label{outline:2px solid var(--accent-color);outline-offset:2px}#rsvp-status-group input:not([disabled])+label:hover,#rsvp-status-group input:not([disabled]):hover+label{box-shadow:var(--btn-hover-shadow);opacity:1;transform:scale(1.08)}#rsvp-status-group input:checked+label.status-confirmed{background-color:var(--form-success)}#rsvp-status-group input:checked+label.status-declined{background-color:var(--form-error)}#rsvp-success-msg,#rsvp-success-msg-demo,#rsvp-success-msg-doi,#rsvp-success-msg-email,#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding-top:.5em;text-align:center}#rsvp-success-msg,#rsvp-success-msg-demo,#ty-success-msg{padding:1.5em 0}#rsvp-success-msg-demo,#rsvp-success-msg-email{color:var(--form-success)}#rsvp-success-msg-doi{color:var(--form-error);padding-top:1em;font-size:.8em}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}.pro #rsvp-sent-content{align-items:center;display:flex;flex-direction:column;gap:1.5em}#rsvp-status-group span{color:inherit}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}",
	"date": ":host{display:inline-block;max-width:min(19em,100%);--wrapper-padding:0px;--buttonslist-gap:5px;--btn-border-radius:11px;--date-btn-border:#d7dbe0;--date-btn-hover-border:#bfc5cd;--btn-text:#1b1f24;--btn-hover-text:#1b1f24;--btn-shadow:rgb(16 24 40 / 9%) 0 1px 3px;--btn-hover-shadow:rgb(16 24 40 / 15%) 0 .4em 1em;--list-background:#fff;--list-border-color:#e4e7ec;--list-hover-background:#f2f4f7;--list-text:#1b1f24;--list-font-weight:400;--list-hover-text:#1b1f24;--list-close-background:#e5e5e5;--list-close-text:#777;--list-shadow:rgb(16 24 40 / 25%) 0 12px 32px -8px,rgb(16 24 40 / 8%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 18%) 0 4px 33px -3px,rgb(0 0 0 / 14%) 0 2px 8px -2px;--modal-text:#000;--modal-border-radius:var(--btn-border-radius);--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 16%));--modal-btn-bar:#c6c8cd;--modal-btn-background:#f5f5f5;--modal-btn-hover-background:#fff;--modal-btn-border:#d2d2d2;--modal-btn-hover-text:#161616;--modal-btn-secondary-text:#666567;--modal-btn-shadow:rgb(0 0 0 / 8%) 0 4px 14px -2px,rgb(0 0 0 / 8%) 0 2px 3px -1px;--modal-btn-hover-shadow:rgb(0 0 0 / 12%) 0 5px 17px -2px,rgb(0 0 0 / 10%) 0 3px 5px -2px;--modal-headline-text-transform:none;--input-border-radius:3px;--date-btn-text-secondary:#667085;--date-btn-background:#fff;--date-btn-shadow:rgb(16 24 40 / 9%) 0 1px 3px;--date-btn-hover-shadow:rgb(16 24 40 / 15%) 0 .4em 1em;--checkmark-background:drop-shadow(0 0 3px #fff);--overlay-background:rgb(20 20 20 / 25%)}:host(.atcb-dark){--btn-hover-text:#f2f4f7;--date-btn-border:#3b4046;--date-btn-hover-border:#4a5058;--btn-shadow:rgb(0 0 0 / 40%) 0 1px 3px;--btn-hover-shadow:rgb(0 0 0 / 50%) 0 .4em 1em;--list-background:#24272c;--list-border-color:#373c43;--list-hover-background:#2f343b;--list-hover-text:#f2f4f7;--list-close-background:#282828;--list-close-text:#777;--list-shadow:rgb(0 0 0 / 60%) 0 12px 32px -8px,rgb(0 0 0 / 30%) 0 2px 6px -2px;--list-modal-shadow:rgb(0 0 0 / 14%) -1px 3px 33px 2px;--modal-shadow:drop-shadow(3px 6px 28px rgb(0 0 0 / 18%));--modal-btn-bar:#38383a;--modal-btn-border:#434246;--modal-btn-shadow:rgb(255 255 255 / 5%) -2px -2px 10px,rgb(0 0 0 / 14%) 3px 3px 14px -2px,rgb(0 0 0 / 14%) 1px 2px 5px -1px;--date-btn-cal-month-text:#4a5058;--date-btn-background:#24272c;--date-btn-shadow:rgb(0 0 0 / 40%) 0 1px 3px;--checkmark-background:drop-shadow(0 0 3px #0a0a0a);--overlay-background:rgb(20 20 20 / 60%);--icon-ms365-color:#ea3e23;--icon-filter:grayscale(.2)}.atcb-initialized{display:inline-block;max-width:min(19em,100%)}.atcb-button,.atcb-subevent-btn{display:flex;align-items:flex-start;cursor:pointer;font-family:var(--font);font-size:1em;box-shadow:var(--date-btn-shadow);background-color:var(--date-btn-background);border:1px solid var(--date-btn-border);border-radius:var(--btn-border-radius);padding:0;margin:0;touch-action:manipulation;position:relative;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.atcb-button{gap:0;box-shadow:var(--btn-shadow);min-width:16em;max-width:min(19em,100%)}.atcb-button:focus,.atcb-button:hover{background-color:var(--date-btn-hover-background);border-color:var(--date-btn-hover-border);box-shadow:var(--btn-hover-shadow)}.atcb-button:focus-visible,.atcb-subevent-btn:focus-visible{outline:2px solid var(--accent-color)}.atcb-button:not(.atcb-active):hover,.atcb-subevent-btn:hover{align-items:center}.atcb-subevent-btn:focus,.atcb-subevent-btn:hover{box-shadow:var(--date-btn-hover-shadow)}.atcb-date-btn-left{border-radius:calc(var(--btn-border-radius) - 1px) 0 0 calc(var(--btn-border-radius) - 1px)}.atcb-rtl .atcb-date-btn-left{border-radius:0 calc(var(--btn-border-radius) - 1px) calc(var(--btn-border-radius) - 1px) 0}.atcb-button:hover .atcb-date-btn-left,.atcb-subevent-btn:hover .atcb-date-btn-left{opacity:.85}@media (width <= 575px){.atcb-button-wrapper:has(.atcb-date-btn-plus){margin-inline-end:.75em}.atcb-button{min-width:13em;width:100%;margin:auto}:host .atcb-initialized{width:100%}}.atcb-date-btn-details{padding:.7em 1.4em .7em .8em}.atcb-rtl .atcb-date-btn-details{padding:.7em .8em .7em 1.4em}.atcb-button:not(.atcb-active):hover .atcb-date-btn-hover,.atcb-subevent-btn:hover .atcb-date-btn-hover{opacity:1}.atcb-button:not(.atcb-active):hover .atcb-date-btn-details,.atcb-subevent-btn:hover .atcb-date-btn-details{opacity:0}.atcb-date-btn-headline{font-size:.9em;margin-bottom:.35em}.atcb-date-btn-content+.atcb-date-btn-content{margin-top:.3em}.atcb-date-btn-plus{border-radius:100%}.atcb-icon{height:1.15em;width:1.15em}.atcb-dropdown-anchor{bottom:4px;height:1px}.atcb-list-wrapper{font-weight:var(--list-font-weight);padding:0;z-index:14000090}.atcb-list-wrapper.atcb-dropoverlay{z-index:15000000}.atcb-list{background-color:var(--list-background);border:1px solid var(--list-border-color);border-radius:var(--btn-border-radius);box-shadow:var(--list-shadow);min-width:100%;padding:.3em}.atcb-list-wrapper.atcb-dropdown:not(.atcb-dropup,.atcb-dropoverlay) .atcb-list{margin-top:.7em}.atcb-list-wrapper.atcb-dropup .atcb-list{margin-bottom:.7em}.atcb-list-item{background-color:transparent;border-radius:8px;padding:.7em .8em}.atcb-dropoverlay .atcb-list,.atcb-list.atcb-modal{border-radius:var(--btn-border-radius)}.atcb-list.atcb-modal{box-shadow:var(--list-modal-shadow)}.atcb-modal-box{filter:var(--modal-shadow)}a.atcb-modal-btn,button.atcb-modal-btn{border:0;border-radius:var(--btn-border-radius);box-shadow:var(--modal-btn-shadow);font-size:.9em;margin:.625em}a.atcb-modal-btn.atcb-modal-btn-border,button.atcb-modal-btn.atcb-modal-btn-border{border:1px solid var(--modal-btn-border)}a.atcb-modal-btn:not([disabled]):hover,button.atcb-modal-btn:not([disabled]):hover{box-shadow:var(--modal-btn-hover-shadow)}.atcb-saved .atcb-checkmark{top:-.9em;right:-.5em;height:1.2em}.atcb-checkmark svg{filter:var(--checkmark-background)}#atcb-bgoverlay{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}#atcb-bgoverlay:not(dialog){animation:atcb-bgoverlay-animate .2s ease 0s 1 normal forwards;opacity:0}.atcb-icon-outlookcom,.atcb-icon.atcb-icon-ms365{padding-bottom:.05em}.atcb-icon.atcb-icon-apple,.atcb-icon.atcb-icon-ical{padding-bottom:.15em}.atcb-icon.atcb-icon-apple svg{fill:currentcolor}.atcb-icon.atcb-icon-ical svg{fill:currentcolor}.pro-form{border-top:1px solid var(--modal-btn-border);margin-top:1.5em;padding-top:1.5em}.pro-field input[type=email],.pro-field input[type=number],.pro-field input[type=text]{border:1px solid var(--modal-btn-border)}.pro-field input[type=email]:focus,.pro-field input[type=number]:focus,.pro-field input[type=text]:focus{border-color:var(--accent-color);outline:1px solid var(--accent-color)}#ty-success-msg{display:none;font-weight:700;line-height:1.6em;padding:1.5em 0;text-align:center}.pro-form-fine{margin:.5em auto 1em}.pro-waiting{border:1px solid var(--modal-btn-border)}#atcb-reference.atcb-dropup{margin-top:-1px}@media (width <= 575px){.atcb-modal-box{filter:none}}"
};
var atcbSsrLabels = {
	"ar": "إضافة إلى التقويم",
	"az": "Təqvimə əlavə edin",
	"be": "Дадаць у каляндар",
	"bg": "Добавяне към календара",
	"bs": "Dodaj u kalendar",
	"cs": "Přidat do kalendáře",
	"da": "Føj til kalender",
	"de": "Im Kalender speichern",
	"el": "Προσθήκη στο Ημερολόγιο",
	"en": "Add to Calendar",
	"es": "Añadir al Calendario",
	"et": "Lisa kalendrisse",
	"fa": "افزودن به تقویم",
	"fi": "Lisää kalenteriin",
	"fr": "Ajouter à l'Agenda",
	"he": "הוספה ליומן",
	"hi": "कैलेंडर में जोड़ें",
	"hr": "Dodaj u Kalendar",
	"hu": "Hozzáadás a naptárhoz",
	"hy": "Ավելացնել Օրացույց",
	"id": "Tambahkan ke Kalender",
	"it": "Aggiungi al calendario",
	"ja": "カレンダーに追加",
	"ka": "კალენდარში დამატება",
	"ko": "캘린더에 추가",
	"lt": "Pridėti prie kalendoriaus",
	"lv": "Pievienot kalendāram",
	"mk": "Додај во Календар",
	"mt": "Żid mal-Kalendarju",
	"nl": "Opslaan in Agenda",
	"no": "Legg til i kalenderen",
	"pl": "Dodaj do kalendarza",
	"pt": "Incluir no Calendário",
	"ro": "Adauga In Calendar",
	"ru": "Добавить в календарь",
	"sk": "Pridať do kalendára",
	"sl": "Dodaj v koledar",
	"sq": "Shto në Kalendar",
	"sr": "Додај у календар",
	"sv": "Lägg till i kalender",
	"tr": "Takvime Ekle",
	"uk": "Додати до календаря",
	"vi": "Thêm vào Lịch",
	"zh": "添加到日历"
};
var atcbSsrRsvpLabels = {
	"ar": {
		"title": "التأكيد على الحضور",
		"expired": "منتهي الصلاحية",
		"bookedout": "محجوز بالكامل",
		"restart": "جديد RSVP"
	},
	"az": {
		"title": "RSVP",
		"expired": "Müddəti bitib",
		"bookedout": "Yerlər doludur",
		"restart": "Yeni RSVP cavabı"
	},
	"be": {
		"title": "Адказаць",
		"expired": "Тэрмін скончыўся",
		"bookedout": "Месцаў няма",
		"restart": "Новы адказ RSVP"
	},
	"bg": {
		"title": "RSVP",
		"expired": "Изтекъл",
		"bookedout": "Няма свободни места",
		"restart": "Нов отговор за участие"
	},
	"bs": {
		"title": "RSVP",
		"expired": "Isteklo",
		"bookedout": "Popunjeno",
		"restart": "Novi RSVP odgovor"
	},
	"cs": {
		"title": "RSVP",
		"expired": "Vypršelo",
		"bookedout": "Obsazeno",
		"restart": "Nová odpověď na RSVP"
	},
	"da": {
		"title": "RSVP",
		"expired": "Udløbet",
		"bookedout": "Udsolgt",
		"restart": "Nyt RSVP-svar"
	},
	"de": {
		"title": "RSVP",
		"expired": "Abgelaufen",
		"bookedout": "Ausgebucht",
		"restart": "Neue RSVP-Antwort"
	},
	"el": {
		"title": "RSVP",
		"expired": "Έληξε",
		"bookedout": "Πλήρες",
		"restart": "Νέα απάντηση RSVP"
	},
	"en": {
		"title": "RSVP",
		"expired": "Expired",
		"bookedout": "Booked out",
		"restart": "New RSVP Reply"
	},
	"es": {
		"title": "RSVP",
		"expired": "Expirado",
		"bookedout": "Completo",
		"restart": "Nueva respuesta RSVP"
	},
	"et": {
		"title": "RSVP",
		"expired": "Aegunud",
		"bookedout": "Välja müüdud",
		"restart": "Uus RSVP-vastus"
	},
	"fa": {
		"title": "پاسخ دهید",
		"expired": "منقضی شده",
		"bookedout": "ظرفیت تکمیل",
		"restart": "پاسخ جدید RSVP"
	},
	"fi": {
		"title": "RSVP",
		"expired": "Vanhentunut",
		"bookedout": "Varattu",
		"restart": "Uusi RSVP-vastaus"
	},
	"fr": {
		"title": "RSVP",
		"expired": "Expiré",
		"bookedout": "Complet",
		"restart": "Nouvelle réponse RSVP"
	},
	"he": {
		"title": "RSVP",
		"expired": "פג תוקף",
		"bookedout": "מלא",
		"restart": "תגובה חדשה ל-RSVP"
	},
	"hi": {
		"title": "RSVP",
		"expired": "समाप्त",
		"bookedout": "पूर्ण रूप से बुक",
		"restart": "नई RSVP प्रतिक्रिया"
	},
	"hr": {
		"title": "RSVP",
		"expired": "Isteklo",
		"bookedout": "Popunjeno",
		"restart": "Novi RSVP odgovor"
	},
	"hu": {
		"title": "RSVP",
		"expired": "Lejárt",
		"bookedout": "Teljesen lefoglalt",
		"restart": "Új RSVP válasz"
	},
	"hy": {
		"title": "RSVP",
		"expired": "Ժամկետանց",
		"bookedout": "Տեղերը սպառված են",
		"restart": "Նոր RSVP պատասխան"
	},
	"id": {
		"title": "RSVP",
		"expired": "Kedaluwarsa",
		"bookedout": "Penuh",
		"restart": "RSVP Baru"
	},
	"it": {
		"title": "RSVP",
		"expired": "Scaduto",
		"bookedout": "Al completo",
		"restart": "Nuova risposta RSVP"
	},
	"ja": {
		"title": "RSVP",
		"expired": "期限切れ",
		"bookedout": "満席",
		"restart": "新しいRSVPの回答"
	},
	"ka": {
		"title": "RSVP",
		"expired": "ვადაგასული",
		"bookedout": "ადგილები შევსებულია",
		"restart": "ახალი RSVP პასუხი"
	},
	"ko": {
		"title": "RSVP",
		"expired": "만료됨",
		"bookedout": "예약 마감",
		"restart": "새 RSVP 응답"
	},
	"lt": {
		"title": "RSVP",
		"expired": "Baigėsi",
		"bookedout": "Vietų nėra",
		"restart": "Naujas RSVP atsakymas"
	},
	"lv": {
		"title": "RSVP",
		"expired": "Beidzies",
		"bookedout": "Vietu nav",
		"restart": "Jauna RSVP atbilde"
	},
	"mk": {
		"title": "РСВП",
		"expired": "Истечено",
		"bookedout": "Пополнето",
		"restart": "Нов RSVP одговор"
	},
	"mt": {
		"title": "RSVP",
		"expired": "Skada",
		"bookedout": "Mimli",
		"restart": "Tweġiba RSVP ġdida"
	},
	"nl": {
		"title": "RSVP",
		"expired": "Verlopen",
		"bookedout": "Volgeboekt",
		"restart": "Nieuwe RSVP-antwoord"
	},
	"no": {
		"title": "RSVP",
		"expired": "Utløpt",
		"bookedout": "Fullt",
		"restart": "Ny RSVP-svar"
	},
	"pl": {
		"title": "RSVP",
		"expired": "Wygasło",
		"bookedout": "Brak miejsc",
		"restart": "Nowa odpowiedź RSVP"
	},
	"pt": {
		"title": "RSVP",
		"expired": "Expirado",
		"bookedout": "Esgotado",
		"restart": "Nova resposta RSVP"
	},
	"ro": {
		"title": "RSVP",
		"expired": "Expirat",
		"bookedout": "Locuri epuizate",
		"restart": "Nou răspuns RSVP"
	},
	"ru": {
		"title": "Просьба ответить",
		"expired": "Срок истёк",
		"bookedout": "Мест нет",
		"restart": "Новый ответ RSVP"
	},
	"sk": {
		"title": "RSVP",
		"expired": "Platnosť vypršala",
		"bookedout": "Obsadené",
		"restart": "Nová odpoveď RSVP"
	},
	"sl": {
		"title": "odgovori",
		"expired": "Poteklo",
		"bookedout": "Zasedeno",
		"restart": "Nov odgovor RSVP"
	},
	"sq": {
		"title": "RSVP",
		"expired": "Skaduar",
		"bookedout": "Plot",
		"restart": "Përgjigje e re RSVP"
	},
	"sr": {
		"title": "РСВП",
		"expired": "Истекло",
		"bookedout": "Попуњено",
		"restart": "Нови RSVP одговор"
	},
	"sv": {
		"title": "RSVP",
		"expired": "Utgången",
		"bookedout": "Fullbokat",
		"restart": "Nytt RSVP-svar"
	},
	"tr": {
		"title": "RSVP",
		"expired": "Süresi Dolmuş",
		"bookedout": "Dolu",
		"restart": "Yeni RSVP Yanıtı"
	},
	"uk": {
		"title": "RSVP",
		"expired": "Термін дії закінчився",
		"bookedout": "Місць немає",
		"restart": "Нова відповідь RSVP"
	},
	"vi": {
		"title": "RSVP",
		"expired": "Hết hạn",
		"bookedout": "Đã đầy",
		"restart": "Trả lời RSVP mới"
	},
	"zh": {
		"title": "RSVP",
		"expired": "已过期",
		"bookedout": "已满",
		"restart": "新的RSVP回复"
	}
};
var KNOWN_STYLES = [
	"default",
	"simple",
	"3d",
	"flat",
	"round",
	"neumorphism",
	"text",
	"date"
];
/**
* Normalizes config keys to the internal camelCase form. Accepts the official
* kebab-case attribute spellings ('start-date', 'button-style', ...) and legacy
* lowercased names ('startdate', ...) in addition to camelCase - mirroring what
* the element accepts on the tag. camelCase input wins when both are present,
* since the kebab form would overwrite it otherwise.
*/
function normalizeConfig(config) {
	const normalized = {};
	const priorities = {};
	const aliases = /* @__PURE__ */ new Map();
	for (const param of [...wcParams, "proKey"]) {
		aliases.set(legacyAttributeName(param), {
			key: param,
			priority: 1
		});
		aliases.set(officialAttributeName(param), {
			key: param,
			priority: 2
		});
		aliases.set(param, {
			key: param,
			priority: 3
		});
	}
	for (const [key, value] of Object.entries(config)) {
		const alias = aliases.get(key);
		if (alias) {
			if ((priorities[`${alias.key}`] || 0) <= alias.priority) {
				normalized[`${alias.key}`] = value;
				priorities[`${alias.key}`] = alias.priority;
			}
			continue;
		}
		const normalizedKey = key.replace(/[-_]([a-z0-9])/g, (_, chr) => chr.toUpperCase());
		if (!(normalizedKey in normalized)) normalized[`${normalizedKey}`] = value;
	}
	return normalized;
}
function serializeAttributeValue(value) {
	if (value === void 0 || value === null) return null;
	if (typeof value === "string") return value;
	if (typeof value === "boolean" || typeof value === "number") return String(value);
	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
}
function skeletonSpan(width) {
	return `<span class="atcb-ssr-skeleton" style="width:${width}">&nbsp;</span>`;
}
/**
* Boolean flag coercion mirroring the element: true, 'true', '1', and the bare
* attribute presence ('' - e.g. frameworks serialize bare boolean attrs as empty
* strings) all count as true.
*/
function truthyFlag(value) {
	return value === true || value === "true" || value === "1" || value === "";
}
function isAsciiDigits(value) {
	if (value.length === 0) return false;
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code < 48 || code > 57) return false;
	}
	return true;
}
function parseDates(value) {
	if (Array.isArray(value)) return value.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
	if (typeof value !== "string") return null;
	try {
		const parsed = JSON.parse(value.replace(/'/g, "\""));
		return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry)) : null;
	} catch {
		return null;
	}
}
function dateInTimeZone(timeZone) {
	const now = /* @__PURE__ */ new Date();
	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).formatToParts(now);
		const part = (type) => parts.find((entry) => entry.type === type)?.value || "";
		return `${part("year")}-${part("month")}-${part("day")}`;
	} catch {
		const utcDate = now.toISOString().slice(0, 10);
		const utcTime = now.toISOString().slice(11, 16);
		const offset = tzlib_get_offset(timeZone, utcDate, utcTime);
		if (offset.length !== 5 || offset[0] !== "+" && offset[0] !== "-" || !isAsciiDigits(offset.slice(1))) return null;
		const offsetMinutes = (offset[0] === "+" ? 1 : -1) * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(3, 5)));
		return new Date(now.getTime() + offsetMinutes * 6e4).toISOString().slice(0, 10);
	}
}
function resolveDynamicDate(value, timeZone) {
	if (typeof value !== "string") return null;
	const separator = value.indexOf("+");
	if (separator !== -1 && value.indexOf("+", separator + 1) !== -1) return null;
	const date = separator === -1 ? value : value.slice(0, separator);
	const offset = separator === -1 ? "" : value.slice(separator + 1);
	if (separator !== -1 && (offset.length > 4 || !isAsciiDigits(offset))) return null;
	const isToday = date.toLowerCase() === "today";
	const isIsoDate = date.length === 10 && date[4] === "-" && date[7] === "-" && isAsciiDigits(date.slice(0, 4) + date.slice(5, 7) + date.slice(8));
	if (!isToday && !isIsoDate) return null;
	const resolvedDate = isToday ? dateInTimeZone(timeZone) : date;
	if (!resolvedDate) return null;
	const base = /* @__PURE__ */ new Date(`${resolvedDate}T00:00:00Z`);
	if (Number.isNaN(base.getTime())) return null;
	base.setUTCDate(base.getUTCDate() + Number(offset || 0));
	return base.toISOString().slice(0, 10);
}
function dateIsOverdue(entry) {
	if (entry.timeZone === "currentBrowser" || entry.useUserTZ) return null;
	const timeZone = typeof entry.timeZone === "string" ? entry.timeZone : "GMT";
	const date = resolveDynamicDate(entry.endDate || entry.startDate, timeZone);
	if (!date) return null;
	const time = typeof entry.endTime === "string" && /^\d{2}:\d{2}/.test(entry.endTime) ? entry.endTime.slice(0, 5) : "";
	let timestamp;
	if (time !== "") try {
		const offset = tzlib_get_offset(timeZone, date, time);
		timestamp = (/* @__PURE__ */ new Date(`${date} ${time}:00 GMT${offset}`)).getTime();
	} catch {
		return null;
	}
	else {
		const nextDate = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
		nextDate.setUTCDate(nextDate.getUTCDate() + 1);
		const nextDateString = nextDate.toISOString().slice(0, 10);
		try {
			const offset = tzlib_get_offset(timeZone, nextDateString, "00:00");
			timestamp = (/* @__PURE__ */ new Date(`${nextDateString} 00:00:00 GMT${offset}`)).getTime();
		} catch {
			return null;
		}
	}
	return Number.isNaN(timestamp) ? null : timestamp < Date.now();
}
/** Only suppress a shell when the client can be known to hide every date. */
function hidesPastEvent(config) {
	if (config.pastDateHandling !== "hide" || typeof config.recurrence === "string" && config.recurrence !== "") return false;
	const configuredDates = parseDates(config.dates);
	const overdue = (configuredDates && configuredDates.length > 0 ? configuredDates : [{}]).map((date) => dateIsOverdue({
		startDate: date.startDate || config.startDate,
		endDate: date.endDate || config.endDate || date.startDate || config.startDate,
		endTime: date.endTime || config.endTime,
		timeZone: date.timeZone || config.timeZone,
		useUserTZ: date.useUserTZ || config.useUserTZ
	}));
	return overdue.length > 0 && overdue.every((entry) => entry === true);
}
/**
* Parses the options config into normalized option keys plus their optional label
* overrides (the 'Option|Label' syntax). Mirrors the client-side normalization
* (lowercase, 'microsoft' -> 'ms', dots stripped); unknown/empty entries drop out.
*/
function parseOptions(value) {
	let entries;
	if (Array.isArray(value)) entries = value;
	else if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed === "") return [];
		try {
			const parsed = JSON.parse(trimmed.replace(/'/g, "\""));
			entries = Array.isArray(parsed) ? parsed : [parsed];
		} catch {
			entries = trimmed.split(",").map((entry) => entry.trim().replace(/^'+|'+$/g, ""));
		}
	} else return [];
	const options = [];
	for (const entry of entries) {
		if (typeof entry !== "string") continue;
		const [rawName, ...labelParts] = entry.split("|");
		const key = (rawName || "").toLowerCase().replace(/\s+/g, "").replace("microsoft", "ms").replace(/\./, "");
		if (key === "" || !icons[`${key}`]) continue;
		options.push({
			key,
			labelOverride: labelParts.join("|").trim()
		});
	}
	return options;
}
/** Internal renderer that distinguishes fetched PRO config from optimistic sync input. */
function generate_ssr_html_with_context(rawConfig, proConfigResolved) {
	const config = normalizeConfig(rawConfig);
	const buttonStyle = typeof config.buttonStyle === "string" && KNOWN_STYLES.includes(config.buttonStyle) ? config.buttonStyle : "default";
	const baseLanguage = (typeof config.language === "string" && config.language ? config.language : "en").split(/[-_]/)[0].toLowerCase();
	const rtl = rtlLanguages.includes(baseLanguage);
	const sizes = decorate_sizes(typeof config.size === "string" || typeof config.size === "number" ? String(config.size) : void 0);
	const lightMode = config.lightMode === "dark" ? "dark" : config.lightMode === "bodyScheme" ? "bodyScheme" : "light";
	const label = typeof config.label === "string" && config.label !== "" ? config.label : atcbSsrLabels[`${baseLanguage}`] || atcbSsrLabels["en"] || "Add to Calendar";
	const rsvpLabels = atcbSsrRsvpLabels[`${baseLanguage}`] || atcbSsrRsvpLabels["en"] || {
		title: "RSVP",
		expired: "Expired",
		bookedout: "Booked out"
	};
	const inline = truthyFlag(config.inline);
	const hasRsvp = Boolean(config.rsvp) && typeof config.rsvp === "object";
	const inlineRsvp = hasRsvp && truthyFlag(config.inlineRsvp);
	const hidden = truthyFlag(config.hidden);
	const identifier = typeof config.identifier === "string" && /^[\w-]+$/.test(config.identifier) ? config.identifier : "";
	const buttonsList = truthyFlag(config.buttonsList);
	const hideIconButton = truthyFlag(config.hideIconButton);
	const hideIconList = truthyFlag(config.hideIconList);
	const hideTextLabelButton = truthyFlag(config.hideTextLabelButton);
	const groupOverviewRequested = truthyFlag(config.groupOverview);
	const groupOverviewCapabilityKnown = proConfigResolved || Object.prototype.hasOwnProperty.call(config, "publicEventOverview");
	const groupOverviewEnabled = config.publicEventOverview === true;
	const groupOverviewSkeleton = typeof config.proKey === "string" && config.proKey !== "" && (groupOverviewCapabilityKnown ? groupOverviewEnabled && (!truthyFlag(config.subscribe) || groupOverviewRequested) : groupOverviewRequested);
	const customCss = typeof config.customCss === "string" && config.customCss !== "" && secure_url(config.customCss, false) ? config.customCss : "";
	const styleLight = typeof config.styleLight === "string" ? config.styleLight.replace(/(\\r\\n|\\n|\\r)/g, "").replace(/(<(?!br)([^>]+)>)/gi, "") : "";
	const styleDark = typeof config.styleDark === "string" ? config.styleDark.replace(/(\\r\\n|\\n|\\r)/g, "").replace(/(<(?!br)([^>]+)>)/gi, "") : "";
	const parsedOptions = parseOptions(config.options);
	const listOptions = buttonsList && buttonStyle !== "date" ? parsedOptions : [];
	listOptions.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
	const oneOption = parsedOptions.length === 1;
	const attributes = [];
	for (const [key, value] of Object.entries(config)) {
		const serialized = serializeAttributeValue(value);
		if (serialized === null) continue;
		attributes.push(`${officialAttributeName(key)}="${escape_html(serialized)}"`);
	}
	if (!groupOverviewSkeleton && hidesPastEvent(config)) return `<add-to-calendar-button class="add-to-calendar atcb-${lightMode}" ${attributes.join(" ")}></add-to-calendar-button>`;
	const generalCss = `.atcb-initialized { display: block; position: relative; width: ${inlineRsvp || groupOverviewSkeleton ? "100%" : "fit-content"}; }.atcb-initialized.atcb-inline { display: inline-block; }.atcb-initialized.atcb-buttons-list { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--buttonslist-gap); }.atcb-hidden { display: none; }.atcb-ssr-skeleton { display: inline-block; background: currentColor; opacity: 0.15; border-radius: 0.3em; min-width: 2ch; }[data-atcb-ssr] .atcb-date-btn-month { margin-top: 0.5em; }:host:has(.atcb-ssr-group-overview-skeleton) { box-sizing: border-box; display: block; max-width: 100% !important; width: min(600px, 100%) !important; }.atcb-ssr-group-overview-skeleton { box-sizing: border-box; color: #1b1f24; display: flex; flex-direction: column; gap: 0.7em; width: 100%; }.atcb-ssr-group-overview-skeleton .atcb-ssr-skeleton { display: block; }.atcb-ssr-group-overview-select { height: 2.6em; margin-bottom: 0.55em; width: 7em; }.atcb-ssr-group-overview-entry { height: 4.5em; width: 100%; }.atcb-ssr-group-overview-entry + .atcb-ssr-group-overview-entry { margin-top: 10px; }.atcb-ssr-rsvp-skeleton { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 540px; margin: 0 auto; padding: 32px 24px; gap: 12px; }.atcb-ssr-rsvp-skeleton .atcb-ssr-skeleton { display: block; width: 78%; height: 10px; background-image: linear-gradient(90deg, transparent 25%, rgb(255 255 255 / 0.55) 50%, transparent 75%); background-size: 200% 100%; animation: atcb-ssr-shimmer 1.5s linear infinite; }.atcb-ssr-rsvp-skeleton .atcb-ssr-skeleton-headline { width: 42%; height: 44px; margin-bottom: 2px; opacity: 0.25; }.atcb-ssr-rsvp-skeleton .atcb-ssr-skeleton-field { width: 100%; height: 44px; margin-top: 8px; border-radius: 6px; }.atcb-ssr-rsvp-skeleton .atcb-ssr-skeleton-submit { width: 38%; height: 44px; margin-top: 10px; opacity: 0.25; }.atcb-ssr-rsvp-skeleton .atcb-ssr-skeleton-field + .atcb-ssr-skeleton-field { margin-top: 0; }@keyframes atcb-ssr-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }@media (prefers-reduced-motion: reduce) { .atcb-ssr-rsvp-skeleton .atcb-ssr-skeleton { animation: none; } }`;
	const styleCss = buttonStyle === "custom" ? "" : (atcbSsrCssTemplate["core"] || "") + (atcbSsrCssTemplate[`${buttonStyle}`] || "");
	const overrideCss = (styleLight !== "" ? `:host{${styleLight}}` : "") + (styleDark !== "" ? `:host(.atcb-dark){${styleDark}}` : "");
	const customCssLink = customCss !== "" ? `<link rel="stylesheet" type="text/css" href="${escape_html(customCss)}">` : "";
	const sizeStyle = `--base-font-size-l:${sizes["l"]}px;--base-font-size-m:${sizes["m"]}px;--base-font-size-s:${sizes["s"]}px;`;
	const buttonId = identifier !== "" ? ` id="atcb-btn-${escape_html(identifier)}"` : "";
	const content = (function() {
		if (groupOverviewSkeleton) return "<div class=\"atcb-group-overview atcb-group-overview-list atcb-ssr-group-overview-skeleton\" aria-hidden=\"true\"><div class=\"atcb-ssr-skeleton atcb-ssr-group-overview-select\"></div><div class=\"atcb-ssr-skeleton atcb-ssr-group-overview-entry\"></div><div class=\"atcb-ssr-skeleton atcb-ssr-group-overview-entry\"></div></div>";
		if (inlineRsvp) return `<div class="atcb-ssr-rsvp-skeleton" aria-hidden="true"><div class="atcb-ssr-skeleton atcb-ssr-skeleton-headline"></div><div class="atcb-ssr-skeleton"></div><div class="atcb-ssr-skeleton"></div><div class="atcb-ssr-skeleton atcb-ssr-skeleton-field"></div><div class="atcb-ssr-skeleton atcb-ssr-skeleton-field"></div><div class="atcb-ssr-skeleton atcb-ssr-skeleton-submit"></div></div>`;
		if (hasRsvp) {
			const rsvp = config.rsvp;
			const rsvpLabel = truthyFlag(rsvp.expired) ? rsvpLabels.expired : truthyFlag(rsvp.bookedOut) ? rsvpLabels.bookedout : rsvpLabels.title;
			const icon = hideIconButton ? "" : `<div class="atcb-icon atcb-icon-rsvp" part="atcb-list-icon">${icons["rsvp"]}</div>`;
			const text = hideTextLabelButton ? "" : `<span class="atcb-text" part="atcb-list-text">${escape_html_text(rsvpLabel)}</span>`;
			return `<div class="atcb-button-wrapper${rtl ? " atcb-rtl" : ""}" part="atcb-button-wrapper" style="${sizeStyle}"><button type="button" class="atcb-button atcb-click atcb-single${hideTextLabelButton ? " atcb-no-text" : ""}" part="atcb-button"${buttonId} aria-expanded="false" aria-label="${escape_html(rsvpLabel)}">${icon}${text}</button></div>`;
		}
		if (listOptions.length > 0) return listOptions.map((option) => {
			const singletonId = identifier !== "" ? ` id="atcb-btn-${escape_html(identifier)}-${escape_html(option.key)}"` : "";
			const icon = hideIconList ? "" : `<div class="atcb-icon atcb-icon-${escape_html(option.key)}" part="atcb-button-icon">${icons[`${option.key}`]}</div>`;
			const text = hideTextLabelButton ? "" : option.labelOverride !== "" ? `<span class="atcb-text" part="atcb-list-text">${escape_html_text(option.labelOverride)}</span>` : `<span class="atcb-text" part="atcb-list-text">${skeletonSpan("8ch")}</span>`;
			return `<div class="atcb-button-wrapper${rtl ? " atcb-rtl" : ""}" part="atcb-button-wrapper" style="${sizeStyle}"><button type="button" class="atcb-button atcb-single${hideTextLabelButton ? " atcb-no-text" : ""}" part="atcb-button"${singletonId} aria-expanded="false" aria-label="${escape_html(option.labelOverride !== "" ? option.labelOverride : option.key)}">${icon}${text}</button></div>`;
		}).join("");
		const inner = (function() {
			if (buttonStyle === "date") {
				const headline = typeof config.label === "string" && config.label !== "" ? escape_html_text(config.label) : typeof config.name === "string" && config.name !== "" ? escape_html_text(config.name) : skeletonSpan("12ch");
				return `<div class="atcb-date-btn-left"><div class="atcb-date-btn-day">${skeletonSpan("2ch")}</div><div class="atcb-date-btn-month">${skeletonSpan("3ch")}</div></div><div class="atcb-date-btn-right"><div class="atcb-date-btn-details"><div class="atcb-date-btn-headline">${headline}</div><div class="atcb-date-btn-content">${skeletonSpan("16ch")}</div></div></div><div class="atcb-date-btn-plus"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg></div>`;
			}
			const icon = hideIconButton ? "" : `<div class="atcb-icon atcb-icon-trigger" part="atcb-button-icon">${icons["trigger"]}</div>`;
			const chevron = !oneOption && !hideTextLabelButton ? `<div class="atcb-chevron" part="atcb-button-chevron">${icons["chevron"]}</div>` : "";
			const anchor = oneOption ? "" : "<div class=\"atcb-dropdown-anchor\"></div>";
			return `${icon}${hideTextLabelButton ? "" : `<span class="atcb-text" part="atcb-button-text">${escape_html_text(label)}</span>`}${chevron}${anchor}`;
		})();
		return `<div class="atcb-button-wrapper${rtl ? " atcb-rtl" : ""}" part="atcb-button-wrapper" style="${sizeStyle}"><button type="button" class="atcb-button${oneOption ? " atcb-single" : ""}${hideTextLabelButton ? " atcb-no-text" : ""}" part="atcb-button"${buttonId} aria-expanded="false" aria-label="${escape_html(typeof label === "string" ? label : "Add to Calendar")}">${inner}</button></div>`;
	})();
	const shellHidden = hidden;
	const shell = `<style>${generalCss}</style>${customCssLink}<style>${styleCss}${overrideCss}</style><div class="${`atcb-initialized${shellHidden ? " atcb-hidden" : ""}${inline && !groupOverviewSkeleton ? " atcb-inline" : ""}${listOptions.length > 0 && !inline && !groupOverviewSkeleton ? " atcb-buttons-list" : ""}`}" data-atcb-ssr lang="${escape_html(baseLanguage)}">${shellHidden ? "" : content}</div>`;
	return `<add-to-calendar-button class="add-to-calendar atcb-${lightMode}" ${attributes.join(" ")}><template shadowrootmode="open">${shell}</template></add-to-calendar-button>`;
}
/**
* Renders the complete element HTML: host tag with all config attributes plus the
* declarative shadow DOM template carrying the shell. Drop the returned string into
* server-rendered HTML; the client bundle takes over from there.
*/
function generate_ssr_html(rawConfig) {
	return generate_ssr_html_with_context(rawConfig, false);
}
/**
* Fetches a PRO configuration when a prokey is present, then renders its SSR shell.
* The synchronous renderer remains available for configurations that need no I/O.
*/
async function generate_ssr_html_async(rawConfig) {
	const config = normalizeConfig(rawConfig);
	const proKey = typeof config.proKey === "string" ? config.proKey : "";
	if (proKey === "") return generate_ssr_html(rawConfig);
	try {
		const endpoint = `https://${truthyFlag(config.dev) ? "event-dev.caldn.net" : "event.caldn.net"}/${encodeURIComponent(proKey)}/config.json`;
		const response = await fetch(endpoint);
		if (!response.ok) throw new Error("Not possible to read prokey config from server...");
		const responseData = strip_unsafe_keys(await response.json());
		if (!responseData || typeof responseData !== "object" || Array.isArray(responseData)) throw new Error("Not possible to read prokey config from server...");
		const merged = responseData;
		const overrideKeys = truthyFlag(config.proOverride) ? wcParams : wcProParams;
		for (const key of overrideKeys) {
			if (truthyFlag(config.proOverride) && [
				"hideBranding",
				"ty",
				"rsvp"
			].includes(key)) continue;
			if (Object.prototype.hasOwnProperty.call(config, key)) merged[`${key}`] = config[`${key}`];
		}
		for (const key of ["groupOverview", "groupOverviewConfig"]) if (Object.prototype.hasOwnProperty.call(config, key)) merged[`${key}`] = config[`${key}`];
		if (config.rsvp && typeof config.rsvp === "object" && Object.prototype.hasOwnProperty.call(config.rsvp, "none")) delete merged.rsvp;
		merged.proKey = proKey;
		merged.identifier = proKey;
		return generate_ssr_html_with_context(merged, true);
	} catch {
		throw new Error("prokey invalid or server not responding!");
	}
}
//#endregion
export { generate_ssr_html as atcb_generate_ssr_html, generate_ssr_html_async as atcb_generate_ssr_html_async };
