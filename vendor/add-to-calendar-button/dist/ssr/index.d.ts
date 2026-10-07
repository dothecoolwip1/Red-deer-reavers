/*!
 * @preserve
 * Add to Calendar Button
 * Public type declarations (generated from src - do not edit)
 * Creator: Jens Kuerschner (https://jekuer.com)
 * Project: https://github.com/add2cal/add-to-calendar-button
 * License: Elastic License 2.0 (ELv2) (https://github.com/add2cal/add-to-calendar-button/blob/main/LICENSE.txt)
 * Version: 3.1.1
 * Note:    DO NOT REMOVE THE COPYRIGHT NOTICE ABOVE!
 */

/**
 * Shared internal types for the add-to-calendar-button source.
 *
 * Two config shapes flow through the code:
 * - ATCBInputConfig: what users provide (attributes arrive as strings, flags may be
 *   string-y booleans, options may be JSON strings). Aligned with the public
 *   AddToCalendarButtonType in index.d.ts (asserted by the type compatibility test).
 * - ATCBConfig: the decorated shape produced by decorate_data (flags coerced to
 *   real booleans, options normalized, dates array populated, internal fields added).
 *
 * Decorated fields stay optional on purpose: the decoration pipeline fills them at
 * runtime and consuming functions guard or assert presence where needed. Tightening
 * them to required fields would be a type-only change with a large diff surface -
 * a candidate for a later minor release, not something to mix into feature work.
 */
export type ATCBOptionName = "apple" | "google" | "ical" | "ms365" | "msteams" | "outlookcom" | "yahoo";
/**
 * Legacy v2 option spellings. Still fully supported as aliases: the runtime
 * normalizes any casing (plus the "Microsoft ..." / "Outlook.com" long forms)
 * to the official lowercase keys above.
 */
export type ATCBOptionNameLegacy = "Apple" | "Google" | "iCal" | "Microsoft365" | "MicrosoftTeams" | "Outlook.com" | "Yahoo";
export type ATCBEventStatus = "tentative" | "confirmed" | "cancelled";
/**
 * Legacy v2 status spelling. Still fully supported: status input is
 * case-insensitive and normalized to lowercase during decoration.
 */
export type ATCBEventStatusLegacy = Uppercase<ATCBEventStatus>;
/**
 * Button style options. List style options. Light mode options. Custom Labels. Normalized during decoration, but the input accepts any string (for forward compatibility with new styles).
 */
export type ATCBButtonStyle = "default" | "simple" | "3d" | "flat" | "round" | "neumorphism" | "text" | "date" | "custom" | "none";
export type ATCBListStyle = "dropdown" | "dropdown-static" | "dropup-static" | "overlay" | "modal";
export type ATCBLightMode = "system" | "dark" | "light" | "bodyScheme";
export type CustomLabelsObject = {
	[key: string]: string | null | undefined;
};
export interface ATCBGroupOverviewConfig {
	"years-only"?: boolean;
	type?: "list" | "cards" | "compact";
	from?: string;
	to?: string;
	"no-details"?: boolean;
	"no-add"?: boolean;
	"custom-domain"?: string;
	"add-via-list"?: boolean;
}
/**
 * One event date entry (multi-date configs carry several).
 * Post-decoration, entries also carry computed internals (e.g. overdue).
 */
export interface ATCBDateEntryInput {
	name?: string;
	description?: string;
	startDate?: string;
	startTime?: string;
	endDate?: string;
	endTime?: string;
	timeZone?: string;
	useUserTZ?: boolean;
	location?: string;
	status?: ATCBEventStatus | ATCBEventStatusLegacy | string;
	sequence?: number | string;
	uid?: string;
	organizer?: string;
	attendee?: string;
	icsReminder?: number | string;
	icsUrl?: string;
	icsCategories?: string[] | string;
	icsClass?: string;
	icsPriority?: number | string;
	icsGeo?: string;
	icsAttach?: string[] | string;
	icsCreated?: string;
	icsUpdated?: string;
}
/**
 * Raw input config (web component attributes or atcb_action argument).
 * Attribute values arrive as strings; boolean-ish fields accept both.
 */
export interface ATCBInputConfig {
	prokey?: string;
	groupOverview?: boolean | string;
	groupOverviewConfig?: ATCBGroupOverviewConfig | string;
	name?: string;
	dates?: ATCBDateEntryInput[] | string;
	description?: string;
	startDate?: string;
	startTime?: string;
	endDate?: string;
	endTime?: string;
	timeZone?: string;
	useUserTZ?: boolean | string;
	location?: string;
	status?: ATCBEventStatus | ATCBEventStatusLegacy | string;
	sequence?: number | string;
	uid?: string;
	organizer?: string;
	attendee?: string;
	icsFile?: string;
	images?: string[] | string;
	recurrence?: string;
	recurrence_interval?: number | string;
	recurrence_until?: string;
	recurrence_count?: number | string;
	recurrence_byDay?: string[] | string;
	recurrence_byMonth?: string[] | string | number[] | number;
	recurrence_byMonthDay?: string[] | string | number[] | number;
	recurrence_weekstart?: string;
	availability?: "busy" | "free" | string;
	icsCreated?: string;
	icsUpdated?: string;
	identifier?: string;
	subscribe?: boolean | string;
	options?: (ATCBOptionName | ATCBOptionNameLegacy)[] | string[] | string;
	optionsMobile?: (ATCBOptionName | ATCBOptionNameLegacy)[] | string[] | string;
	optionsIOS?: (ATCBOptionName | ATCBOptionNameLegacy)[] | string[] | string;
	iCalFileName?: string;
	listStyle?: ATCBListStyle | string;
	buttonStyle?: ATCBButtonStyle | string;
	trigger?: "hover" | "click" | string;
	inline?: boolean | string;
	inlineRsvp?: string;
	buttonsList?: boolean | string;
	hideIconButton?: boolean | string;
	hideIconList?: boolean | string;
	hideIconModal?: boolean | string;
	hideTextLabelButton?: boolean | string;
	hideTextLabelList?: boolean | string;
	hideBackground?: boolean | string;
	hideCheckmark?: boolean | string;
	hideBranding?: boolean | string;
	hideButton?: boolean | string;
	hideRichData?: boolean | string;
	size?: string;
	label?: string;
	customLabels?: CustomLabelsObject | string;
	customCss?: string;
	lightMode?: ATCBLightMode | string;
	language?: string;
	ty?: object | string;
	rsvp?: object | string;
	bypassWebViewCheck?: boolean | string;
	debug?: boolean | string;
	cspnonce?: string;
	blockInteraction?: boolean | string;
	styleLight?: string;
	styleDark?: string;
	styleSource?: string;
	loadAllStyles?: boolean | string;
	icsReminder?: number | string;
	icsUrl?: string;
	icsCategories?: string[] | string;
	icsClass?: string;
	icsPriority?: number | string;
	icsGeo?: string;
	icsAttach?: string[] | string;
	icsExdate?: string[] | string;
	disabled?: boolean | string;
	hidden?: boolean | string;
	pastDateHandling?: string;
	proxy?: boolean | string;
	fakeMobile?: boolean | string;
	fakeIOS?: boolean | string;
	fakeAndroid?: boolean | string;
	proOverride?: boolean | string;
	forceOverlay?: boolean | string;
	instance?: number | string;
	customVar?: CustomLabelsObject | string;
	domain?: string;
	dev?: boolean | string;
}
export type ATCBLanguage = "en" | "de" | "nl" | "fa" | "fr" | "es" | "et" | "pt" | "tr" | "zh" | "ar" | "hi" | "pl" | "ro" | "id" | "no" | "fi" | "sv" | "cs" | "ja" | "it" | "ko" | "vi" | "hu" | "he" | "uk" | "az" | "be" | "bg" | "bs" | "da" | "el" | "hr" | "hy" | "ka" | "lt" | "lv" | "mk" | "mt" | "ru" | "sk" | "sl" | "sq" | "sr";
export type CustomLabelsObjectType = {
	[key: string]: string | null;
};
export type GroupOverviewConfig = ATCBGroupOverviewConfig;
export interface EventDate {
	name?: string;
	description?: string;
	startDate?: string;
	startTime?: string;
	endDate?: string;
	endTime?: string;
	timeZone?: string;
	useUserTZ?: boolean;
	location?: string;
	status?: ATCBEventStatus | ATCBEventStatusLegacy;
	sequence?: number;
	uid?: string;
	organizer?: string;
	attendee?: string;
	icsReminder?: number | string;
	icsUrl?: string;
	icsCategories?: string[] | string;
	icsClass?: "public" | "private" | "confidential";
	icsPriority?: number;
	icsGeo?: string;
	icsAttach?: string[] | string;
}
export type AddToCalendarButtonType = {
	prokey?: string;
	groupOverview?: boolean | string;
	groupOverviewConfig?: GroupOverviewConfig | string;
	name?: string;
	dates?: EventDate[] | string;
	description?: string;
	startDate?: string;
	startTime?: string;
	endDate?: string;
	endTime?: string;
	timeZone?: string;
	useUserTZ?: boolean;
	location?: string;
	status?: ATCBEventStatus | ATCBEventStatusLegacy;
	sequence?: number | string;
	uid?: string;
	organizer?: string;
	attendee?: string;
	icsFile?: string;
	images?: string[] | string;
	recurrence?: string;
	recurrence_interval?: number | string;
	recurrence_until?: string;
	recurrence_count?: number | string;
	recurrence_byDay?: string[] | string;
	recurrence_byMonth?: string[] | string | number[] | number;
	recurrence_byMonthDay?: string[] | string | number[] | number;
	recurrence_weekstart?: string;
	availability?: "busy" | "free";
	icsCreated?: string;
	icsUpdated?: string;
	identifier?: string;
	subscribe?: boolean | string;
	options?: (ATCBOptionName | ATCBOptionNameLegacy)[] | string;
	optionsMobile?: (ATCBOptionName | ATCBOptionNameLegacy)[] | string;
	optionsIOS?: (ATCBOptionName | ATCBOptionNameLegacy)[] | string;
	iCalFileName?: string;
	listStyle?: ATCBListStyle;
	buttonStyle?: ATCBButtonStyle;
	trigger?: "hover" | "click";
	inline?: boolean | string;
	buttonsList?: boolean | string;
	hideIconButton?: boolean | string;
	hideIconList?: boolean | string;
	hideIconModal?: boolean | string;
	hideTextLabelButton?: boolean | string;
	hideTextLabelList?: boolean | string;
	hideBackground?: boolean | string;
	hideCheckmark?: boolean | string;
	hideBranding?: boolean | string;
	hideButton?: boolean | string;
	size?: string;
	label?: string;
	inlineRsvp?: string;
	customLabels?: CustomLabelsObjectType | string;
	customCss?: string;
	lightMode?: ATCBLightMode;
	language?: ATCBLanguage;
	hideRichData?: boolean | string;
	ty?: object | string;
	rsvp?: object | string;
	bypassWebViewCheck?: boolean | string;
	debug?: boolean | string;
	cspnonce?: string;
	blockInteraction?: boolean | string;
	styleLight?: string;
	styleDark?: string;
	styleSource?: string;
	loadAllStyles?: boolean | string;
	icsReminder?: number | string;
	icsUrl?: string;
	icsCategories?: string[] | string;
	icsClass?: "public" | "private" | "confidential";
	icsPriority?: number | string;
	icsGeo?: string;
	icsAttach?: string[] | string;
	icsExdate?: string[] | string;
	disabled?: boolean | string;
	hidden?: boolean | string;
	pastDateHandling?: string;
	proxy?: boolean | string;
	fakeMobile?: boolean | string;
	fakeIOS?: boolean | string;
	fakeAndroid?: boolean | string;
	proOverride?: boolean;
	forceOverlay?: boolean | string;
	instance?: number | string;
	customVar?: CustomLabelsObjectType | string;
	dev?: boolean | string;
};
declare global {
	interface Window {
		dataLayer?: {
			[key: string]: unknown;
		}[];
		atcb_action?: (data: ATCBInputConfig, triggerElement?: HTMLElement, keyboardTrigger?: boolean) => Promise<string>;
	}
	interface HTMLElementTagNameMap {
		"add-to-calendar-button": HTMLElement & AddToCalendarButtonType;
	}
	namespace JSX {
		interface IntrinsicElements {
			["add-to-calendar-button"]: AddToCalendarButtonType;
		}
	}
}
/**
 * Renders the complete element HTML: host tag with all config attributes plus the
 * declarative shadow DOM template carrying the shell. Drop the returned string into
 * server-rendered HTML; the client bundle takes over from there.
 */
declare function generate_ssr_html(rawConfig: AddToCalendarButtonType & {
	[key: string]: unknown;
}): string;
/**
 * Fetches a PRO configuration when a prokey is present, then renders its SSR shell.
 * The synchronous renderer remains available for configurations that need no I/O.
 */
declare function generate_ssr_html_async(rawConfig: AddToCalendarButtonType & {
	[key: string]: unknown;
}): Promise<string>;

export {
	generate_ssr_html as atcb_generate_ssr_html,
	generate_ssr_html_async as atcb_generate_ssr_html_async,
};

export {};
