import * as cheerio from 'cheerio';

const BASE_URL = 'http://www.echecs.asso.fr/ListeTournois.aspx';

function extractHiddenFields($: cheerio.CheerioAPI) {
    return {
        '__VIEWSTATE': $('#__VIEWSTATE').val() || '',
        '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val() || '',
        '__EVENTVALIDATION': $('#__EVENTVALIDATION').val() || '',
    };
}

function parseTournamentsOnPage($: cheerio.CheerioAPI): any[] {
    const items: any[] = [];
    const rows = $('tr').filter((_, el) => $(el).find('a[href*="FicheTournoi.aspx"]').length > 0);

    rows.each((_, row) => {
        const cells = $(row).find('td');
        const nameEl = cells.eq(3).find('a');
        const name = nameEl.text().trim();
        const link = 'http://www.echecs.asso.fr/' + nameEl.attr('href');
        const ref = new URL(link, 'http://www.echecs.asso.fr').searchParams.get('Ref');

        if (name) {
            items.push({ id: ref, name });
        }
    });

    return items;
}

async function debugScraper() {
    const category = 'RAPIDESAVENIR';

    console.log(`--- FETCHING PAGE 1 (GET) for ${category} ---`);
    const firstPageRes = await fetch(`${BASE_URL}?Action=${category}`);
    const firstPageHtml = await firstPageRes.text();
    let $ = cheerio.load(firstPageHtml);
    let page1 = parseTournamentsOnPage($);
    console.log(`Page 1 sample: ${page1[0]?.name} (Ref: ${page1[0]?.id})`);

    let hiddenFields = extractHiddenFields($);

    console.log(`--- FETCHING PAGE 2 (POST) for ${category} ---`);
    const formData = new URLSearchParams();
    formData.append('__EVENTTARGET', 'ctl00$ContentPlaceHolderMain$PagerHeader');
    formData.append('__EVENTARGUMENT', '2');
    formData.append('__VIEWSTATE', hiddenFields.__VIEWSTATE as string);
    formData.append('__VIEWSTATEGENERATOR', hiddenFields.__VIEWSTATEGENERATOR as string);
    formData.append('__EVENTVALIDATION', hiddenFields.__EVENTVALIDATION as string);

    const postRes = await fetch(`${BASE_URL}?Action=${category}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${BASE_URL}?Action=${category}`,
            'User-Agent': 'Mozilla/5.0'
        },
        body: formData.toString()
    });

    const postHtml = await postRes.text();
    $ = cheerio.load(postHtml);
    let page2 = parseTournamentsOnPage($);
    if (page2.length > 0) {
        console.log(`Page 2 sample: ${page2[0]?.name} (Ref: ${page2[0]?.id})`);
    } else {
        console.log("Page 2 is empty!");
    }
}

debugScraper();
