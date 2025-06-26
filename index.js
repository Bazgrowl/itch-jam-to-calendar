const icsFormat = (date) => date
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';

function openGoogleCalendar({ title, description, start, end, location }) {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', title);
    url.searchParams.set('details', description);
    url.searchParams.set('location', location);
    url.searchParams.set('dates', `${icsFormat(start)}/${icsFormat(end)}`);

    window.open(url.toString(), '_blank');
}
function openOutlookCalendar({ title, description, start, end, location }) {
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.set('subject', title);
    url.searchParams.set('body', description);
    url.searchParams.set('startdt', start.toISOString());
    url.searchParams.set('enddt', end.toISOString());
    url.searchParams.set('location', location);

    window.open(url.toString(), '_blank');
}

function download(filename, fileBody) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileBody));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function createDownloadICSFile({ title, description, start, end, location }) {
    const icsBody = 'BEGIN:VCALENDAR\n' +
        'VERSION:2.0\n' +
        'PRODID:Calendar\n' +
        'CALSCALE:GREGORIAN\n' +
        'METHOD:PUBLISH\n' +
        'BEGIN:VTIMEZONE\n' +
        'END:VTIMEZONE\n' +
        'BEGIN:VEVENT\n' +
        'SUMMARY:' + title + '\n' +
        'UID:@Default\n' +
        'SEQUENCE:0\n' +
        'STATUS:CONFIRMED\n' +
        'TRANSP:TRANSPARENT\n' +
        'DTSTART:' + icsFormat(start) + '\n' +
        'DTEND:' + icsFormat(end)+ '\n' +
        'LOCATION:' + location + '\n' +
        'DESCRIPTION:' + description + '\n' +
        'END:VEVENT\n' +
        'END:VCALENDAR\n';

    download(title + '.ics', icsBody);
}


function parseJamDates(text) {
    const regex = /from (.+?) to (.+)$/i;
    const match = text.match(regex);
    if (!match) throw new Error("Date range not found in string");

    const [_, startStr, endStr] = match;

    const clean = str =>
        str
            .replace(/(\d+)(st|nd|rd|th)/g, '$1')
            .replace(/\sat\s/i, ' ')
            .trim();

    const startDate = new Date(clean(startStr));
    const endDate = new Date(clean(endStr));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
    }

    return { start: startDate, end: endDate }
}


function insertCalendarButtons() {
    const el = document.querySelector('.date_data');
    if (!el) return;

    const text = el.textContent.trim();
    let dates;

    try {
        dates = parseJamDates(text);
    } catch (e) {
        console.error('Failed to parse jam dates:', e);
        return;
    }

    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '10px';
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'center';
    btnContainer.style.gap = '8px';

    const payload = {
        title: document.querySelector('.jam_title_header a')?.textContent ?? document.title,
        description: `Game jam from ${window.location.origin + window.location.pathname}`,
        start: dates.start,
        end: dates.end,
        location: "Online"
    };

    const makeButton = (label, onClick) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.padding = '6px 10px';
        btn.style.cursor = 'pointer';
        btn.style.border = '1px solid #888';
        btn.style.borderRadius = '4px';
        btn.style.background = '#f1f1f1';
        btn.onclick = () => onClick(payload);
        return btn;
    };

    btnContainer.appendChild(makeButton('🗓 Google Calendar', openGoogleCalendar));
    btnContainer.appendChild(makeButton('📧 Outlook', openOutlookCalendar));
    btnContainer.appendChild(makeButton('📥 Apple / .ics', createDownloadICSFile));

    el.parentNode.insertBefore(btnContainer, el.nextSibling);
}

window.addEventListener('load', insertCalendarButtons);