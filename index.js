const icsFormat = (date) => date
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';

function openGoogleCalendar({title, description, start, end, location}) {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', title);
    url.searchParams.set('details', description);
    url.searchParams.set('location', location);
    url.searchParams.set('dates', `${icsFormat(start)}/${icsFormat(end)}`);

    window.open(url.toString(), '_blank');
}

function openOutlookCalendar({title, description, start, end, location}) {
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

function createDownloadICSFile({title, description, start, end, location}) {
    const icsBody = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:Calendar',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VTIMEZONE',
        'END:VTIMEZONE',
        'BEGIN:VEVENT',
        'SUMMARY:' + title,
        'UID:@Default',
        'SEQUENCE:0',
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'DTSTART:' + icsFormat(start),
        'DTEND:' + icsFormat(end),
        'LOCATION:' + location,
        'DESCRIPTION:' + description,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

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

    return {start: startDate, end: endDate}
}


function insertCalendarButtons() {
    const dateDataElement = document.querySelector('.date_data');
    if (!dateDataElement) return;

    const dateTextValue = dateDataElement.textContent.trim();
    let dates;

    try {
        dates = parseJamDates(dateTextValue);
    } catch (e) {
        console.error('Failed to parse jam dates:', e);
        return;
    }

    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '10px';
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'center';
    btnContainer.style.alignItems = 'center';
    btnContainer.style.gap = '8px';

    const payload = {
        title: document.querySelector('.jam_title_header a')?.textContent ?? document.title,
        description: `${window.location.origin + window.location.pathname}`,
        start: dates.start,
        end: dates.end,
        location: "Online"
    };

    const makeButton = (label, onClick) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.classList.add('button'); // use jam's page button style
        btn.onclick = () => onClick(payload);
        return btn;
    };

    var addToCalendar = document.createElement("div")
    addToCalendar.textContent = "Add to Calendar: "
    btnContainer.appendChild(addToCalendar)
    btnContainer.appendChild(makeButton('Google', openGoogleCalendar));
    btnContainer.appendChild(makeButton('Outlook', openOutlookCalendar));
    btnContainer.appendChild(makeButton('iCloud / .ics', createDownloadICSFile));

    dateDataElement.parentNode.insertBefore(btnContainer, dateDataElement.nextSibling);
}

window.addEventListener('load', insertCalendarButtons);