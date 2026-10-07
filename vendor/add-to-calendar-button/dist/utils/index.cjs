Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let timezones_ical_library = require("timezones-ical-library");
//#region src/utils/dom-free-globals.ts
var isMobile = () => false;
var atcbTimeZonesToUtc = /^(?:GMT[+-]\d{1,2}|UTC|Zulu|Etc\/.*)$/i;
var defaultTarget = "_blank";
//#endregion
//#region src/core/text.ts
function escape_html_text(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escape_html(value) {
	return escape_html_text(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
			const origStart = startTime && startTime !== "" ? /* @__PURE__ */ new Date(`${startDate}T${startTime}:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, startDate, startTime))}`) : /* @__PURE__ */ new Date(`${startDate}T00:00:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, startDate, "00:00"))}`);
			return (endTime && endTime !== "" ? /* @__PURE__ */ new Date(`${endDate}T${endTime}:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, endDate, endTime))}`) : /* @__PURE__ */ new Date(`${endDate}T00:00:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, endDate, "00:00"))}`)).getTime() - origStart.getTime();
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
	const offset = startTime && startTime !== "" ? (0, timezones_ical_library.tzlib_get_offset)(tzid, startDate, startTime) : "";
	const startDateTime = (function() {
		if (startTime && startTime !== "") {
			const isoOff = toIsoOffset(offset);
			return /* @__PURE__ */ new Date(`${startDate}T${startTime}:00${isoOff}`);
		}
		const localMidnightOffset = toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, startDate, "00:00"));
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
			const get = (t) => parts.find((p) => p.type === t)?.value || "";
			return {
				date: `${get("year")}-${get("month")}-${get("day")}`,
				time: includeTime ? `${get("hour")}:${get("minute")}` : ""
			};
		} catch {
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
	const newStartInstant = startTime ? /* @__PURE__ */ new Date(`${data.startDate}T${startTime}:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, data.startDate, startTime))}`) : /* @__PURE__ */ new Date(`${data.startDate}T00:00:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, data.startDate, "00:00"))}`);
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
		data.dates[`${i}`] = {
			...data.dates[`${i}`],
			description,
			descriptionHtmlFree,
			descriptionHtmlFreeICal
		};
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
		const validTimeZones = (0, timezones_ical_library.tzlib_get_timezones)();
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
				const offsetEnd = (0, timezones_ical_library.tzlib_get_offset)(timeZone, dateString, timeString);
				return /* @__PURE__ */ new Date(dateString + " " + timeString + ":00 GMT" + offsetEnd);
			}
			return new Date(dateString);
		})();
		if (type === "timestamp") return tmpDate.getTime();
		if (!timeString) tmpDate.setDate(tmpDate.getDate() + 1);
		const currentUtcDate = (/* @__PURE__ */ new Date()).toISOString();
		return tmpDate.getTime() < new Date(currentUtcDate).getTime();
	} catch {
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
		const part = (type) => parts.find((entry) => entry.type === type)?.value || "";
		dateString = dateString.replace(/today/gi, `${part("year")}-${part("month")}-${part("day")}`);
	} catch {
		return false;
	}
	const dateStringParts = dateString.split("+");
	const dateParts = dateStringParts[0].split("-");
	const newDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2].substring(0, 2)));
	if (dateStringParts[1] && dateStringParts[1] > 0) newDate.setDate(newDate.getDate() + parseInt(dateStringParts[1]));
	try {
		return newDate.toISOString().replace(/T(\d{2}:\d{2}:\d{2}\.\d{3})Z/g, "");
	} catch {
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
		const offsetStart = (0, timezones_ical_library.tzlib_get_offset)(data.timeZone, data.startDate, data.startTime);
		const offsetEnd = (0, timezones_ical_library.tzlib_get_offset)(data.timeZone, data.endDate, data.endTime);
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
	const offset = (0, timezones_ical_library.tzlib_get_offset)(baseTimeZone, date, time);
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
		const rawByDay = (parts.BYWEEKDAY || parts.BYDAY)?.toString();
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
		const get = (t) => parts.find((p) => p.type === t)?.value || "";
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
	} catch {
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
	return {
		...parts,
		month0,
		dayOfYear: getDayOfYearFromYmd(parts.year, month0, parts.day),
		weekNumber: getWeekNumberFromYmd(parts.year, month0, parts.day)
	};
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
		const off = (0, timezones_ical_library.tzlib_get_offset)(safeTimeZone, dateStr, hhmm);
		return /* @__PURE__ */ new Date(`${dateStr}T${hhmm}:00${toIsoOffset(off)}`);
	} catch {
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
		const ffInterval = parseInt(rrule.INTERVAL?.toString() || "1", 10) || 1;
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
						return /* @__PURE__ */ new Date(`${dateStr}T${baseHhmm}:00${toIsoOffset((0, timezones_ical_library.tzlib_get_offset)(tzid, dateStr, baseHhmm))}`);
					} catch {
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
exports.atcb_decorate_data_dates = decorate_data_dates;
exports.atcb_generate_timestring = generate_timestring;
